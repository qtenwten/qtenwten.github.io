const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const JSX_FILE = path.join(ROOT, 'src', 'pages', 'AddresseeGenerator.jsx');
const RU_LOCALE = path.join(ROOT, 'src', 'locales', 'ru.json');
const EN_LOCALE = path.join(ROOT, 'src', 'locales', 'en.json');
const CSS_FILE = path.join(ROOT, 'src', 'pages', 'AddresseeGenerator.css');

let pass = 0;
let fail = 0;

function check(desc, cond) {
  if (cond) {
    console.log(`  PASS: ${desc}`);
    pass++;
  } else {
    console.log(`  FAIL: ${desc}`);
    fail++;
  }
}

function getLocaleValue(locale, keyPath) {
  const parts = keyPath.split('.');
  let val = locale;
  for (const p of parts) {
    if (!val || typeof val !== 'object') return null;
    val = val[p];
  }
  return val !== undefined ? val : null;
}

console.log('\n=== Addressee UI i18n Checks ===\n');

const jsx = fs.readFileSync(JSX_FILE, 'utf8');
const ru = JSON.parse(fs.readFileSync(RU_LOCALE, 'utf8'));
const en = JSON.parse(fs.readFileSync(EN_LOCALE, 'utf8'));
const css = fs.readFileSync(CSS_FILE, 'utf8');

const addresseePath = 'addresseeGenerator.addressee';

console.log('A. Scenario UX locale keys exist\n');

const scenarioKeys = [
  'kicker', 'title', 'currentLabel',
  'advanced.title', 'advanced.description',
  'focusHints.to', 'focusHints.from', 'focusHints.salutation',
  'queryHints.exportDocx', 'queryHints.csvBulk',
];
const scenarioOptionIds = ['application', 'applicationDirector', 'memo', 'complaint', 'request', 'businessLetter', 'custom', 'csvBulk'];

scenarioKeys.forEach((key) => {
  const fullKey = `${addresseePath}.scenarioUx.${key}`;
  check(`A1: ru ${fullKey} exists`, getLocaleValue(ru, fullKey) !== null);
  check(`A2: en ${fullKey} exists`, getLocaleValue(en, fullKey) !== null);
});

scenarioOptionIds.forEach((id) => {
  const labelKey = `${addresseePath}.scenarioUx.options.${id}.label`;
  const descKey = `${addresseePath}.scenarioUx.options.${id}.description`;
  check(`A3: ru ${labelKey} exists`, getLocaleValue(ru, labelKey) !== null);
  check(`A4: en ${labelKey} exists`, getLocaleValue(en, labelKey) !== null);
  check(`A5: ru ${descKey} exists`, getLocaleValue(ru, descKey) !== null);
  check(`A6: en ${descKey} exists`, getLocaleValue(en, descKey) !== null);
});

console.log('\nB. Presets locale keys exist\n');

const presetKeys = ['storageNote', 'storageUnavailable'];
const sectionKeys = ['title', 'empty', 'apply', 'delete', 'save'];
const sectionIds = ['recipientSection', 'senderSection'];

presetKeys.forEach((key) => {
  const fullKey = `${addresseePath}.presets.${key}`;
  check(`B1: ru ${fullKey} exists`, getLocaleValue(ru, fullKey) !== null);
  check(`B2: en ${fullKey} exists`, getLocaleValue(en, fullKey) !== null);
});

sectionIds.forEach((sectionId) => {
  sectionKeys.forEach((key) => {
    const fullKey = `${addresseePath}.presets.${sectionId}.${key}`;
    check(`B3: ru ${fullKey} exists`, getLocaleValue(ru, fullKey) !== null);
    check(`B4: en ${fullKey} exists`, getLocaleValue(en, fullKey) !== null);
  });
});

console.log('\nC. JSX uses correct t() paths for all scenario/preset strings\n');

const rawScenarioKeys = jsx.match(/t\(['"]addresseeGenerator\.addressee\.scenarioUx\.[^'"]+'\)/g) || [];
const rawPresetKeys = jsx.match(/t\(['"]addresseeGenerator\.addressee\.presets\.[^'"]+'\)/g) || [];

const rawKeys = [...rawScenarioKeys, ...rawPresetKeys].map((s) => {
  const m = s.match(/t\(['"]([^'"]+)'\)/);
  return m ? m[1] : s;
});

const missingKeys = rawKeys.filter((key) => {
  const parts = key.split('.');
  let val = ru.addresseeGenerator;
  for (const p of parts) {
    if (!val || typeof val !== 'object') return true;
    val = val[p];
  }
  return val === undefined || val === null;
});

check(`C1: no missing RU keys for scenario/preset t() calls`, missingKeys.length === 0);
if (missingKeys.length > 0) {
  console.log(`    Missing: ${missingKeys.join(', ')}`);
}

console.log('\nD. JSX does not hardcode raw strings\n');

const hardcodedRuStrings = [
  'Сохранённые адресаты', 'Сохранённые отправители',
  'Сохранить адресата', 'Сохранить отправителя',
  'Что нужно подготовить', 'Выберите сценарий',
  'Свой вариант', 'Заявление', 'Служебная записка',
  'Ручная проверка падежей',
];
hardcodedRuStrings.forEach((str) => {
  const regex = new RegExp(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  check(`D1: no hardcoded "${str}" in JSX`, !regex.test(jsx));
});

console.log('\nE. CSS for scenario and preset UI exists\n');

const cssClasses = [
  '.addr-gen-scenario', '.addr-gen-scenario-head', '.addr-gen-scenario-current',
  '.addr-gen-scenario-grid', '.addr-gen-scenario-card', '.addr-gen-scenario-card--selected',
  '.addr-gen-scenario-card-title', '.addr-gen-scenario-card-desc',
  '.addr-gen-scenario-guidance', '.addr-gen-query-hints',
  '.addr-gen-presets', '.addr-gen-presets-header', '.addr-gen-presets-title',
  '.addr-gen-presets-note', '.addr-gen-presets-empty', '.addr-gen-presets-list',
  '.addr-gen-preset-row', '.addr-gen-preset-label', '.addr-gen-preset-warning',
];
cssClasses.forEach((cls) => {
  check(`E1: ${cls} exists in CSS`, css.includes(cls));
});

console.log('\nF. Scenario options are unique and correct count\n');

const scenarioOptionsInJsx = jsx.match(/getAddresseeScenarioOptions\(/g) || [];
check(`F1: getAddresseeScenarioOptions is used`, scenarioOptionsInJsx.length > 0);

const selectedCardMatch = jsx.match(/form\.scenario\s*===\s*option\.id/g) || [];
check(`F2: scenario selection uses option.id comparison`, selectedCardMatch.length > 0);

const onClickMatch = jsx.match(/onClick=\{\(\)\s*=>\s*handleScenarioChange\(option\.id\)\}/g) || [];
check(`F3: onClick passes option.id to handler`, onClickMatch.length > 0);

const uniqueKeyMatch = jsx.match(/key=\{option\.id\}/g) || [];
check(`F4: scenario cards use option.id as key`, uniqueKeyMatch.length > 0);

console.log('\nG. Trust layer locale keys\n');

const trustKeys = ['title', 'profileLabel', 'scenarioLabel', 'manualReview.title', 'manualReview.description', 'warnings.title', 'warning.suggestionPrefix', 'explanations.title'];
trustKeys.forEach((key) => {
  const fullKey = `${addresseePath}.trust.${key}`;
  check(`G1: ru ${fullKey} exists`, getLocaleValue(ru, fullKey) !== null);
  check(`G2: en ${fullKey} exists`, getLocaleValue(en, fullKey) !== null);
});

console.log('\n=== Results ===\n');
console.log(`Total: ${pass}/${pass + fail}`);
if (fail === 0) {
  console.log('All addressee UI i18n checks passed!\n');
  process.exit(0);
} else {
  console.log(`Failed: ${fail}\n`);
  process.exit(1);
}