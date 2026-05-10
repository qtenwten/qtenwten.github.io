const fs = require('fs');
const path = require('path');

const STORAGE_FILE = path.join(__dirname, '..', 'src', 'utils', 'addresseeDraftStorage.js');
const JSX_FILE = path.join(__dirname, '..', 'src', 'pages', 'AddresseeGenerator.jsx');
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

console.log('\n=== Addressee Draft Storage Checks ===\n');

const storageSource = fs.readFileSync(STORAGE_FILE, 'utf8');
const jsxSource = fs.readFileSync(JSX_FILE, 'utf8');
const ruLocale = JSON.parse(fs.readFileSync(RU_LOCALE, 'utf8'));
const enLocale = JSON.parse(fs.readFileSync(EN_LOCALE, 'utf8'));

console.log('A. Module structure\n');

check('A1: storage file exists', fs.existsSync(STORAGE_FILE));
check('A2: exports getAddresseeDraft', storageSource.includes('export function getAddresseeDraft'));
check('A3: exports saveAddresseeDraft', storageSource.includes('export function saveAddresseeDraft'));
check('A4: exports clearAddresseeDraft', storageSource.includes('export function clearAddresseeDraft'));
check('A5: exports sanitizeAddresseeDraft', storageSource.includes('export function sanitizeAddresseeDraft'));
check('A6: exports hasMeaningfulAddresseeDraft', storageSource.includes('export function hasMeaningfulAddresseeDraft'));
check('A7: exports isAddresseeDraftStorageAvailable', storageSource.includes('export function isAddresseeDraftStorageAvailable'));
check('A8: uses sessionStorage (not localStorage)', storageSource.includes('sessionStorage'));
check('A9: uses correct storage key', storageSource.includes('qsen_addr_form_draft_v1'));
check('A10: has TTL logic (24h)', storageSource.includes('24 * 60 * 60 * 1000') || storageSource.includes('86400000'));

console.log('\nB. Saved fields (input only)\n');

check('B1: saves scenario', storageSource.includes('scenario:') && storageSource.includes("typeof data.scenario"));
check('B2: saves profile', storageSource.includes('profile:') && storageSource.includes("typeof data.profile"));
check('B3: saves documentTemplate', storageSource.includes('documentTemplate:') && storageSource.includes("typeof data.documentTemplate"));
check('B4: saves fullName', storageSource.includes('fullName:') && storageSource.includes("typeof data.fullName"));
check('B5: saves position', storageSource.includes('position:') && storageSource.includes("typeof data.position"));
check('B6: saves organization', storageSource.includes('organization:') && storageSource.includes("typeof data.organization"));
check('B7: saves gender', storageSource.includes('gender:') && storageSource.includes("typeof data.gender"));
check('B8: saves senderFullName', storageSource.includes('senderFullName:') && storageSource.includes("typeof data.senderFullName"));
check('B9: saves senderPosition', storageSource.includes('senderPosition:') && storageSource.includes("typeof data.senderPosition"));
check('B10: saves senderOrganization', storageSource.includes('senderOrganization:') && storageSource.includes("typeof data.senderOrganization"));
check('B11: saves greetingMode', storageSource.includes('greetingMode:') && storageSource.includes("typeof data.greetingMode"));
check('B12: saves punctuation', storageSource.includes('punctuation:') && storageSource.includes("typeof data.punctuation"));
check('B13: saves recipientDativeName', storageSource.includes('recipientDativeName:') && storageSource.includes("typeof data.recipientDativeName"));
check('B14: saves senderGenitiveName', storageSource.includes('senderGenitiveName:') && storageSource.includes("typeof data.senderGenitiveName"));

console.log('\nC. NOT saved fields (result/results/warnings)\n');

check('C1: does NOT save result', !storageSource.includes("result"));
check('C2: does NOT save blocks', !storageSource.includes("blocks"));
check('C3: does NOT save documentText', !storageSource.includes("documentText"));
check('C4: does NOT save warnings', !storageSource.includes("warnings"));
check('C5: does NOT save explanations', !storageSource.includes("explanations"));
check('C6: does NOT save exportData', !storageSource.includes("exportData"));
check('C7: does NOT save resultOverrides', !storageSource.includes("resultOverrides"));
check('C8: does NOT save editingBlock', !storageSource.includes("editingBlock"));
check('C9: does NOT save editDraft', !storageSource.includes("editDraft"));
check('C10: does NOT save bulkInput', !storageSource.includes("bulkInput"));
check('C11: does NOT save bulkResults', !storageSource.includes("bulkResults"));
check('C12: does NOT save bulkSummary', !storageSource.includes("bulkSummary"));
check('C13: does NOT save bulkError', !storageSource.includes("bulkError"));
check('C14: does NOT save CSV rows', !storageSource.includes("csv") || storageSource.includes("getCsvTemplate"));

console.log('\nD. AddresseeGenerator integration\n');

check('D1: imports draft storage helpers', jsxSource.includes("from '../utils/addresseeDraftStorage'"));
check('D2: calls getAddresseeDraft on mount', jsxSource.includes('getAddresseeDraft()'));
check('D3: calls saveAddresseeDraft', jsxSource.includes('saveAddresseeDraft'));
check('D4: calls clearAddresseeDraft on handleClear', jsxSource.includes('clearAddresseeDraft()'));
check('D5: has debounce mechanism', jsxSource.includes('setTimeout') || jsxSource.includes('debounce'));
check('D6: has visibilitychange handler', jsxSource.includes('visibilitychange'));
check('D7: has scheduleDraftSave function', jsxSource.includes('scheduleDraftSave'));
check('D8: has draftRestoredRef', jsxSource.includes('draftRestoredRef'));
check('D9: has saveTimerRef', jsxSource.includes('saveTimerRef'));
check('D10: checks hasMeaningfulAddresseeDraft', jsxSource.includes('hasMeaningfulAddresseeDraft'));

console.log('\nE. Error handling and storage availability\n');

check('E1: handles QuotaExceededError', storageSource.includes('QuotaExceededError'));
check('E2: handles storage unavailability gracefully', storageSource.includes('isSessionStorageAvailable') || storageSource.includes('try'));
check('E3: isAddresseeDraftStorageAvailable exported', storageSource.includes('export function isAddresseeDraftStorageAvailable'));

console.log('\nF. Locale keys\n');

const ruDraftKeys = ruLocale?.addresseeGenerator?.addressee?.draft;
const enDraftKeys = enLocale?.addresseeGenerator?.addressee?.draft;

check('F1: RU draft.restored exists', ruDraftKeys && typeof ruDraftKeys.restored === 'string');
check('F2: RU draft.saving exists', ruDraftKeys && typeof ruDraftKeys.saving === 'string');
check('F3: RU draft.cleared exists', ruDraftKeys && typeof ruDraftKeys.cleared === 'string');
check('F4: RU draft.clear exists', ruDraftKeys && typeof ruDraftKeys.clear === 'string');
check('F5: EN draft.restored exists', enDraftKeys && typeof enDraftKeys.restored === 'string');
check('F6: EN draft.saving exists', enDraftKeys && typeof enDraftKeys.saving === 'string');
check('F7: EN draft.cleared exists', enDraftKeys && typeof enDraftKeys.cleared === 'string');
check('F8: EN draft.clear exists', enDraftKeys && typeof enDraftKeys.clear === 'string');

console.log('\nG. Privacy and compliance\n');

check('G1: no backend/cloud imports in storage', !storageSource.includes('fetch') && !storageSource.includes('axios') && !storageSource.includes('api'));
check('G2: no analytics in draft storage', !storageSource.includes('analytics') && !storageSource.includes('track'));
check('G3: no account/cloud sync', !storageSource.includes('account') && !storageSource.includes('sync'));

console.log('\nH. hasMeaningfulAddresseeDraft logic\n');

check('H1: checks for recipient data', storageSource.includes('hasRecipientData'));
check('H2: checks for sender data', storageSource.includes('hasSenderData'));
check('H3: requires non-empty strings', storageSource.includes('trim().length > 0') || storageSource.includes('trim().length>0'));

console.log('\n=== SUMMARY ===\n');
console.log(`Passed: ${pass}`);
console.log(`Failed: ${fail}`);
console.log(`Total:  ${pass + fail}`);

if (fail > 0) {
  console.log('\nSOME CHECKS FAILED - Review output above\n');
  process.exit(1);
} else {
  console.log('\nALL CHECKS PASSED\n');
  process.exit(0);
}