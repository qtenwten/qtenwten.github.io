import { formatAddressee } from '../src/utils/addresseeFormatter.js';
import {
  adaptEnhancedResultToLegacy,
  buildLegacyInputFromNormalized,
  getConfidenceLabel,
  normalizeAddresseeInput,
} from '../src/utils/addresseeAdapter.js';
import {
  ADDRESSEE_PROFILES,
  ADDRESSEE_SCENARIOS,
  PROFILE_IDS,
  SCENARIO_IDS,
  getAddresseeProfile,
  getAddresseeScenario,
  mapDocumentTemplateToScenario,
  mapScenarioToDocumentTemplate,
} from '../src/utils/addresseeProfiles.js';
import {
  DOCUMENT_TEMPLATE_APPLICATION,
  DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  WARNING_CODES,
} from '../src/utils/addresseeTypes.js';
import {
  buildHtmlExport,
  buildPlainTextExport,
  buildSingleCsvExport,
} from '../src/utils/addresseeExport.js';
import { generateAddresseeDocxBlob } from '../src/utils/addresseeDocxExport.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`  PASS: ${message}`);
  } else {
    failed += 1;
    console.log(`  FAIL: ${message}`);
  }
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function hasExplanation(result, code) {
  return Array.isArray(result.explanations) &&
    result.explanations.some((explanation) => explanation.code === code);
}

function explanationText(result) {
  return (result.explanations || [])
    .map((explanation) => `${explanation.title || ''} ${explanation.text || ''}`)
    .join('\n');
}

async function run() {
  console.log('\n=== Addressee Profile Adapter Checks ===\n');

  const baseInput = {
    fullName: 'Иванов Иван Петрович',
    position: 'директор',
    organization: 'ООО "Ромашка"',
    gender: 'male',
    senderFullName: 'Петрова Анна Сергеевна',
    senderPosition: 'менеджер',
    senderOrganization: 'ООО "Альфа"',
  };

  console.log('A. Profile and scenario registry');
  assert(Boolean(ADDRESSEE_PROFILES[PROFILE_IDS.RU_OFFICIAL_STANDARD]), 'A1: RU_OFFICIAL_STANDARD profile exists');
  assert(Boolean(ADDRESSEE_PROFILES[PROFILE_IDS.RU_SIMPLE_BUSINESS]), 'A2: RU_SIMPLE_BUSINESS profile exists');
  assert(ADDRESSEE_PROFILES[PROFILE_IDS.EN_BUSINESS_LETTER].enabled === false, 'A3: EN_BUSINESS_LETTER is disabled/future');
  assert(ADDRESSEE_PROFILES[PROFILE_IDS.EN_INTERNAL_MEMO].enabled === false, 'A4: EN_INTERNAL_MEMO is disabled/future');
  assert(ADDRESSEE_PROFILES[PROFILE_IDS.EN_BUSINESS_LETTER].reason.includes('must not reuse RU case rules'), 'A5: EN profile explains why it is future-only');
  assert(ADDRESSEE_SCENARIOS[SCENARIO_IDS.APPLICATION].profileId === PROFILE_IDS.RU_OFFICIAL_STANDARD, 'A6: application maps to official RU profile');
  assert(ADDRESSEE_SCENARIOS[SCENARIO_IDS.BUSINESS_LETTER].profileId === PROFILE_IDS.RU_SIMPLE_BUSINESS, 'A7: businessLetter maps to simple business profile');
  assert(mapDocumentTemplateToScenario(DOCUMENT_TEMPLATE_APPLICATION) === SCENARIO_IDS.APPLICATION, 'A8: documentTemplate application maps to application scenario');
  assert(mapDocumentTemplateToScenario(undefined) === SCENARIO_IDS.BUSINESS_LETTER, 'A9: missing documentTemplate keeps legacy businessLetter scenario');
  assert(mapDocumentTemplateToScenario('unknownTemplate') === SCENARIO_IDS.CUSTOM, 'A10: unknown documentTemplate maps to custom scenario');
  assert(mapScenarioToDocumentTemplate(SCENARIO_IDS.APPLICATION) === DOCUMENT_TEMPLATE_APPLICATION, 'A11: application scenario maps to current documentTemplate');
  assert(getAddresseeProfile('UNKNOWN').id === PROFILE_IDS.RU_OFFICIAL_STANDARD, 'A12: unknown profile falls back safely');
  assert(getAddresseeScenario('UNKNOWN').id === SCENARIO_IDS.CUSTOM, 'A13: unknown scenario falls back safely');

  console.log('\nB. Normalized input adapter');
  const normalized = normalizeAddresseeInput({
    recipient: {
      fullName: baseInput.fullName,
      position: baseInput.position,
      organization: baseInput.organization,
      gender: baseInput.gender,
    },
    sender: {
      fullName: baseInput.senderFullName,
      position: baseInput.senderPosition,
      organization: baseInput.senderOrganization,
    },
    manualCases: {
      recipientDativeName: 'Иванову Ивану Петровичу',
      senderGenitiveName: 'Петровой Анны Сергеевны',
    },
    format: {
      documentTemplate: DOCUMENT_TEMPLATE_APPLICATION,
    },
  });
  const legacyInput = buildLegacyInputFromNormalized(normalized);
  assert(normalized.profile.id === PROFILE_IDS.RU_OFFICIAL_STANDARD, 'B1: normalized input resolves profile');
  assert(normalized.scenario.id === SCENARIO_IDS.APPLICATION, 'B2: normalized input resolves scenario');
  assert(normalized.recipient.fullName === baseInput.fullName, 'B3: normalized input supports nested recipient');
  assert(normalized.sender.fullName === baseInput.senderFullName, 'B4: normalized input supports nested sender');
  assert(legacyInput.fullName === baseInput.fullName, 'B5: legacy input restores fullName');
  assert(legacyInput.senderFullName === baseInput.senderFullName, 'B6: legacy input restores senderFullName');
  assert(legacyInput.documentTemplate === DOCUMENT_TEMPLATE_APPLICATION, 'B7: legacy input preserves documentTemplate');

  console.log('\nC. Legacy shape and enhanced aliases');
  const result = formatAddressee(baseInput);
  assert(result.blocks && typeof result.blocks === 'object', 'C1: result has blocks object');
  assert(typeof result.blocks.to === 'string', 'C2: blocks.to exists');
  assert(typeof result.blocks.from === 'string', 'C3: blocks.from exists');
  assert(typeof result.blocks.greeting === 'string', 'C4: blocks.greeting exists');
  assert(typeof result.blocks.letter === 'string', 'C5: blocks.letter exists');
  assert(typeof result.blocks.documentText === 'string', 'C6: blocks.documentText exists');
  assert(result.blocks.toBlock === result.blocks.to, 'C7: blocks.toBlock aliases blocks.to');
  assert(result.blocks.fromBlock === result.blocks.from, 'C8: blocks.fromBlock aliases blocks.from');
  assert(result.blocks.salutation === result.blocks.greeting, 'C9: blocks.salutation aliases blocks.greeting');
  assert(result.blocks.documentHeader === result.blocks.letter, 'C10: blocks.documentHeader aliases blocks.letter');
  assert(result.blocks.fullPreview === result.blocks.documentText, 'C11: blocks.fullPreview aliases blocks.documentText');
  assert(typeof result.confidence === 'number', 'C12: confidence remains a number');
  assert(result.profile.id === PROFILE_IDS.RU_SIMPLE_BUSINESS, 'C13: legacy businessLetter resolves simple business profile metadata');
  assert(result.scenario.id === SCENARIO_IDS.BUSINESS_LETTER, 'C14: legacy businessLetter resolves scenario metadata');

  console.log('\nD. Confidence labels');
  const high = formatAddressee(baseInput);
  const medium = formatAddressee({ ...baseInput, gender: 'unknown' });
  const low = formatAddressee({});
  assert(high.confidence === 0.95 && high.confidenceLabel === 'high', 'D1: high label for confidence >= 0.8');
  assert(medium.confidence === 0.75 && medium.confidenceLabel === 'medium', 'D2: medium label for confidence >= 0.6 and < 0.8');
  assert(low.confidence === 0.55 && low.confidenceLabel === 'low', 'D3: low label for confidence < 0.6');
  assert(getConfidenceLabel(0.8) === 'high', 'D4: helper labels 0.8 as high');
  assert(getConfidenceLabel(0.6) === 'medium', 'D5: helper labels 0.6 as medium');
  assert(getConfidenceLabel(0.59) === 'low', 'D6: helper labels below 0.6 as low');

  console.log('\nE. Enriched warnings');
  const warningResult = formatAddressee({
    fullName: 'Иванов И. И.',
    position: 'супервайвер',
    gender: 'unknown',
  });
  assert(warningResult.warnings.length > 0, 'E1: warning fixture returns warnings');
  assert(warningResult.warnings.every((warning) => typeof warning.code === 'string'), 'E2: warnings keep code');
  assert(warningResult.warnings.every((warning) => typeof warning.message === 'string'), 'E3: warnings keep message');
  assert(warningResult.warnings.every((warning) => warning.severity === 'warning'), 'E4: warnings get severity fallback');
  assert(warningResult.warnings.every((warning) => hasOwn(warning, 'field')), 'E5: warnings get field property');
  assert(warningResult.warnings.every((warning) => hasOwn(warning, 'suggestion')), 'E6: warnings get suggestion property');
  assert(warningResult.warnings.some((warning) => warning.code === WARNING_CODES.UNKNOWN_POSITION && warning.field === 'recipient.position'), 'E7: unknown position warning is field-scoped');
  assert(adaptEnhancedResultToLegacy(warningResult).warnings.every((warning) => typeof warning.message === 'string'), 'E8: legacy adapter keeps warning messages');

  console.log('\nF. Explanations');
  const manualResult = formatAddressee({
    ...baseInput,
    recipientDativeName: 'Иванову Ивану Петровичу',
    senderGenitiveName: 'Петровой Анны Сергеевны',
  });
  assert(Array.isArray(result.explanations), 'F1: explanations array exists');
  assert(hasExplanation(result, 'RECIPIENT_DATIVE_USED'), 'F2: recipient dative explanation exists');
  assert(hasExplanation(result, 'SENDER_GENITIVE_USED'), 'F3: sender genitive explanation exists');
  assert(hasExplanation(manualResult, 'MANUAL_RECIPIENT_CASE_USED'), 'F4: manual recipient explanation exists');
  assert(hasExplanation(manualResult, 'MANUAL_SENDER_CASE_USED'), 'F5: manual sender explanation exists');
  assert(hasExplanation(warningResult, 'UNKNOWN_POSITION_REVIEW'), 'F6: unknown position explanation exists');
  assert(hasExplanation(warningResult, 'RISKY_NAME_REVIEW'), 'F7: risky name explanation exists');
  assert(hasExplanation(warningResult, 'UNKNOWN_GENDER_REVIEW'), 'F8: unknown gender explanation exists');
  const combinedExplanationText = explanationText(manualResult);
  assert(!combinedExplanationText.includes(baseInput.fullName), 'F9: explanations do not include recipient personal data');
  assert(!combinedExplanationText.includes(baseInput.senderFullName), 'F10: explanations do not include sender personal data');

  console.log('\nG. Profile/scenario formatting compatibility');
  const scenarioResult = formatAddressee({
    ...baseInput,
    scenario: SCENARIO_IDS.APPLICATION,
  });
  const explicitProfileResult = formatAddressee({
    ...baseInput,
    profile: PROFILE_IDS.RU_OFFICIAL_STANDARD,
    scenario: SCENARIO_IDS.BUSINESS_LETTER,
  });
  assert(scenarioResult.profile.id === PROFILE_IDS.RU_OFFICIAL_STANDARD, 'G1: scenario can select official profile metadata');
  assert(scenarioResult.scenario.id === SCENARIO_IDS.APPLICATION, 'G2: scenario is retained in result');
  assert(scenarioResult.exportData.documentTemplate === DOCUMENT_TEMPLATE_APPLICATION, 'G3: scenario maps to legacy documentTemplate for formatter');
  assert(scenarioResult.warnings.some((warning) => warning.code === WARNING_CODES.TEMPLATE_REVIEW), 'G4: application scenario keeps legacy sensitive-template warning');
  assert(explicitProfileResult.profile.id === PROFILE_IDS.RU_OFFICIAL_STANDARD, 'G5: explicit profile is retained');
  assert(explicitProfileResult.blocks.to === explicitProfileResult.blocks.toBlock, 'G6: explicit profile does not break legacy output');

  console.log('\nH. Export compatibility');
  const labels = {
    to: 'Адресат',
    from: 'Отправитель',
    greeting: 'Обращение',
    documentTemplate: 'Готовый шаблон',
    docxDocumentLabel: 'Документ',
    disclaimer: 'Проверьте результат перед отправкой.',
  };
  const csv = buildSingleCsvExport(scenarioResult, { ...baseInput, scenario: SCENARIO_IDS.APPLICATION }, {});
  const txt = buildPlainTextExport(scenarioResult, {}, labels);
  const html = buildHtmlExport(scenarioResult, {}, { labels, lang: 'ru' });
  const docxBlob = await generateAddresseeDocxBlob(scenarioResult, { t: (key) => labels[key] || key });
  assert(csv.startsWith('\uFEFF'), 'H1: CSV export still has BOM');
  assert(csv.includes('documentText'), 'H2: CSV export keeps legacy documentText column');
  assert(csv.includes('warnings'), 'H3: CSV export keeps legacy warnings column');
  assert(!csv.includes('undefined') && !csv.includes('null'), 'H4: CSV export has no undefined/null');
  assert(txt.includes(labels.to) && txt.includes(labels.documentTemplate), 'H5: TXT export accepts enhanced result');
  assert(html.includes('<!doctype html>') && !html.includes('<script>'), 'H6: HTML export accepts enhanced result');
  assert(docxBlob && docxBlob.size > 0, 'H7: DOCX export generates a non-empty blob from enhanced result');

  if (failed > 0) {
    console.error(`\nAddressee profile adapter checks failed: ${failed}/${passed + failed}`);
    process.exit(1);
  }

  console.log(`\nAll addressee profile adapter checks passed: ${passed}/${passed + failed}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
