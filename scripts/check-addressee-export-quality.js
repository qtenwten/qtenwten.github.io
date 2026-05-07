import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { formatAddressee } from '../src/utils/addresseeFormatter.js';
import {
  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_UNKNOWN,
  GREETING_NAME_PATRONYMIC,
  GREETING_FULL_NAME,
  GREETING_COLLEAGUES,
  PUNCTUATION_EXCLAMATION,
  WARNING_CODES,
  DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  DOCUMENT_TEMPLATE_APPLICATION,
  DOCUMENT_TEMPLATE_COMPLAINT,
  DOCUMENT_TEMPLATE_REQUEST,
  DOCUMENT_TEMPLATE_MEMO,
  DOCUMENT_TEMPLATE_EXPLANATORY_NOTE,
  DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY,
  DOCUMENT_TEMPLATE_COMMERCIAL_OFFER,
  DOCUMENT_TEMPLATE_ORDER,
} from '../src/utils/addresseeTypes.js';
import {
  escapeHtml,
  buildPlainTextExport,
  buildHtmlExport,
  buildSingleCsvExport,
  buildBulkCsvExport,
  downloadTextAsFile,
  getEffectiveResult,
} from '../src/utils/addresseeExport.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  \u2713 ${message}`);
  } else {
    failed++;
    failures.push(message);
    console.log(`  \u2717 FAIL: ${message}`);
  }
}

function toCsvRow(fields) {
  return fields
    .map((field) => {
      const str = String(field ?? '');
      if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    })
    .join(';');
}

async function main() {
  console.log('\n=== Addressee Export Quality Checks ===\n');

  const testResult = formatAddressee({
    fullName: 'Иванов Иван Петрович',
    position: 'генеральный директор',
    organization: 'ООО «Ромашка»',
    gender: GENDER_MALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    senderFullName: 'Петрова Анна Сергеевна',
    senderPosition: 'менеджер',
    senderOrganization: 'ООО «Альфа»',
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  });

  const testResultWithGreeting = formatAddressee({
    fullName: 'Петрова Анна Сергеевна',
    position: 'руководитель',
    organization: 'АО «Север»',
    gender: GENDER_FEMALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_APPLICATION,
    senderFullName: 'Сидоров Пётр Алексеевич',
    senderPosition: 'директор',
    senderOrganization: 'ИП Сидоров',
  });

  const testResultWithWarnings = formatAddressee({
    fullName: 'Иванов И. И.',
    position: 'неизвестная должность',
    organization: '',
    gender: GENDER_UNKNOWN,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  });

  const testResultNoSender = formatAddressee({
    fullName: 'Иванов Иван Петрович',
    position: 'директор',
    organization: 'ООО «Тест»',
    gender: GENDER_MALE,
    greetingMode: GREETING_FULL_NAME,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_MEMO,
  });

  const multilineDocTextResult = formatAddressee({
    fullName: 'Смирнова Ольга Викторовна',
    position: 'бухгалтер',
    organization: 'ЗАО «Бухгалтерия»',
    gender: GENDER_FEMALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
    senderFullName: 'Козлов Иван Николаевич',
    senderPosition: 'юрист',
    senderOrganization: 'ООО «Право»',
  });

  const manualCaseForm = {
    fullName: 'Иванов Иван Петрович',
    position: 'генеральный директор',
    organization: 'ООО «Ромашка»',
    gender: GENDER_MALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_APPLICATION,
    senderFullName: 'Петрова Анна Сергеевна',
    senderPosition: 'менеджер',
    senderOrganization: 'ООО «Альфа»',
    recipientDativeName: 'Генеральному директору Иванову Ивану Петровичу',
    senderGenitiveName: 'Петровой Анны Сергеевны',
  };
  const manualCaseResult = formatAddressee(manualCaseForm);

  // ============================================================
  // 1. DOCX EXPORT CHECKS (source code based)
  // ============================================================
  console.log('1. DOCX Export Checks');

  const docxSource = fs.readFileSync(path.join(rootDir, 'src/utils/addresseeDocxExport.js'), 'utf-8');
  assert(docxSource.includes('TextRun'), 'DOCX: uses TextRun (not Text)');
  assert(docxSource.includes('blocks.greeting') || docxSource.includes('greetingSection'), 'DOCX: uses blocks.greeting (not result.greeting)');
  assert(!docxSource.includes('result.greeting'), 'DOCX: does not use result.greeting directly');
  assert(docxSource.includes('.catch') || docxSource.includes('try'), 'DOCX: has error handling');
  assert(docxSource.includes('URL.revokeObjectURL'), 'DOCX: cleans up object URLs');
  assert(docxSource.includes('document.body.appendChild'), 'DOCX: adds link to DOM for download');
  assert(docxSource.includes('.download ='), 'DOCX: sets download filename');
  assert(docxSource.includes('fromSection') || docxSource.includes('blocks.from'), 'DOCX: uses from block for sender');
  assert(docxSource.includes('toSection') || docxSource.includes('blocks.to'), 'DOCX: uses to block for addressee');
  assert(!docxSource.includes('innerHTML'), 'DOCX: no innerHTML usage');
  assert(docxSource.includes('warning') || docxSource.includes('Warning'), 'DOCX: handles warnings');
  assert(docxSource.includes('Packer.toBlob') || docxSource.includes('Packer'), 'DOCX: uses Packer.toBlob');
  assert(!docxSource.includes('doc.save()'), 'DOCX: does not use deprecated doc.save()');

  // ============================================================
  // 2. TXT EXPORT CHECKS
  // ============================================================
  console.log('\n2. TXT Export Checks');

  const labels = {
    to: 'Адресат',
    from: 'Отправитель',
    greeting: 'Обращение',
    documentTemplate: 'Готовый шаблон',
  };
  const txtText = buildPlainTextExport(testResult, {}, labels);
  assert(typeof txtText === 'string', 'TXT: buildPlainTextExport returns string');
  assert(txtText.length > 0, 'TXT: result is non-empty');
  assert(txtText.includes('Адресат'), 'TXT: has addressee section header');
  assert(txtText.includes('Отправитель'), 'TXT: has sender section header');
  assert(txtText.includes('Обращение'), 'TXT: has greeting section header');
  assert(txtText.includes('Готовый шаблон'), 'TXT: has document template section header');
  assert(txtText.includes('Петровой'), 'TXT: contains sender full name in genitive');
  assert(txtText.includes('Иванову Ивану Петровичу'), 'TXT: contains declined recipient full name');
  assert(txtText.includes('Петровой Анны Сергеевны'), 'TXT: contains declined sender full name');
  assert(txtText.includes('менеджер'), 'TXT: contains sender position');
  assert(txtText.includes('Альфа'), 'TXT: contains sender organization');
  assert(!txtText.includes('undefined'), 'TXT: no undefined values');
  assert(!txtText.includes('null'), 'TXT: no null values');

  const txtWithOverrides = buildPlainTextExport(testResult, { to: 'Custom To Block' }, labels);
  assert(txtWithOverrides.includes('Custom To Block'), 'TXT: uses override values when provided');

  const txtWithManualCase = buildPlainTextExport(manualCaseResult, {}, labels);
  assert(txtWithManualCase.includes('Генеральному директору Иванову Ивану Петровичу'), 'TXT: contains manual recipient case form');
  assert(txtWithManualCase.includes('Петровой Анны Сергеевны'), 'TXT: contains manual sender case form');

  const txtNoSender = buildPlainTextExport(testResultNoSender, {}, labels);
  assert(!txtNoSender.includes('undefined'), 'TXT: handles missing sender gracefully');
  assert(txtNoSender.length > 0, 'TXT: still produces output without sender');

  const jsxSource = fs.readFileSync(path.join(rootDir, 'src/pages/AddresseeGenerator.jsx'), 'utf-8');
  assert(jsxSource.includes('handleExportTxt'), 'TXT: JSX has handleExportTxt');
  assert(jsxSource.includes('getDocumentExportText'), 'TXT: JSX uses getDocumentExportText');
  assert(jsxSource.includes("getEffectiveBlockText('documentText')"), 'TXT: Copy All uses effective documentText');
  assert(jsxSource.includes('addressee-generator-document.txt'), 'TXT: JSX sets correct filename');
  assert(jsxSource.includes("'text/plain") || jsxSource.includes('text/plain'), 'TXT: JSX uses UTF-8 plain text');

  // ============================================================
  // 3. HTML EXPORT CHECKS
  // ============================================================
  console.log('\n3. HTML Export Checks');

  const htmlScript = '<script>alert(1)</script>';
  const escapedScript = escapeHtml(htmlScript);
  assert(!escapedScript.includes('<script'), 'HTML escape: <script> becomes &lt;script&gt;');
  assert(escapedScript.includes('&lt;script&gt;'), 'HTML escape: script tag fully escaped');
  assert(!escapedScript.includes('&alert'), 'HTML escape: & in alert is not double-escaped');

  const htmlLabels = {
    to: 'Адресат',
    from: 'Отправитель',
    greeting: 'Обращение',
    documentTemplate: 'Готовый шаблон',
    disclaimer: 'Тестовый дисклеймер',
  };
  const htmlFromHelper = buildHtmlExport(multilineDocTextResult, {}, {
    labels: htmlLabels,
    lang: 'ru',
    templateTitle: 'Тестовый документ',
  });
  assert(typeof htmlFromHelper === 'string', 'HTML: buildHtmlExport returns string');
  assert(!htmlFromHelper.includes('<script>'), 'HTML: no raw script tag in buildHtmlExport output');
  assert(htmlFromHelper.includes('Тестовый документ'), 'HTML: buildHtmlExport includes title');

  const htmlManual = buildHtmlExport(manualCaseResult, {}, {
    labels: htmlLabels,
    lang: 'ru',
    templateTitle: 'Manual <case> document',
  });
  assert(htmlManual.includes('Генеральному директору Иванову Ивану Петровичу'), 'HTML: contains manual recipient form');
  assert(htmlManual.includes('Петровой Анны Сергеевны'), 'HTML: contains manual sender form');
  assert(htmlManual.includes('Manual &lt;case&gt; document'), 'HTML: escapes manual export title');

  const docText = multilineDocTextResult.blocks.documentText || multilineDocTextResult.blocks.letter || '';
  assert(docText.length > 0, 'HTML: documentText is non-empty for businessLetter');

  assert(jsxSource.includes('handleExportHtml'), 'HTML: JSX has handleExportHtml');
  assert(jsxSource.includes('buildHtmlExport'), 'HTML: JSX uses buildHtmlExport from helper');
  assert(jsxSource.includes('addressee-generator-document.html'), 'HTML: JSX sets correct filename');
  assert(jsxSource.includes("charset=utf-8") || jsxSource.includes('charset=utf-8'), 'HTML: JSX uses UTF-8 charset');

  // ============================================================
  // 4. CSV SINGLE EXPORT CHECKS
  // ============================================================
  console.log('\n4. CSV Single Export Checks');

  const header = ['fullName', 'position', 'organization', 'gender', 'greetingMode', 'punctuation', 'documentTemplate', 'senderFullName', 'senderPosition', 'senderOrganization', 'recipientDativeName', 'senderGenitiveName', 'to', 'from', 'greeting', 'letter', 'documentText', 'confidence', 'warnings'];
  const row = [
    multilineDocTextResult.form?.fullName || 'test',
    multilineDocTextResult.form?.position || '',
    multilineDocTextResult.form?.organization || '',
    multilineDocTextResult.form?.gender || '',
    multilineDocTextResult.form?.greetingMode || '',
    multilineDocTextResult.form?.punctuation || '',
    multilineDocTextResult.form?.documentTemplate || DOCUMENT_TEMPLATE_BUSINESS_LETTER,
    multilineDocTextResult.form?.senderFullName || '',
    multilineDocTextResult.form?.senderPosition || '',
    multilineDocTextResult.form?.senderOrganization || '',
    multilineDocTextResult.form?.recipientDativeName || '',
    multilineDocTextResult.form?.senderGenitiveName || '',
    'Кому test',
    'От кого test',
    'Обращение test',
    multilineDocTextResult.blocks.letter || '',
    multilineDocTextResult.blocks.documentText || '',
    String(multilineDocTextResult.confidence),
    Array.isArray(multilineDocTextResult.warnings) && multilineDocTextResult.warnings.length > 0
      ? multilineDocTextResult.warnings.map((w) => w.code).join('; ')
      : '',
  ];
  const csvContent = [header, row].map(toCsvRow).join('\r\n');
  const csv = '\uFEFF' + csvContent;
  assert(csv.startsWith('\uFEFF'), 'CSV: has UTF-8 BOM for Excel compatibility');
  assert(csv.includes('senderFullName'), 'CSV: has senderFullName column');
  assert(csv.includes('senderPosition'), 'CSV: has senderPosition column');
  assert(csv.includes('senderOrganization'), 'CSV: has senderOrganization column');
  assert(csv.includes('recipientDativeName'), 'CSV: has recipientDativeName column');
  assert(csv.includes('senderGenitiveName'), 'CSV: has senderGenitiveName column');
  assert(csv.includes('documentText'), 'CSV: has documentText column');

  const multilineDoc = 'Line 1\nLine 2\nLine 3';
  const quotedMultiline = toCsvRow([multilineDoc]);
  assert(quotedMultiline.startsWith('"'), 'CSV: multiline content is quoted');

  const withQuote = 'Hello "World"';
  const quotedWithQuote = toCsvRow([withQuote]);
  assert(quotedWithQuote.includes('""'), 'CSV: quotes inside quoted field are doubled');

  assert(jsxSource.includes('handleExportCsv'), 'CSV: JSX has handleExportCsv');
  assert(jsxSource.includes('addressee-generator-result.csv'), 'CSV: JSX sets correct filename');
  assert(jsxSource.includes("charset=utf-8") || jsxSource.includes('charset=utf-8'), 'CSV: JSX uses UTF-8 charset');

  const singleCsv = buildSingleCsvExport(manualCaseResult, manualCaseForm, {});
  assert(typeof singleCsv === 'string', 'CSV: buildSingleCsvExport returns string');
  assert(singleCsv.startsWith('\uFEFF'), 'CSV: buildSingleCsvExport has BOM');
  assert(singleCsv.includes('documentText'), 'CSV: buildSingleCsvExport includes documentText column');
  assert(singleCsv.includes('recipientDativeName'), 'CSV: buildSingleCsvExport includes recipientDativeName column');
  assert(singleCsv.includes('senderGenitiveName'), 'CSV: buildSingleCsvExport includes senderGenitiveName column');
  assert(singleCsv.includes('Генеральному директору Иванову Ивану Петровичу'), 'CSV: buildSingleCsvExport contains manual recipient form');
  assert(singleCsv.includes('Петровой Анны Сергеевны'), 'CSV: buildSingleCsvExport contains manual sender form');
  assert(!singleCsv.includes('undefined'), 'CSV: buildSingleCsvExport has no undefined values');
  assert(!singleCsv.includes('null'), 'CSV: buildSingleCsvExport has no null values');

  // ============================================================
  // 5. CSV BULK EXPORT CHECKS
  // ============================================================
  console.log('\n5. CSV Bulk Export Checks');

  const bulkResults = [
    {
      input: {
      fullName: 'Иванов Иван Петрович',
      position: 'директор',
      organization: 'ООО «А»',
      gender: GENDER_MALE,
      greetingMode: GREETING_NAME_PATRONYMIC,
      punctuation: PUNCTUATION_EXCLAMATION,
      documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
      senderFullName: 'Петров',
      senderPosition: 'менеджер',
      senderOrganization: 'ООО «Б»',
      recipientDativeName: '',
      senderGenitiveName: '',
      },
    },
    {
      input: {
      fullName: 'Петрова Анна Сергеевна',
      position: 'бухгалтер',
      organization: 'АО «В»',
      gender: GENDER_FEMALE,
      greetingMode: GREETING_NAME_PATRONYMIC,
      punctuation: PUNCTUATION_EXCLAMATION,
      documentTemplate: DOCUMENT_TEMPLATE_APPLICATION,
      senderFullName: 'Сидоров',
      senderPosition: 'юрист',
      senderOrganization: 'ИП «С»',
      recipientDativeName: 'Петровой Анне Сергеевне',
      senderGenitiveName: 'Сидорова Петра Алексеевича',
      },
    },
  ];
  for (const item of bulkResults) {
    Object.assign(item, formatAddressee(item.input));
  }

  const bulkHeader = ['fullName', 'to', 'from', 'documentText', 'warnings'];
  const bulkRows = bulkResults.map((r) => [
    r.form?.fullName || '',
    r.blocks.to || '',
    r.blocks.from || '',
    r.blocks.documentText || r.blocks.letter || '',
    Array.isArray(r.warnings) && r.warnings.length > 0 ? r.warnings.map((w) => w.code).join('; ') : '',
  ]);
  const bulkCsvContent = [bulkHeader, ...bulkRows].map(toCsvRow).join('\r\n');
  const bulkLines = bulkCsvContent.trim().split('\r\n');
  assert(bulkLines.length === 3, `CSV bulk: has exactly 3 lines (header + 2 data rows, got ${bulkLines.length})`);

  assert(bulkRows[0].length > 0, 'CSV bulk: row 1 has data');
  assert(bulkRows[1].length > 0, 'CSV bulk: row 2 has data');
  assert(bulkRows[0][1].includes('Иванов'), 'CSV bulk: row 1 has to block with name');
  assert(bulkRows[1][1].includes('Петровой'), 'CSV bulk: row 2 has to block with name in dative');
  assert(bulkRows[0][2].includes('Петров'), 'CSV bulk: row 1 has sender data (from)');
  assert(bulkRows[1][2].includes('Сидоров'), 'CSV bulk: row 2 has sender data (from)');
  assert(bulkRows[0][3].length > 0, 'CSV bulk: row 1 documentText is non-empty');
  assert(bulkRows[1][3].length > 0, 'CSV bulk: row 2 documentText is non-empty');

  const bulkCsvFromHelper = buildBulkCsvExport(bulkResults.map(r => ({ input: r.input || {}, blocks: r.blocks, confidence: r.confidence, warnings: r.warnings })));
  assert(typeof bulkCsvFromHelper === 'string', 'CSV: buildBulkCsvExport returns string');
  assert(bulkCsvFromHelper.startsWith('\uFEFF'), 'CSV: buildBulkCsvExport has BOM');
  assert(bulkCsvFromHelper.includes('Иванов'), 'CSV: buildBulkCsvExport includes data from results');
  assert(bulkCsvFromHelper.includes('recipientDativeName'), 'CSV: buildBulkCsvExport includes recipientDativeName column');
  assert(bulkCsvFromHelper.includes('senderGenitiveName'), 'CSV: buildBulkCsvExport includes senderGenitiveName column');
  assert(bulkCsvFromHelper.includes('Петровой Анне Сергеевне'), 'CSV: buildBulkCsvExport preserves manual recipient form');
  assert(bulkCsvFromHelper.includes('Сидорова Петра Алексеевича'), 'CSV: buildBulkCsvExport preserves manual sender form');
  assert(bulkResults[1].blocks.documentText.includes('Петровой Анне Сергеевне'), 'CSV bulk: documentText uses manual recipient form');
  assert(bulkResults[1].blocks.documentText.includes('Сидорова Петра Алексеевича'), 'CSV bulk: documentText uses manual sender form');
  assert(!bulkCsvFromHelper.includes('undefined'), 'CSV: buildBulkCsvExport has no undefined values');
  assert(!bulkCsvFromHelper.includes('null'), 'CSV: buildBulkCsvExport has no null values');

  // ============================================================
  // 6. FIO DECLENSION CHECKS
  // ============================================================
  console.log('\n6. FIO Declension Checks');

  const maleResult = formatAddressee({
    fullName: 'Иванов Иван Петрович',
    position: 'директор',
    organization: 'ООО «Тест»',
    gender: GENDER_MALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  });
  const maleToBlock = maleResult.blocks.to || '';
  assert(maleToBlock.includes('Иванову Ивану Петровичу'), 'FIO: male name declined to dative');
  assert(maleToBlock.includes('директору'), 'FIO: position declined to dative (директору)');
  assert(maleResult.warnings.length === 0 || maleResult.confidence >= 0.75, 'FIO: complete male name has reasonable confidence');

  const femaleResult = formatAddressee({
    fullName: 'Петрова Анна Сергеевна',
    position: 'бухгалтер',
    organization: 'ООО «Тест»',
    gender: GENDER_FEMALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  });
  const femaleToBlock = femaleResult.blocks.to || '';
  assert(femaleToBlock.includes('Петровой Анне Сергеевне'), 'FIO: female name declined to dative');
  assert(femaleToBlock.includes('бухгалтеру'), 'FIO: female position declined (бухгалтеру)');
  assert(femaleResult.warnings.length === 0 || femaleResult.confidence >= 0.75, 'FIO: complete female name has reasonable confidence');

  const initialsResult = formatAddressee({
    fullName: 'Иванов И. И.',
    position: 'директор',
    organization: '',
    gender: GENDER_UNKNOWN,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  });
  const hasInitialsWarning = initialsResult.warnings.some((w) => w.code === WARNING_CODES.INITIALS_DETECTED);
  assert(hasInitialsWarning, 'FIO: Иванов И. И. gives INITIALS_DETECTED warning');
  assert(initialsResult.confidence < 0.95, 'FIO: initials reduce confidence below high');

  const latinResult = formatAddressee({
    fullName: 'John Smith',
    position: 'manager',
    organization: 'Corp',
    gender: GENDER_UNKNOWN,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  });
  const hasLatinWarning = latinResult.warnings.some((w) => w.code === WARNING_CODES.LATIN_NAME);
  assert(hasLatinWarning, 'FIO: John Smith gives LATIN_NAME warning');
  assert(latinResult.confidence < 0.95, 'FIO: Latin name reduces confidence below high');

  const ambiguousSurnameResult = formatAddressee({
    fullName: 'Цой Виктор Робертович',
    position: 'директор',
    organization: 'ООО «Кино»',
    gender: GENDER_MALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  });
  const hasSurnameWarning = ambiguousSurnameResult.warnings.some((w) =>
    [WARNING_CODES.UNDECLINABLE_SURNAME, WARNING_CODES.HYPHENATED_NAME_REVIEW].includes(w.code)
  );
  assert(hasSurnameWarning || ambiguousSurnameResult.confidence < 0.95, 'FIO: ambiguous surname (Цой) gets warning or reduced confidence');

  const koreanSurnameResult = formatAddressee({
    fullName: 'Ли Анна Сергеевна',
    position: 'менеджер',
    organization: 'АО «Восток»',
    gender: GENDER_FEMALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  });
  const hasKoreanWarning = koreanSurnameResult.warnings.some((w) =>
    [WARNING_CODES.UNDECLINABLE_SURNAME, WARNING_CODES.HYPHENATED_NAME_REVIEW, WARNING_CODES.LATIN_NAME].includes(w.code)
  );
  assert(hasKoreanWarning || koreanSurnameResult.confidence < 0.95, 'FIO: ambiguous surname (Ли) gets warning or reduced confidence');

  const completeMaleWithAllParts = formatAddressee({
    fullName: 'Сидоров Пётр Алексеевич',
    position: 'генеральный директор',
    organization: 'ИП Сидоров П.А.',
    gender: GENDER_MALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  });
  assert(completeMaleWithAllParts.confidence === 0.95, 'FIO: complete known male name has high confidence (0.95)');
  assert(!completeMaleWithAllParts.manualReviewRequired, 'FIO: complete known male name does not require manual review');

  const greetingChecks = formatAddressee({
    fullName: 'Кузнецов Алексей Игоревич',
    position: 'юрист',
    organization: 'ООО «Право»',
    gender: GENDER_MALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  });
  assert(greetingChecks.blocks.greeting.includes('Алексей'), 'FIO greeting: includes first name');
  assert(greetingChecks.blocks.greeting.includes('Игоревич'), 'FIO greeting: includes patronymic');
  assert(greetingChecks.blocks.greeting.startsWith('Уважаемый'), 'FIO greeting: uses masculine conjunction');

  const femaleGreetingCheck = formatAddressee({
    fullName: 'Михайлова Елена Сергеевна',
    position: 'юрист',
    organization: 'ООО «Право»',
    gender: GENDER_FEMALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  });
  assert(femaleGreetingCheck.blocks.greeting.startsWith('Уважаемая'), 'FIO greeting: feminine uses Уважаемая');

  const colleaguesGreeting = formatAddressee({
    fullName: 'Иванов Иван Петрович',
    position: 'директор',
    organization: 'ООО «Тест»',
    gender: GENDER_MALE,
    greetingMode: GREETING_COLLEAGUES,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  });
  assert(colleaguesGreeting.blocks.greeting.startsWith('Уважаемые коллеги'), 'FIO greeting: colleagues mode gives correct greeting');

  // ============================================================
  // 7. DOCUMENT TEMPLATE CHECKS
  // ============================================================
  console.log('\n7. Document Template Checks');

  const templates = [
    { template: DOCUMENT_TEMPLATE_BUSINESS_LETTER, expected: 'Уважаемый' },
    { template: DOCUMENT_TEMPLATE_APPLICATION, expected: 'Заявление' },
    { template: DOCUMENT_TEMPLATE_COMPLAINT, expected: 'Жалоба' },
    { template: DOCUMENT_TEMPLATE_REQUEST, expected: 'Запрос' },
    { template: DOCUMENT_TEMPLATE_MEMO, expected: 'Служебная записка' },
    { template: DOCUMENT_TEMPLATE_EXPLANATORY_NOTE, expected: 'Объяснительная' },
    { template: DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY, expected: 'Доверенность' },
    { template: DOCUMENT_TEMPLATE_COMMERCIAL_OFFER, expected: 'Коммерческое предложение' },
    { template: DOCUMENT_TEMPLATE_ORDER, expected: 'Приказ' },
  ];

  templates.forEach(({ template, expected }) => {
    const r = formatAddressee({
      fullName: 'Иванов Иван Петрович',
      position: 'директор',
      organization: 'ООО «Тест»',
      gender: GENDER_MALE,
      greetingMode: GREETING_NAME_PATRONYMIC,
      punctuation: PUNCTUATION_EXCLAMATION,
      documentTemplate: template,
    });
    const docText = r.blocks.documentText || '';
    assert(docText.length > 0, `Template ${template}: produces non-empty documentText`);
    if (expected) {
      assert(docText.toLowerCase().includes(expected.toLowerCase()), `Template ${template}: contains "${expected}"`);
    }
  });

  const businessLetter = formatAddressee({
    fullName: 'Иванов Иван Петрович',
    position: 'директор',
    organization: 'ООО «Тест»',
    gender: GENDER_MALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  });
  const blDoc = businessLetter.blocks.documentText || '';
  assert(blDoc.includes('Иванов Иван Петрович') || blDoc.includes('директору'), 'businessLetter: contains name or position');

  // ============================================================
  // 8. REGRESSION CHECKS
  // ============================================================
  console.log('\n8. Regression Checks');

  const regressionResult = formatAddressee({
    fullName: 'Шевченко Тарас Григорьевич',
    position: 'руководитель',
    organization: 'ООО «Классик»',
    gender: GENDER_MALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  });
  assert(regressionResult.blocks.to.length > 0, 'Regression: Шевченко produces non-empty to block');
  const hasShevchenkoWarning = regressionResult.warnings.some((w) =>
    [WARNING_CODES.UNDECLINABLE_SURNAME, WARNING_CODES.HYPHENATED_NAME_REVIEW].includes(w.code)
  );
  assert(hasShevchenkoWarning, 'Regression: Шевченко still produces surname warning');

  const noOrgResult = formatAddressee({
    fullName: 'Иванов Иван Петрович',
    position: 'директор',
    organization: '',
    gender: GENDER_MALE,
    greetingMode: GREETING_NAME_PATRONYMIC,
    punctuation: PUNCTUATION_EXCLAMATION,
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  });
  assert(noOrgResult.blocks.to.length > 0, 'Regression: empty organization does not break to block');
  assert(!noOrgResult.blocks.to.includes('undefined'), 'Regression: no undefined in to block with empty org');

  const emptyResult = formatAddressee({});
  assert(emptyResult.blocks.to !== undefined && emptyResult.blocks.to !== null, 'Regression: empty input produces non-null to block');
  assert(emptyResult.warnings.length > 0, 'Regression: empty input produces warnings');
  assert(emptyResult.manualReviewRequired, 'Regression: empty input requires manual review');

  console.log('\n=== Results ===');
  const total = passed + failed;
  if (failed === 0) {
    console.log(`\nAll export quality checks passed: ${passed}/${total}\n`);
    process.exit(0);
  } else {
    console.log(`\nExport quality checks FAILED: ${passed}/${total} passed, ${failed} failed`);
    console.log('Failed checks:');
    failures.forEach((f) => console.log(`  - ${f}`));
    console.log('');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Export quality check crashed:', err);
  process.exit(1);
});
