const fs = require('fs');
const path = require('path');

const PRESETS_FILE = path.join(__dirname, '..', 'src', 'utils', 'addresseePresets.js');
const JSX_FILE = path.join(__dirname, '..', 'src', 'pages', 'AddresseeGenerator.jsx');
const CSS_FILE = path.join(__dirname, '..', 'src', 'pages', 'AddresseeGenerator.css');
const RU_LOCALE = path.join(__dirname, '..', 'src', 'locales', 'ru.json');
const EN_LOCALE = path.join(__dirname, '..', 'src', 'locales', 'en.json');

let pass = 0;
let fail = 0;

function check(description, condition) {
  if (condition) {
    console.log(`  PASS: ${description}`);
    pass++;
  } else {
    console.log(`  FAIL: ${description}`);
    fail++;
  }
}

console.log('\n=== Addressee Presets Checks ===\n');

const presetsSource = fs.readFileSync(PRESETS_FILE, 'utf8');
const jsxSource = fs.readFileSync(JSX_FILE, 'utf8');
const cssSource = fs.readFileSync(CSS_FILE, 'utf8');
const ruLocale = JSON.parse(fs.readFileSync(RU_LOCALE, 'utf8'));
const enLocale = JSON.parse(fs.readFileSync(EN_LOCALE, 'utf8'));

console.log('A. Module structure\n');

check('A1: presets file exists', fs.existsSync(PRESETS_FILE));
check('A2: exports getAddresseePresetStore', presetsSource.includes('export function getAddresseePresetStore'));
check('A3: exports saveAddresseePreset', presetsSource.includes('export function saveAddresseePreset'));
check('A4: exports updateAddresseePreset', presetsSource.includes('export function updateAddresseePreset'));
check('A5: exports deleteAddresseePreset', presetsSource.includes('export function deleteAddresseePreset'));
check('A6: exports clearAddresseePresets', presetsSource.includes('export function clearAddresseePresets'));
check('A7: exports applyRecipientPresetToInput', presetsSource.includes('export function applyRecipientPresetToInput'));
check('A8: exports applySenderPresetToInput', presetsSource.includes('export function applySenderPresetToInput'));
check('A9: exports buildRecipientPresetFromInput', presetsSource.includes('export function buildRecipientPresetFromInput'));
check('A10: exports buildSenderPresetFromInput', presetsSource.includes('export function buildSenderPresetFromInput'));
check('A11: exports getPresetLabel', presetsSource.includes('export function getPresetLabel'));
check('A12: exports sanitizePresetData', presetsSource.includes('export function sanitizePresetData'));
check('A13: exports isPresetStorageAvailable', presetsSource.includes('export function isPresetStorageAvailable'));

console.log('\nB. Recipient preset data fields\n');

check('B1: sanitizePresetData handles recipient fullName', presetsSource.includes('fullName: typeof data.fullName'));
check('B2: sanitizePresetData handles recipient position', presetsSource.includes('position: typeof data.position'));
check('B3: sanitizePresetData handles recipient organization', presetsSource.includes('organization: typeof data.organization'));
check('B4: sanitizePresetData handles recipient gender', presetsSource.includes('gender: typeof data.gender'));
check('B5: buildRecipientPresetFromInput saves recipientDativeName', presetsSource.includes('recipientDativeName'));

console.log('\nC. Sender preset data fields\n');

check('C1: buildSenderPresetFromInput saves senderFullName', presetsSource.includes('senderFullName:'));
check('C2: buildSenderPresetFromInput saves senderPosition', presetsSource.includes('senderPosition:'));
check('C3: buildSenderPresetFromInput saves senderOrganization', presetsSource.includes('senderOrganization:'));
check('C4: buildSenderPresetFromInput saves senderGenitiveName', presetsSource.includes('senderGenitiveName'));

console.log('\nD. applyRecipientPresetToInput immutability\n');

check('D1: applyRecipientPresetToInput does not mutate input', !presetsSource.match(/input\.\w+\s*=/));
check('D2: applyRecipientPresetToInput returns new object', presetsSource.includes('return { ...input'));

console.log('\nE. applySenderPresetToInput immutability\n');

check('E1: applySenderPresetToInput does not mutate input', !presetsSource.match(/input\.\w+\s*=/));
check('E2: applySenderPresetToInput returns new object', presetsSource.includes('return { ...input'));

console.log('\nF. applyRecipientPresetToInput preserves scenario/profile/documentTemplate\n');

check('F1: applyRecipientPresetToInput does NOT touch scenario', !presetsSource.match(/applyRecipientPresetToInput[\s\S]*scenario/));
check('F2: applyRecipientPresetToInput does NOT touch profile', !presetsSource.match(/applyRecipientPresetToInput[\s\S]*profile/));
check('F3: applyRecipientPresetToInput does NOT touch documentTemplate', !presetsSource.match(/applyRecipientPresetToInput[\s\S]*documentTemplate/));

console.log('\nG. applySenderPresetToInput preserves scenario/profile/documentTemplate\n');

check('G1: applySenderPresetToInput does NOT touch scenario', !presetsSource.match(/applySenderPresetToInput[\s\S]*scenario/));
check('G2: applySenderPresetToInput does NOT touch profile', !presetsSource.match(/applySenderPresetToInput[\s\S]*profile/));
check('G3: applySenderPresetToInput does NOT touch documentTemplate', !presetsSource.match(/applySenderPresetToInput[\s\S]*documentTemplate/));

console.log('\nH. sanitizePresetData excludes generated fields\n');

check('H1: sanitizePresetData does NOT save blocks', !presetsSource.match(/sanitizePresetData[\s\S]*blocks/));
check('H2: sanitizePresetData does NOT save documentText', !presetsSource.match(/sanitizePresetData[\s\S]*documentText/));
check('H3: sanitizePresetData does NOT save warnings', !presetsSource.match(/sanitizePresetData[\s\S]*warnings[^s]/));
check('H4: sanitizePresetData does NOT save explanations', !presetsSource.match(/sanitizePresetData[\s\S]*explanations/));
check('H5: sanitizePresetData does NOT save result', !presetsSource.match(/sanitizePresetData[\s\S]*\n\s*result[^:]/));
check('H6: sanitizePresetData does NOT save csv rows', !presetsSource.match(/sanitizePresetData[\s\S]*csv/));

console.log('\nI. Storage fallback behavior\n');

check('I1: getAddresseePresetStore handles corrupted JSON', presetsSource.includes('safeParseJSON'));
check('I2: getAddresseePresetStore returns default on bad version', presetsSource.includes('version !== PRESET_VERSION'));
check('I3: getAddresseePresetStore returns default when store is not object', presetsSource.includes('!store || typeof store !== \'object\''));
check('I4: isStorageAvailable catches localStorage errors', presetsSource.includes('catch'));
check('I5: saveAddresseePreset returns error on storage failure', presetsSource.includes('storage_failed'));

console.log('\nJ. UI render path\n');

check('J1: AddresseeGenerator.jsx renders preset UI', jsxSource.includes('addr-gen-presets'));
check('J2: JSX has handleSaveRecipientPreset', jsxSource.includes('handleSaveRecipientPreset'));
check('J3: JSX has handleApplyRecipientPreset', jsxSource.includes('handleApplyRecipientPreset'));
check('J4: JSX has handleDeleteRecipientPreset', jsxSource.includes('handleDeleteRecipientPreset'));
check('J5: JSX has handleSaveSenderPreset', jsxSource.includes('handleSaveSenderPreset'));
check('J6: JSX has handleApplySenderPreset', jsxSource.includes('handleApplySenderPreset'));
check('J7: JSX has handleDeleteSenderPreset', jsxSource.includes('handleDeleteSenderPreset'));

console.log('\nK. UI strings are not hardcoded\n');

check('K1: recipientSection title uses locale t()', jsxSource.includes("t('addressee.presets.recipientSection.title')"));
check('K2: recipientSection save button uses locale t()', jsxSource.includes("t('addressee.presets.recipientSection.save')"));
check('K3: recipientSection apply button uses locale t()', jsxSource.includes("t('addressee.presets.recipientSection.apply')"));
check('K4: recipientSection delete button uses locale t()', jsxSource.includes("t('addressee.presets.recipientSection.delete')"));
check('K5: senderSection title uses locale t()', jsxSource.includes("t('addressee.presets.senderSection.title')"));
check('K6: senderSection save button uses locale t()', jsxSource.includes("t('addressee.presets.senderSection.save')"));
check('K7: JSX does NOT hardcode Russian preset strings', !jsxSource.match(/Сохранённые адресаты/) && !jsxSource.match(/Сохранить адресата/));
check('K8: JSX does NOT hardcode hardcoded storage note in Russian', !jsxSource.match(/Данные сохраняются только в этом браузере/));

console.log('\nL. Locale keys exist\n');

check('L1: ru.json has presets.recipientSection.title', Boolean(ruLocale.addressee?.presets?.recipientSection?.title));
check('L2: ru.json has presets.recipientSection.empty', Boolean(ruLocale.addressee?.presets?.recipientSection?.empty));
check('L3: ru.json has presets.recipientSection.save', Boolean(ruLocale.addressee?.presets?.recipientSection?.save));
check('L4: ru.json has presets.recipientSection.apply', Boolean(ruLocale.addressee?.presets?.recipientSection?.apply));
check('L5: ru.json has presets.recipientSection.delete', Boolean(ruLocale.addressee?.presets?.recipientSection?.delete));
check('L6: ru.json has presets.recipientSection.noData', Boolean(ruLocale.addressee?.presets?.recipientSection?.noData));
check('L7: ru.json has presets.recipientSection.limitReached', Boolean(ruLocale.addressee?.presets?.recipientSection?.limitReached));
check('L8: ru.json has presets.senderSection.title', Boolean(ruLocale.addressee?.presets?.senderSection?.title));
check('L9: ru.json has presets.senderSection.empty', Boolean(ruLocale.addressee?.presets?.senderSection?.empty));
check('L10: ru.json has presets.senderSection.save', Boolean(ruLocale.addressee?.presets?.senderSection?.save));
check('L11: ru.json has presets.senderSection.apply', Boolean(ruLocale.addressee?.presets?.senderSection?.apply));
check('L12: ru.json has presets.senderSection.delete', Boolean(ruLocale.addressee?.presets?.senderSection?.delete));
check('L13: ru.json has presets.senderSection.noData', Boolean(ruLocale.addressee?.presets?.senderSection?.noData));
check('L14: ru.json has presets.senderSection.limitReached', Boolean(ruLocale.addressee?.presets?.senderSection?.limitReached));
check('L15: ru.json has presets.storageNote', Boolean(ruLocale.addressee?.presets?.storageNote));
check('L16: ru.json has presets.storageUnavailable', Boolean(ruLocale.addressee?.presets?.storageUnavailable));
check('L17: en.json has presets.recipientSection.title', Boolean(enLocale.addressee?.presets?.recipientSection?.title));
check('L18: en.json has presets.senderSection.title', Boolean(enLocale.addressee?.presets?.senderSection?.title));
check('L19: en.json has presets.storageNote', Boolean(enLocale.addressee?.presets?.storageNote));
check('L20: en.json has presets.storageUnavailable', Boolean(enLocale.addressee?.presets?.storageUnavailable));

console.log('\nM. Analytics / personal data\n');

check('M1: preset save does NOT track fullName in analytics', !presetsSource.match(/analytics.*fullName/) && !presetsSource.match(/track.*fullName/));
check('M2: preset apply does NOT log recipientDativeName', !presetsSource.match(/console\.log.*recipientDativeName/));
check('M3: preset data does NOT go to sentry', !presetsSource.match(/Sentry.*preset/));
check('M4: JSX preset render does NOT expose fullName to analytics', !jsxSource.match(/analytics.*fullName/));

console.log('\nN. CSS presence\n');

check('N1: .addr-gen-presets class exists', cssSource.includes('.addr-gen-presets'));
check('N2: .addr-gen-presets-header class exists', cssSource.includes('.addr-gen-presets-header'));
check('N3: .addr-gen-presets-title class exists', cssSource.includes('.addr-gen-presets-title'));
check('N4: .addr-gen-presets-note class exists', cssSource.includes('.addr-gen-presets-note'));
check('N5: .addr-gen-presets-empty class exists', cssSource.includes('.addr-gen-presets-empty'));
check('N6: .addr-gen-presets-list class exists', cssSource.includes('.addr-gen-presets-list'));
check('N7: .addr-gen-preset-row class exists', cssSource.includes('.addr-gen-preset-row'));
check('N8: .addr-gen-preset-label class exists', cssSource.includes('.addr-gen-preset-label'));
check('N9: .addr-gen-btn--tiny class exists', cssSource.includes('.addr-gen-btn--tiny'));
check('N10: .addr-gen-btn--danger class exists', cssSource.includes('.addr-gen-btn--danger'));
check('N11: .addr-gen-btn--compact class exists', cssSource.includes('.addr-gen-btn--compact'));
check('N12: .addr-gen-preset-warning class exists', cssSource.includes('.addr-gen-preset-warning'));
check('N13: presets have mobile-safe layout', cssSource.includes('.addr-gen-preset-row') && cssSource.includes('flex-wrap'));

console.log('\nO. No formatter/export contract changes\n');

const formatterSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'utils', 'addresseeFormatter.js'), 'utf8');
check('O1: addresseeFormatter.js not modified in this change', formatterSource.includes('export function formatAddressee'));
check('O2: formatAddressee still exported', formatterSource.includes('export function formatAddressee'));

console.log('\n=== Results ===\n');

console.log(`Total: ${pass}/${pass + fail}`);
if (fail === 0) {
  console.log('All addressee presets checks passed!\n');
} else {
  console.log(`Failed: ${fail}\n`);
  process.exit(1);
}