import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { formatAddressee } from '../src/utils/addresseeFormatter.js';
import {
  applyScenarioToInput,
  buildScenarioQueryParams,
  getAddresseeScenarioOptions,
  getDefaultAddresseeScenario,
  getScenarioFromQueryParams,
  getScenarioUiConfig,
  isBulkScenario,
} from '../src/utils/addresseeScenarioUi.js';
import {
  PROFILE_IDS,
  SCENARIO_IDS,
} from '../src/utils/addresseeProfiles.js';
import {
  DOCUMENT_TEMPLATE_APPLICATION,
  DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  DOCUMENT_TEMPLATE_MEMO,
} from '../src/utils/addresseeTypes.js';
import { buildSingleCsvExport } from '../src/utils/addresseeExport.js';
import { generateAddresseeDocxBlob } from '../src/utils/addresseeDocxExport.js';

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

async function run() {
  console.log('\n=== Addressee Scenario UX Checks ===\n');

  const t = makeT({
    'addresseeGenerator.addressee.scenarioUx.options.application.label': 'Russian application',
    'addresseeGenerator.addressee.scenarioUx.options.application.description': 'Application desc',
    'addresseeGenerator.addressee.scenarioUx.options.application.hint': 'Application hint',
    'addresseeGenerator.addressee.scenarioUx.options.applicationDirector.label': 'Application to director',
    'addresseeGenerator.addressee.scenarioUx.options.applicationDirector.description': 'Director desc',
    'addresseeGenerator.addressee.scenarioUx.options.applicationDirector.hint': 'Director hint',
    'addresseeGenerator.addressee.scenarioUx.options.memo.label': 'Russian memo',
    'addresseeGenerator.addressee.scenarioUx.options.memo.description': 'Memo desc',
    'addresseeGenerator.addressee.scenarioUx.options.memo.hint': 'Memo hint',
    'addresseeGenerator.addressee.scenarioUx.options.complaint.label': 'Russian complaint',
    'addresseeGenerator.addressee.scenarioUx.options.complaint.description': 'Complaint desc',
    'addresseeGenerator.addressee.scenarioUx.options.complaint.hint': 'Complaint hint',
    'addresseeGenerator.addressee.scenarioUx.options.request.label': 'Russian request',
    'addresseeGenerator.addressee.scenarioUx.options.request.description': 'Request desc',
    'addresseeGenerator.addressee.scenarioUx.options.request.hint': 'Request hint',
    'addresseeGenerator.addressee.scenarioUx.options.businessLetter.label': 'Business-style Russian letter',
    'addresseeGenerator.addressee.scenarioUx.options.businessLetter.description': 'Business desc',
    'addresseeGenerator.addressee.scenarioUx.options.businessLetter.hint': 'Business hint',
    'addresseeGenerator.addressee.scenarioUx.options.custom.label': 'Custom Russian document',
    'addresseeGenerator.addressee.scenarioUx.options.custom.description': 'Custom desc',
    'addresseeGenerator.addressee.scenarioUx.options.custom.hint': 'Custom hint',
    'addresseeGenerator.addressee.scenarioUx.options.csvBulk.label': 'CSV / multiple addressees',
    'addresseeGenerator.addressee.scenarioUx.options.csvBulk.description': 'CSV desc',
    'addresseeGenerator.addressee.scenarioUx.options.csvBulk.hint': 'CSV hint',
  });

  console.log('A. Scenario UI helper');
  const helperPath = path.join(rootDir, 'src/utils/addresseeScenarioUi.js');
  assert(fs.existsSync(helperPath), 'A1: addresseeScenarioUi.js exists');

  const options = getAddresseeScenarioOptions(t, 'en');
  const optionIds = options.map((option) => option.id);
  [
    SCENARIO_IDS.APPLICATION,
    SCENARIO_IDS.APPLICATION_DIRECTOR,
    SCENARIO_IDS.MEMO,
    SCENARIO_IDS.COMPLAINT,
    SCENARIO_IDS.REQUEST,
    SCENARIO_IDS.BUSINESS_LETTER,
    SCENARIO_IDS.CUSTOM,
    SCENARIO_IDS.CSV_BULK,
  ].forEach((scenarioId) => {
    assert(optionIds.includes(scenarioId), `A2: scenario options include ${scenarioId}`);
  });
  assert(!optionIds.includes(SCENARIO_IDS.EN_BUSINESS_LETTER), 'A3: future EN business-letter mode is not displayed');
  assert(!optionIds.includes(SCENARIO_IDS.EN_INTERNAL_MEMO), 'A4: future EN memo mode is not displayed');
  assert(getDefaultAddresseeScenario('ru') === SCENARIO_IDS.BUSINESS_LETTER, 'A5: default scenario preserves legacy business-letter behavior');
  assert(getScenarioUiConfig(SCENARIO_IDS.MEMO, t, 'en').documentTemplate === DOCUMENT_TEMPLATE_MEMO, 'A6: scenario config exposes documentTemplate');
  assert(isBulkScenario(SCENARIO_IDS.CSV_BULK), 'A7: csvBulk is recognized as bulk scenario');
  assert(!isBulkScenario(SCENARIO_IDS.APPLICATION), 'A8: application is not bulk scenario');

  console.log('\nB. Scenario application');
  const input = {
    fullName: 'Ivanov Ivan Ivanovich',
    position: 'director',
    organization: 'Example LLC',
    senderFullName: 'Petrova Anna',
    senderPosition: 'manager',
    senderOrganization: 'Sender LLC',
    documentTemplate: DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  };
  const originalJson = JSON.stringify(input);
  const applicationInput = applyScenarioToInput(input, SCENARIO_IDS.APPLICATION);
  assert(JSON.stringify(input) === originalJson, 'B1: applyScenarioToInput does not mutate input');
  assert(applicationInput !== input, 'B2: applyScenarioToInput returns a new object');
  assert(applicationInput.fullName === input.fullName, 'B3: fullName is preserved');
  assert(applicationInput.position === input.position, 'B4: position is preserved');
  assert(applicationInput.organization === input.organization, 'B5: organization is preserved');
  assert(applicationInput.senderFullName === input.senderFullName, 'B6: sender full name is preserved');
  assert(applicationInput.senderPosition === input.senderPosition, 'B7: sender position is preserved');
  assert(applicationInput.senderOrganization === input.senderOrganization, 'B8: sender organization is preserved');
  assert(applicationInput.scenario === SCENARIO_IDS.APPLICATION, 'B9: scenario is set');
  assert(applicationInput.profile === PROFILE_IDS.RU_OFFICIAL_STANDARD, 'B10: profile is set from scenario');
  assert(applicationInput.documentTemplate === DOCUMENT_TEMPLATE_APPLICATION, 'B11: documentTemplate is set from scenario');
  const unknownInput = applyScenarioToInput(input, 'unknown-scenario');
  assert(unknownInput.scenario === SCENARIO_IDS.CUSTOM, 'B12: unknown scenario falls back to custom');
  assert(unknownInput.profile === PROFILE_IDS.RU_SIMPLE_BUSINESS, 'B13: custom fallback uses simple business profile');
  assert(unknownInput.documentTemplate === DOCUMENT_TEMPLATE_BUSINESS_LETTER, 'B14: custom fallback uses business-letter template');

  console.log('\nC. Query params');
  assert(getScenarioFromQueryParams('?scenario=application') === SCENARIO_IDS.APPLICATION, 'C1: query supports application');
  assert(getScenarioFromQueryParams('?scenario=application-director') === SCENARIO_IDS.APPLICATION_DIRECTOR, 'C2: query supports application-director');
  assert(getScenarioFromQueryParams('?scenario=business-letter') === SCENARIO_IDS.BUSINESS_LETTER, 'C3: query supports business-letter');
  assert(getScenarioFromQueryParams('?scenario=csv-bulk') === SCENARIO_IDS.CSV_BULK, 'C4: query supports csv-bulk');
  assert(getScenarioFromQueryParams('?scenario=nope') === null, 'C5: unknown scenario query is ignored');
  assert(getScenarioFromQueryParams('?focus=to') === null, 'C6: missing scenario query is ignored safely');
  const builtParams = buildScenarioQueryParams(SCENARIO_IDS.APPLICATION_DIRECTOR, { focus: 'to', export: 'docx' });
  assert(builtParams.get('scenario') === 'application-director', 'C7: helper builds canonical scenario query');
  assert(builtParams.get('focus') === 'to', 'C8: helper preserves valid focus query');
  assert(builtParams.get('export') === 'docx', 'C9: helper preserves docx hint query');

  console.log('\nD. Formatter and exports');
  const scenarioResult = formatAddressee({
    ...applicationInput,
    gender: 'male',
  });
  assert(typeof scenarioResult.blocks.to === 'string', 'D1: selected scenario keeps blocks.to');
  assert(typeof scenarioResult.blocks.from === 'string', 'D2: selected scenario keeps blocks.from');
  assert(typeof scenarioResult.blocks.greeting === 'string', 'D3: selected scenario keeps blocks.greeting');
  assert(typeof scenarioResult.blocks.letter === 'string', 'D4: selected scenario keeps blocks.letter');
  assert(typeof scenarioResult.blocks.documentText === 'string', 'D5: selected scenario keeps blocks.documentText');
  assert(scenarioResult.profile.id === PROFILE_IDS.RU_OFFICIAL_STANDARD, 'D6: formatter result keeps selected profile metadata');
  assert(scenarioResult.scenario.id === SCENARIO_IDS.APPLICATION, 'D7: formatter result keeps selected scenario metadata');
  assert(scenarioResult.blocks.toBlock === scenarioResult.blocks.to, 'D8: enhanced aliases still exist');
  const csv = buildSingleCsvExport(scenarioResult, applicationInput, {});
  const docxBlob = await generateAddresseeDocxBlob(scenarioResult, { t: (key) => key });
  assert(csv.includes('documentText') && csv.includes('warnings'), 'D9: CSV export accepts scenario result');
  assert(docxBlob && docxBlob.size > 0, 'D10: DOCX export accepts scenario result');

  console.log('\nE. Source checks');
  const jsxSource = read('src/pages/AddresseeGenerator.jsx');
  const cssSource = read('src/pages/AddresseeGenerator.css');
  const routeRegistrySource = read('src/config/routeRegistry.js');
  const routeSeoSource = read('src/config/routeSeo.js');
  const ruLocale = JSON.parse(read('src/locales/ru.json'));
  const enLocale = JSON.parse(read('src/locales/en.json'));

  assert(jsxSource.includes('addr-gen-scenario'), 'E1: UI source contains scenario selector render path');
  assert(jsxSource.includes('getAddresseeScenarioOptions'), 'E2: UI source uses scenario options helper');
  assert(jsxSource.includes('handleScenarioChange'), 'E3: UI source has scenario change handler');
  assert(jsxSource.includes('formatAddressee(form)'), 'E4: formatter receives form with scenario/profile');
  assert(jsxSource.includes('getProfileDisplayLabel') && jsxSource.includes('getScenarioDisplayLabel'), 'E5: Trust Layer still receives scenario/profile context');
  assert(!jsxSource.includes('Что нужно подготовить?') && !jsxSource.includes('Заявление директору') && !jsxSource.includes('Служебная записка'), 'E6: selector strings are localized, not hardcoded in JSX');
  assert((jsxSource.match(/result\.warnings\.map/g) || []).length === 1, 'E7: warnings are not rendered twice');
  assert(cssSource.includes('.addr-gen-scenario-card'), 'E8: CSS contains scenario card styles');
  assert(cssSource.includes('.addr-gen-bulk--active'), 'E9: CSS contains bulk highlight style');
  assert(Boolean(ruLocale.addressee?.scenarioUx?.options?.applicationDirector?.label), 'E10: RU scenario locale exists');
  assert(Boolean(enLocale.addressee?.scenarioUx?.options?.businessLetter?.label), 'E11: EN scenario locale exists');
  assert(enLocale.addressee.scenarioUx.options.businessLetter.label.includes('Russian'), 'E12: EN scenario label is honest about Russian mode');
  assert(!JSON.stringify(enLocale.addressee.scenarioUx).includes('EN business letter'), 'E13: EN future modes are not presented as ready');
  assert(!routeRegistrySource.includes('scenario='), 'E14: routeRegistry has no scenario query route changes');
  assert(!routeSeoSource.includes('?scenario='), 'E15: routeSeo has no scenario canonical/SEO query changes');

  if (failed > 0) {
    console.error(`\nAddressee scenario UX checks failed: ${failed}/${passed + failed}`);
    process.exit(1);
  }

  console.log(`\nAll addressee scenario UX checks passed: ${passed}/${passed + failed}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
