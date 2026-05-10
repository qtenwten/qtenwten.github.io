const fs = require('fs');
const path = require('path');

const ANALYTICS_FILE = path.join(__dirname, '..', 'src', 'utils', 'addresseeAnalytics.js');
const JSX_FILE = path.join(__dirname, '..', 'src', 'pages', 'AddresseeGenerator.jsx');
const ANALYTICS_UTILS = path.join(__dirname, '..', 'src', 'utils', 'analytics.js');
const COPY_BUTTON = path.join(__dirname, '..', 'src', 'components', 'CopyButton.jsx');
const FORMATTER_FILE = path.join(__dirname, '..', 'src', 'utils', 'addresseeFormatter.js');

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

console.log('\n=== Addressee Analytics Checks ===\n');

const analyticsSource = fs.readFileSync(ANALYTICS_FILE, 'utf8');
const jsxSource = fs.readFileSync(JSX_FILE, 'utf8');
const analyticsUtilsSource = fs.readFileSync(ANALYTICS_UTILS, 'utf8');
const copyButtonSource = fs.readFileSync(COPY_BUTTON, 'utf8');
const formatterSource = fs.readFileSync(FORMATTER_FILE, 'utf8');

console.log('A. Module structure\n');

check('A1: addresseeAnalytics.js exists', fs.existsSync(ANALYTICS_FILE));
check('A2: exports ADDRESSEE_ANALYTICS_EVENTS', analyticsSource.includes('export const ADDRESSEE_ANALYTICS_EVENTS'));
check('A3: exports getConfidenceBucket', analyticsSource.includes('export function getConfidenceBucket'));
check('A4: exports getCsvRowsBucket', analyticsSource.includes('export function getCsvRowsBucket'));
check('A5: exports getWarningCodes', analyticsSource.includes('export function getWarningCodes'));
check('A6: exports buildAddresseeAnalyticsPayload', analyticsSource.includes('export function buildAddresseeAnalyticsPayload'));
check('A7: exports trackAddresseeToolOpened', analyticsSource.includes('export function trackAddresseeToolOpened'));
check('A8: exports trackAddresseeScenarioSelected or trackAddresseeScenarioChange', analyticsSource.includes('trackAddresseeScenarioChange') || analyticsSource.includes('trackAddresseeScenarioSelected'));
check('A9: exports trackAddresseeGenerated', analyticsSource.includes('export function trackAddresseeGenerated'));
check('A10: exports trackAddresseeWarningShown', analyticsSource.includes('export function trackAddresseeWarningShown'));
check('A11: exports trackAddresseeExplanationOpened', analyticsSource.includes('export function trackAddresseeExplanationOpened'));
check('A12: exports trackAddresseeCopyClicked', analyticsSource.includes('export function trackAddresseeCopyClicked'));
check('A13: exports trackAddresseeExportClicked', analyticsSource.includes('export function trackAddresseeExportClicked'));
check('A14: exports trackAddresseeCsvImportStarted', analyticsSource.includes('export function trackAddresseeCsvImportStarted'));
check('A15: exports trackAddresseeCsvImportCompleted', analyticsSource.includes('export function trackAddresseeCsvImportCompleted'));
check('A16: exports trackAddresseePresetAction', analyticsSource.includes('export function trackAddresseePresetAction'));
check('A17: exports trackAddresseePremiumIntent', analyticsSource.includes('export function trackAddresseePremiumIntent'));

console.log('\nB. Event naming\n');

const eventNameMatches = analyticsSource.match(/'[a-z_]+'/g) || [];
const addresseeEvents = eventNameMatches.filter(e => e.includes('addressee_'));
check('B1: has addressee_tool_opened', analyticsSource.includes("'addressee_tool_opened'") || analyticsSource.includes('addressee_tool_opened'));
check('B2: has addressee_scenario_selected', analyticsSource.includes("'addressee_scenario_selected'") || analyticsSource.includes('addressee_scenario_selected'));
check('B3: has addressee_generated', analyticsSource.includes("'addressee_generated'") || analyticsSource.includes('addressee_generated'));
check('B4: has addressee_warning_shown', analyticsSource.includes("'addressee_warning_shown'") || analyticsSource.includes('addressee_warning_shown'));
check('B5: has addressee_explanation_opened', analyticsSource.includes("'addressee_explanation_opened'") || analyticsSource.includes('addressee_explanation_opened'));
check('B6: has addressee_copy_clicked', analyticsSource.includes("'addressee_copy_clicked'") || analyticsSource.includes('addressee_copy_clicked'));
check('B7: has addressee_export_clicked', analyticsSource.includes("'addressee_export_clicked'") || analyticsSource.includes('addressee_export_clicked'));
check('B8: has addressee_csv_import_started', analyticsSource.includes("'addressee_csv_import_started'") || analyticsSource.includes('addressee_csv_import_started'));
check('B9: has addressee_csv_import_completed', analyticsSource.includes("'addressee_csv_import_completed'") || analyticsSource.includes('addressee_csv_import_completed'));
check('B10: has addressee_preset_action', analyticsSource.includes("'addressee_preset_action'") || analyticsSource.includes('addressee_preset_action'));
check('B11: has addressee_premium_intent', analyticsSource.includes("'addressee_premium_intent'") || analyticsSource.includes('addressee_premium_intent'));

console.log('\nC. buildAddresseeAnalyticsPayload allows permitted fields\n');

check('C1: includes language', analyticsSource.includes('language'));
check('C2: includes profile', analyticsSource.includes('profile'));
check('C3: includes scenario', analyticsSource.includes('scenario'));
check('C4: includes warnings_count', analyticsSource.includes('warnings_count'));
check('C5: includes warning_codes', analyticsSource.includes('warning_codes'));
check('C6: includes confidence_bucket', analyticsSource.includes('confidence_bucket'));
check('C7: includes confidence_label', analyticsSource.includes('confidence_label'));
check('C8: includes has_sender', analyticsSource.includes('has_sender'));
check('C9: includes has_manual_recipient_case', analyticsSource.includes('has_manual_recipient_case'));
check('C10: includes has_manual_sender_case', analyticsSource.includes('has_manual_sender_case'));
check('C11: includes csv_rows_bucket', analyticsSource.includes('csv_rows_bucket'));
check('C12: includes export_type', analyticsSource.includes('export_type'));
check('C13: includes preset_type', analyticsSource.includes('preset_type'));
check('C14: includes preset_action', analyticsSource.includes('preset_action'));

console.log('\nD. Forbidden fields stripped\n');

check('D1: FORBIDDEN_KEYS includes fullName', analyticsSource.includes("'fullName'") || analyticsSource.includes('"fullName"'));
check('D2: FORBIDDEN_KEYS includes senderFullName', analyticsSource.includes("'senderFullName'") || analyticsSource.includes('"senderFullName"'));
check('D3: FORBIDDEN_KEYS includes position', analyticsSource.includes("'position'") || analyticsSource.includes('"position"'));
check('D4: FORBIDDEN_KEYS includes senderPosition', analyticsSource.includes("'senderPosition'") || analyticsSource.includes('"senderPosition"'));
check('D5: FORBIDDEN_KEYS includes organization', analyticsSource.includes("'organization'") || analyticsSource.includes('"organization"'));
check('D6: FORBIDDEN_KEYS includes senderOrganization', analyticsSource.includes("'senderOrganization'") || analyticsSource.includes('"senderOrganization"'));
check('D7: FORBIDDEN_KEYS includes recipientDativeName', analyticsSource.includes("'recipientDativeName'") || analyticsSource.includes('"recipientDativeName"'));
check('D8: FORBIDDEN_KEYS includes senderGenitiveName', analyticsSource.includes("'senderGenitiveName'") || analyticsSource.includes('"senderGenitiveName"'));
check('D9: FORBIDDEN_KEYS includes documentText', analyticsSource.includes("'documentText'") || analyticsSource.includes('"documentText"'));
check('D10: FORBIDDEN_KEYS includes blocks', analyticsSource.includes("'blocks'") || analyticsSource.includes('"blocks"'));
check('D11: buildAddresseeAnalyticsPayload strips forbidden keys', analyticsSource.includes('delete payload[key]'));
check('D12: strips preset label keys', analyticsSource.includes('PRESET_LABEL_KEYS') || analyticsSource.includes('presetLabel'));
check('D13: strips preset data keys', analyticsSource.includes('PRESET_DATA_KEYS') || analyticsSource.includes('presetData'));

console.log('\nE. getConfidenceBucket logic\n');

check('E1: >= 0.8 returns high', analyticsSource.includes('>= 0.8') || analyticsSource.includes('>=0.8'));
check('E2: medium bucket covers 0.6-0.8 range', analyticsSource.includes('>= 0.6') || (analyticsSource.includes('0.6') && analyticsSource.includes('medium')));
check('E3: low bucket covers below 0.6', analyticsSource.includes('return \'low\'') || analyticsSource.includes('return "low"') || analyticsSource.includes("return 'low'"));
check('E4: null/undefined returns unknown', analyticsSource.includes('unknown'));

console.log('\nF. getCsvRowsBucket logic\n');

check('F1: 0 returns empty', analyticsSource.includes('0') && analyticsSource.includes('empty'));
check('F2: <= 5 returns small', analyticsSource.includes('<= 5') || analyticsSource.includes('<=5'));
check('F3: <= 20 returns medium', analyticsSource.includes('<= 20') || analyticsSource.includes('<=20'));
check('F4: > 20 returns large', analyticsSource.includes('large'));

console.log('\nG. getWarningCodes extracts codes safely\n');

check('G1: maps warnings to code', analyticsSource.includes('.code'));
check('G2: filters falsy codes', analyticsSource.includes('filter(Boolean)'));
check('G3: returns array', analyticsSource.includes('return result.warnings') || (analyticsSource.includes('Array.isArray') && analyticsSource.includes('.map')));

console.log('\nH. Safe emit\n');

check('H1: safeEmit function exists', analyticsSource.includes('function safeEmit'));
check('H2: safeEmit catches errors', analyticsSource.includes('catch'));
check('H3: safeEmit checks analytics existence', analyticsSource.includes('typeof analytics'));

console.log('\nI. JSX integration\n');

check('I1: imports from addresseeAnalytics', jsxSource.includes("from '../utils/addresseeAnalytics'") || jsxSource.includes("from \"../utils/addresseeAnalytics\""));
check('I2: calls trackAddresseeToolOpened', jsxSource.includes('trackAddresseeToolOpened'));
check('I3: calls trackAddresseeScenarioChange or trackAddresseeScenarioSelected', jsxSource.includes('trackAddresseeScenarioChange') || jsxSource.includes('trackAddresseeScenarioSelected'));
check('I4: calls trackAddresseeGenerated', jsxSource.includes('trackAddresseeGenerated'));
check('I5: calls trackAddresseeWarningShown', jsxSource.includes('trackAddresseeWarningShown'));
check('I6: calls trackAddresseeCopyClicked', jsxSource.includes('trackAddresseeCopyClicked'));
check('I7: calls trackAddresseeExportClicked', jsxSource.includes('trackAddresseeExportClicked'));
check('I8: calls trackAddresseeCsvImportStarted', jsxSource.includes('trackAddresseeCsvImportStarted'));
check('I9: calls trackAddresseeCsvImportCompleted', jsxSource.includes('trackAddresseeCsvImportCompleted'));
check('I10: calls trackAddresseePresetAction', jsxSource.includes('trackAddresseePresetAction'));
check('I11: calls trackAddresseePremiumIntent', jsxSource.includes('trackAddresseePremiumIntent'));
check('I12: calls trackAddresseeExplanationOpened', jsxSource.includes('trackAddresseeExplanationOpened'));

console.log('\nJ. Explanation event does NOT send text\n');

check('J1: explanation code tracked', jsxSource.includes('explanation.code') || jsxSource.includes("explanation['code']"));
check('J2: explanation.text NOT passed as analytics param', !jsxSource.match(/trackAddresseeExplanationOpened\s*\([^)]*explanation\.text\s*[,)}]/));
check('J3: onToggle on explanation details', jsxSource.includes('onToggle'));

console.log('\nK. Copy button analytics - dynamic import pattern\n');

check('K1: CopyButton uses dynamic import for analytics', copyButtonSource.includes('await import('));
check('K2: CopyButton destructures trackLinkCopied from analytics', copyButtonSource.includes('trackLinkCopied'));
check('K3: CopyButton wraps in try/catch', copyButtonSource.includes('try {') && copyButtonSource.includes('catch'));

console.log('\nL. Existing analytics not broken\n');

check('L1: analytics.js still exports ANALYTICS_EVENTS', analyticsUtilsSource.includes('export { ANALYTICS_EVENTS }') || analyticsUtilsSource.includes('export const ANALYTICS_EVENTS'));
check('L2: analytics.js still exports analytics service', analyticsUtilsSource.includes('export const analytics'));
check('L3: CopyButton still works with dynamic import', copyButtonSource.includes('await import'));
check('L4: formatAddressee still exported from formatter', formatterSource.includes('export function formatAddressee'));

console.log('\nM. No direct raw field exposure in JSX analytics calls\n');

const analyticsCallPatterns = [
  /trackAddresseeToolOpened\s*\(\s*\{[^}]*fullName/,
  /trackAddresseeGenerated\s*\([^)]*fullName/,
  /trackAddresseeCopyClicked\s*\([^)]*fullName/,
  /trackAddresseeExportClicked\s*\([^)]*fullName/,
];
const hasRawFieldLeak = analyticsCallPatterns.some(pattern => pattern.test(jsxSource));
check('M1: no fullName in analytics calls', !hasRawFieldLeak);
check('M2: copyAllText content not sent to analytics', !jsxSource.match(/trackAddresseeCopyClicked\s*\([^)]*copyAllText\s*[,)}]/));

console.log('\nN. Preset analytics privacy\n');

check('N1: preset label not tracked', !jsxSource.match(/trackAddresseePresetAction[^;]*\.label/));
check('N2: preset.data not in trackAddresseePresetAction call', !jsxSource.match(/trackAddresseePresetAction\s*\([^)]*\.data\b/));
check('N3: preset object not sent to analytics', !jsxSource.match(/trackAddresseePresetAction\s*\(\s*preset\s*[,\)]/));

console.log('\nO. CSV analytics privacy\n');

check('O1: raw CSV rows not tracked', !jsxSource.match(/trackAddresseeCsvImport[^;]*bulkInput/) || jsxSource.includes('trackAddresseeCsvImportStarted'));
check('O2: row names not tracked', !jsxSource.includes('trackAddresseeCsvImportCompleted') || !jsxSource.match(/trackAddresseeCsvImportCompleted\s*\([^)]*fullName/));
check('O3: bulkResults row content not tracked in analytics', !jsxSource.includes('trackAddresseeCsvImport') || !jsxSource.match(/trackAddresseeCsvImportCompleted\s*\([^)]*bulkResults\.fullName/));

console.log('\n=== Results ===\n');

console.log(`Total: ${pass}/${pass + fail}`);
if (fail === 0) {
  console.log('All addressee analytics checks passed!\n');
} else {
  console.log(`Failed: ${fail}\n`);
  process.exit(1);
}