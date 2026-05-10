import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { formatAddressee } from '../src/utils/addresseeFormatter.js';
import {
  buildManualReviewItems,
  getAddresseeFieldLabel,
  getConfidenceUi,
  getProfileDisplayLabel,
  getScenarioDisplayLabel,
  getWarningSeverityUi,
  shouldShowTrustLayer,
} from '../src/utils/addresseeTrustUi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf-8');
}

function makeT(dictionary = {}) {
  return (key) => dictionary[key] || key;
}

function run() {
  console.log('\n=== Addressee Trust Layer Checks ===\n');

  const t = makeT({
    'addresseeGenerator.addressee.trust.confidence.high.title': 'High confidence',
    'addresseeGenerator.addressee.trust.confidence.high.description': 'Looks complete.',
    'addresseeGenerator.addressee.trust.confidence.medium.title': 'Medium confidence',
    'addresseeGenerator.addressee.trust.confidence.medium.description': 'Review warnings.',
    'addresseeGenerator.addressee.trust.confidence.low.title': 'Manual review needed',
    'addresseeGenerator.addressee.trust.confidence.low.description': 'Use as a draft.',
    'addresseeGenerator.addressee.trust.severity.warning': 'Warning',
    'addresseeGenerator.addressee.fields.recipient.fullName': 'Recipient full name',
    'addresseeGenerator.addressee.fields.recipient.position': 'Recipient position',
    'addresseeGenerator.addressee.fields.recipient.gender': 'Recipient gender',
    'addresseeGenerator.addressee.fields.general': 'General',
    'addresseeGenerator.addressee.profiles.RU_OFFICIAL_STANDARD': 'Russian official profile',
    'addresseeGenerator.addressee.profiles.RU_SIMPLE_BUSINESS': 'Russian business profile',
    'addresseeGenerator.addressee.profiles.unknown': 'unknown profile',
    'addresseeGenerator.addressee.scenarios.application': 'application',
    'addresseeGenerator.addressee.scenarios.custom': 'custom document',
    'addresseeGenerator.addressee.warningSuggestions.UNKNOWN_GENDER': 'Choose gender if needed.',
    'addresseeGenerator.addressee.trust.manualReview.reasons.unknownGender': 'The salutation form may be uncertain.',
    'addresseeGenerator.addressee.trust.manualReview.reasons.unknownPosition': 'The position wording needs review.',
    'addresseeGenerator.addressee.trust.manualReview.reasons.nameCase': 'The name form may be ambiguous.',
    'addresseeGenerator.addressee.trust.manualReview.reasons.generic': 'This result needs a manual check.',
  });

  console.log('A. Formatter enhanced data');
  const riskyResult = formatAddressee({
    fullName: 'Иванов И. И.',
    position: 'супервайвер',
    gender: 'unknown',
  });
  assert(typeof riskyResult.confidenceLabel === 'string', 'A1: formatAddressee returns confidenceLabel');
  assert(Array.isArray(riskyResult.explanations), 'A2: formatAddressee returns explanations array');
  assert(riskyResult.explanations.length > 0, 'A3: explanations are present for RU profile');
  assert(riskyResult.warnings.length > 0, 'A4: warning fixture returns warnings');
  assert(riskyResult.warnings.every((warning) => typeof warning.code === 'string'), 'A5: warnings keep code');
  assert(riskyResult.warnings.every((warning) => typeof warning.message === 'string'), 'A6: warnings keep message');
  assert(riskyResult.warnings.every((warning) => Object.prototype.hasOwnProperty.call(warning, 'severity')), 'A7: warnings have severity');
  assert(riskyResult.warnings.every((warning) => Object.prototype.hasOwnProperty.call(warning, 'field')), 'A8: warnings have field');
  assert(riskyResult.warnings.every((warning) => Object.prototype.hasOwnProperty.call(warning, 'suggestion')), 'A9: warnings have suggestion');

  console.log('\nB. Trust UI helpers');
  assert(getConfidenceUi('high', t).title === 'High confidence', 'B1: helper returns high label');
  assert(getConfidenceUi('medium', t).title === 'Medium confidence', 'B2: helper returns medium label');
  assert(getConfidenceUi('low', t).title === 'Manual review needed', 'B3: helper returns low label');
  assert(getConfidenceUi('unknown', t).id === 'low', 'B4: unknown confidence falls back to low');
  assert(getWarningSeverityUi('warning', t).label === 'Warning', 'B5: warning severity gets label');
  assert(getWarningSeverityUi('unknown', t).id === 'warning', 'B6: unknown severity falls back to warning');
  assert(getAddresseeFieldLabel('recipient.fullName', t) === 'Recipient full name', 'B7: known field gets human label');
  assert(getAddresseeFieldLabel('unknown.technical.path', t) === 'General', 'B8: unknown field does not expose technical path');
  assert(getProfileDisplayLabel({ id: 'RU_OFFICIAL_STANDARD', enabled: true }, t) === 'Russian official profile', 'B9: known profile gets label');
  assert(getProfileDisplayLabel({ id: 'EN_BUSINESS_LETTER', enabled: false, status: 'future' }, t) === '', 'B10: future EN profile is not exposed');
  assert(getProfileDisplayLabel({ id: 'UNKNOWN', enabled: true }, t) === 'unknown profile', 'B11: unknown profile falls back safely');
  assert(getScenarioDisplayLabel({ id: 'application' }, t) === 'application', 'B12: known scenario gets label');
  assert(getScenarioDisplayLabel({ id: 'unknownScenario' }, t) === 'custom document', 'B13: unknown scenario falls back safely');
  assert(shouldShowTrustLayer(riskyResult), 'B14: shouldShowTrustLayer returns true for formatter result');

  const manualItems = buildManualReviewItems(riskyResult, t);
  assert(manualItems.length > 0, 'B15: manual review items appear for warnings');
  assert(manualItems.every((item) => item.label && item.reason), 'B16: manual review items have label and reason');
  assert(!manualItems.some((item) => /recipient\.|sender\.|manualCases|format\./.test(item.label)), 'B17: manual review labels are human-readable');

  const mediumResult = formatAddressee({
    fullName: 'Иванов Иван Петрович',
    gender: 'unknown',
  });
  assert(buildManualReviewItems(mediumResult, t).length > 0, 'B18: manual review items appear for medium confidence');

  const staticLabels = [
    getConfidenceUi('high', t).title,
    getAddresseeFieldLabel('recipient.position', t),
    getProfileDisplayLabel({ id: 'RU_SIMPLE_BUSINESS', enabled: true }, t),
    getScenarioDisplayLabel({ id: 'application' }, t),
  ].join(' ');
  assert(!staticLabels.includes('Иванов') && !staticLabels.includes('Петрова'), 'B19: static helper labels contain no personal data');

  const explanationText = riskyResult.explanations.map((item) => `${item.title} ${item.text}`).join('\n');
  assert(!explanationText.includes('Иванов') && !explanationText.includes('супервайвер'), 'B20: explanations do not include submitted personal/field data');

  console.log('\nC. Source checks');
  const jsxSource = read('src/pages/AddresseeGenerator.jsx');
  const cssSource = read('src/pages/AddresseeGenerator.css');
  const helperSource = read('src/utils/addresseeTrustUi.js');
  const ruLocale = JSON.parse(read('src/locales/ru.json'));
  const enLocale = JSON.parse(read('src/locales/en.json'));

  assert(jsxSource.includes('addr-gen-trust-layer'), 'C1: UI source contains trust layer render path');
  assert(jsxSource.includes('getConfidenceUi'), 'C2: UI source uses confidence helper');
  assert(jsxSource.includes('buildManualReviewItems'), 'C3: UI source uses manual review helper');
  assert(jsxSource.includes('result.explanations'), 'C4: UI source renders explanations');
  assert(jsxSource.includes('getWarningSuggestion'), 'C5: UI source renders warning suggestions');
  assert(jsxSource.includes('getProfileDisplayLabel'), 'C6: UI source renders profile context through helper');
  assert(!jsxSource.includes('Высокая уверенность') && !jsxSource.includes('Проверка результата') && !jsxSource.includes('Почему так сформировано'), 'C7: trust UI strings are localized, not hardcoded in JSX');
  assert(!jsxSource.includes('warningsTitle') && !jsxSource.includes('warningsDescription'), 'C8: legacy warning notice text is not rendered in parallel');
  assert((jsxSource.match(/result\.warnings\.map/g) || []).length === 1, 'C9: result warnings are rendered once in result area');
  assert(cssSource.includes('.addr-gen-trust-layer'), 'C10: CSS has trust layer styles');
  assert(cssSource.includes('.addr-gen-explanation-card'), 'C11: CSS has explanation card styles');
  assert(helperSource.includes('export function getConfidenceUi'), 'C12: helper exports getConfidenceUi');
  assert(helperSource.includes('export function buildManualReviewItems'), 'C13: helper exports buildManualReviewItems');
  assert(helperSource.includes("ADDRESSEE_LOCALE_PREFIX = 'addresseeGenerator.addressee'") && helperSource.includes('.trust.confidence'), 'C14: helper uses current addressee locale path');
  assert(!helperSource.includes('addressee.trust.'), 'C15: helper no longer uses legacy trust locale path');
  assert(Boolean(ruLocale.addresseeGenerator?.addressee?.trust?.confidence?.high?.title), 'C16: RU trust locale exists');
  assert(Boolean(enLocale.addresseeGenerator?.addressee?.trust?.confidence?.high?.title), 'C17: EN trust locale exists');
  assert(Boolean(ruLocale.addresseeGenerator?.addressee?.warningSuggestions?.UNKNOWN_GENDER), 'C18: RU warning suggestion locale exists');
  assert(Boolean(enLocale.addresseeGenerator?.addressee?.warningSuggestions?.UNKNOWN_GENDER), 'C19: EN warning suggestion locale exists');
  assert(enLocale.addresseeGenerator?.addressee?.profiles?.RU_OFFICIAL_STANDARD?.includes('Russian'), 'C20: EN labels are honest about RU profile');
  assert(!JSON.stringify(enLocale.addresseeGenerator?.addressee || {}).includes('EN standards mode'), 'C21: EN locale does not promise finished EN standards mode');

  if (failed > 0) {
    console.error(`\nAddressee trust layer checks failed: ${failed}/${passed + failed}`);
    process.exit(1);
  }

  console.log(`\nAll addressee trust layer checks passed: ${passed}/${passed + failed}`);
}

run();
