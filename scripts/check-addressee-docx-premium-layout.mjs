import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import { formatAddressee } from '../src/utils/addresseeFormatter.js';
import {
  GENDER_MALE,
  GENDER_FEMALE,
  GREETING_NAME_PATRONYMIC,
  PUNCTUATION_EXCLAMATION,
  DOCUMENT_TEMPLATE_APPLICATION,
  DOCUMENT_TEMPLATE_COMPLAINT,
  DOCUMENT_TEMPLATE_REQUEST,
  DOCUMENT_TEMPLATE_MEMO,
  DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  DOCUMENT_TEMPLATE_ORDER,
  DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY,
} from '../src/utils/addresseeTypes.js';

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

const FORBIDDEN_DOCX_STRINGS = [
  'Адресат', 'Отправитель', 'Обращение', 'Готовый шаблон документа',
  'Предупреждения', 'Уверенность', 'Confidence', 'Warning',
  'Проверка документного блока', 'Пояснения', 'manualReviewRequired',
  'confidence', 'blocks.', 'recipientDativeName', 'senderGenitiveName',
];

const EXPECTED_DOCX_TITLES = {
  [DOCUMENT_TEMPLATE_APPLICATION]: 'ЗАЯВЛЕНИЕ',
  [DOCUMENT_TEMPLATE_COMPLAINT]: 'ЖАЛОБА',
  [DOCUMENT_TEMPLATE_REQUEST]: 'ЗАПРОС',
  [DOCUMENT_TEMPLATE_MEMO]: 'СЛУЖЕБНАЯ ЗАПИСКА',
  [DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY]: 'ДОВЕРЕННОСТЬ',
  [DOCUMENT_TEMPLATE_ORDER]: 'ПРИКАЗ',
  [DOCUMENT_TEMPLATE_BUSINESS_LETTER]: null,
};

const FORBIDDEN_DOCX_TITLES = {
  [DOCUMENT_TEMPLATE_BUSINESS_LETTER]: ['ЗАЯВЛЕНИЕ', 'ЖАЛОБА', 'СЛУЖЕБНАЯ ЗАПИСКА', 'ОБЪЯСНИТЕЛЬНАЯ ЗАПИСКА'],
};

const NO_GREETING_TEMPLATES = [DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY, DOCUMENT_TEMPLATE_ORDER];

function getDocxXml(docxBuffer) {
  return JSZip.loadAsync(docxBuffer).then(zip => {
    const docXml = zip.file('word/document.xml');
    if (!docXml) return null;
    return docXml.async('string');
  });
}

async function checkDocxFile(label, docxBuffer, options = {}) {
  const { expectTitle, forbiddenTitles = [], checkGreeting = true, checkNoGreeting = false } = options;
  const xml = await getDocxXml(docxBuffer);
  if (!xml) {
    assert(false, `${label}: cannot read document.xml from DOCX`);
    return;
  }

  assert(xml.length > 1000, `${label}: document.xml is non-empty (${xml.length} chars)`);

  const forbidden = FORBIDDEN_DOCX_STRINGS.filter(s => xml.includes(s));
  assert(forbidden.length === 0, `${label}: no forbidden service strings (found: ${forbidden.join(', ')})`);

  if (expectTitle) {
    const cleaned = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    assert(cleaned.includes(expectTitle), `${label}: contains expected title "${expectTitle}"`);
  }

  if (forbiddenTitles.length > 0) {
    const cleaned = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    for (const badTitle of forbiddenTitles) {
      assert(!cleaned.includes(badTitle), `${label}: does NOT contain forbidden title "${badTitle}"`);
    }
  }

  const marginMatch = xml.match(/<w:pgMar[^>]+>/);
  if (marginMatch) {
    const m = marginMatch[0];
    const top = parseInt((m.match(/w:top="(\d+)"/) || [])[1] || '0');
    const bottom = parseInt((m.match(/w:bottom="(\d+)"/) || [])[1] || '0');
    const left = parseInt((m.match(/w:left="(\d+)"/) || [])[1] || '0');
    const right = parseInt((m.match(/w:right="(\d+)"/) || [])[1] || '0');

    const marginOk = top >= 1000 && top <= 1300 &&
      bottom >= 1000 && bottom <= 1300 &&
      left >= 1600 && left <= 1800 &&
      right >= 500 && right <= 700;
    assert(marginOk, `${label}: margins within spec (top=${top} bottom=${bottom} left=${left} right=${right})`);
  } else {
    assert(false, `${label}: page margins not found`);
  }

  const hasTimes = xml.includes('Times New Roman');
  assert(hasTimes, `${label}: Times New Roman font used`);

  const hasFloating = xml.includes('wp:floating') || xml.includes('wp:anchor');
  assert(!hasFloating, `${label}: no floating table (stable layout)`);
}

async function main() {
  console.log('\n=== Addressee Premium DOCX Layout Checks ===\n');

  const { generateAddresseeDocxBlob } = await import('../src/utils/addresseeDocxExport.js');
  const dummyT = (key) => key;

  const testCases = [
    {
      label: 'Application',
      formData: {
        fullName: 'Троицкий Григорий Владимирович',
        position: 'генеральный директор',
        organization: 'ООО «Ромашка»',
        gender: GENDER_MALE,
        greetingMode: GREETING_NAME_PATRONYMIC,
        punctuation: PUNCTUATION_EXCLAMATION,
        documentTemplate: DOCUMENT_TEMPLATE_APPLICATION,
        senderFullName: 'Иванова Екатерина Ивановна',
        senderPosition: 'менеджер по продажам',
        senderOrganization: 'ООО «Вектор»',
      },
      options: {
        expectTitle: 'ЗАЯВЛЕНИЕ',
        checkGreeting: true,
      },
    },
    {
      label: 'Complaint',
      formData: {
        fullName: 'Смирнова Анна Петровна',
        position: 'руководитель',
        organization: 'АО «Север»',
        gender: GENDER_FEMALE,
        greetingMode: GREETING_NAME_PATRONYMIC,
        punctuation: PUNCTUATION_EXCLAMATION,
        documentTemplate: DOCUMENT_TEMPLATE_COMPLAINT,
        senderFullName: 'Козлов Алексей Сергеевич',
        senderPosition: 'директор',
        senderOrganization: 'ИП Козлов',
      },
      options: {
        expectTitle: 'ЖАЛОБА',
        checkGreeting: true,
      },
    },
    {
      label: 'Request',
      formData: {
        fullName: 'Петров Алексей Иванович',
        position: 'начальник отдела',
        organization: 'ФГБУ «Тест»',
        gender: GENDER_MALE,
        greetingMode: GREETING_NAME_PATRONYMIC,
        punctuation: PUNCTUATION_EXCLAMATION,
        documentTemplate: DOCUMENT_TEMPLATE_REQUEST,
        senderFullName: 'Сидорова Мария Петровна',
        senderPosition: 'специалист',
        senderOrganization: 'ООО «Альфа»',
      },
      options: {
        expectTitle: 'ЗАПРОС',
        checkGreeting: true,
      },
    },
    {
      label: 'Memo',
      formData: {
        fullName: 'Смирнова Ольга Викторовна',
        position: 'бухгалтер',
        organization: 'ЗАО «Бухгалтерия»',
        gender: GENDER_FEMALE,
        greetingMode: GREETING_NAME_PATRONYMIC,
        punctuation: PUNCTUATION_EXCLAMATION,
        documentTemplate: DOCUMENT_TEMPLATE_MEMO,
        senderFullName: 'Козлов Иван Николаевич',
        senderPosition: 'юрист',
        senderOrganization: 'ООО «Право»',
      },
      options: {
        expectTitle: 'СЛУЖЕБНАЯ ЗАПИСКА',
        checkGreeting: true,
      },
    },
    {
      label: 'Business Letter',
      formData: {
        fullName: 'Иванов Иван Петрович',
        position: 'директор',
        organization: 'ООО «Тест»',
        gender: GENDER_MALE,
        greetingMode: GREETING_NAME_PATRONYMIC,
        punctuation: PUNCTUATION_EXCLAMATION,
        documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
        senderFullName: 'Петрова Анна Сергеевна',
        senderPosition: 'менеджер',
        senderOrganization: 'ООО «Альфа»',
      },
      options: {
        expectTitle: null,
        forbiddenTitles: ['ЗАЯВЛЕНИЕ', 'ЖАЛОБА', 'СЛУЖЕБНАЯ ЗАПИСКА'],
        checkGreeting: true,
      },
    },
    {
      label: 'PowerOfAttorney',
      formData: {
        fullName: 'Новиков Алексей Петрович',
        position: 'директор',
        organization: 'ООО «Доверитель»',
        gender: GENDER_MALE,
        greetingMode: GREETING_NAME_PATRONYMIC,
        punctuation: PUNCTUATION_EXCLAMATION,
        documentTemplate: DOCUMENT_TEMPLATE_POWER_OF_ATTORNEY,
        senderFullName: 'Петров Сергей Иванович',
        senderPosition: 'представитель',
        senderOrganization: 'ООО «Доверитель»',
      },
      options: {
        expectTitle: 'ДОВЕРЕННОСТЬ',
        checkGreeting: false,
      },
    },
    {
      label: 'Application with manual cases',
      formData: {
        fullName: 'Троицкий Григорий Владимирович',
        position: 'генеральный директор',
        organization: 'ООО «Ромашка»',
        gender: GENDER_MALE,
        greetingMode: GREETING_NAME_PATRONYMIC,
        punctuation: PUNCTUATION_EXCLAMATION,
        documentTemplate: DOCUMENT_TEMPLATE_APPLICATION,
        senderFullName: 'Иванова Екатерина Ивановна',
        senderPosition: 'менеджер по продажам',
        senderOrganization: 'ООО «Вектор»',
        recipientDativeName: 'Генеральному директору Троицкому Григорию Владимировичу',
        senderGenitiveName: 'Ивановой Екатерины Ивановны',
      },
      options: {
        expectTitle: 'ЗАЯВЛЕНИЕ',
        checkGreeting: true,
      },
    },
  ];

  for (const tc of testCases) {
    console.log(`\n${tc.label}:`);
    const result = formatAddressee(tc.formData);
    const blob = await generateAddresseeDocxBlob(result, { t: dummyT, cleanExport: true });
    const buffer = Buffer.from(await blob.arrayBuffer());
    await checkDocxFile(tc.label, buffer, tc.options);
  }

  console.log('\n=== Results ===');
  const total = passed + failed;
  if (failed === 0) {
    console.log(`\nAll premium DOCX layout checks passed: ${passed}/${total}\n`);
    process.exit(0);
  } else {
    console.log(`\nDOCX layout checks FAILED: ${passed}/${total} passed, ${failed} failed`);
    console.log('Failed checks:');
    failures.forEach(f => console.log(`  - ${f}`));
    console.log('');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
