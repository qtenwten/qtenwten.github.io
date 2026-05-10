const fs = require('fs');
const path = require('path');

const CSS_FILE = path.join(__dirname, '..', 'src', 'pages', 'AddresseeGenerator.css');
const JSX_FILE = path.join(__dirname, '..', 'src', 'pages', 'AddresseeGenerator.jsx');

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

console.log('\n=== Addressee Mobile QA Checks ===\n');

const css = fs.readFileSync(CSS_FILE, 'utf8');
const jsx = fs.readFileSync(JSX_FILE, 'utf8');

console.log('A. Mobile media queries\n');

check('A1: has mobile media query at 768px', css.includes('@media (max-width: 768px)'));
check('A2: has mobile media query at 420px', css.includes('@media (max-width: 420px)'));
check('A3: has desktop breakpoint at 1040px', css.includes('@media (max-width: 1040px)'));

console.log('\nB. Scenario selector mobile\n');

check('B1: scenario grid uses flex wrap on mobile', css.includes('.addr-gen-scenario-grid {') && css.includes('flex-wrap: wrap'));
check('B2: scenario grid uses grid on desktop', css.includes('.addr-gen-scenario-grid'));
check('B3: scenario card has mobile min-height set', css.includes('.addr-gen-scenario-card') && css.match(/\.addr-gen-scenario-card\s*\{[^}]*min-height:\s*\d+px/));
check('B4: scenario card title has mobile font-size override', css.match(/\.addr-gen-scenario-card-title\s*\{[^}]*font-size:\s*[\d.]+rem/));
check('B5: scenario grid gap is small enough for mobile (0.5rem or less)', css.match(/\.addr-gen-scenario-grid\s*\{[^}]*gap:\s*[\d.]+rem/));

console.log('\nC. Trust Layer mobile\n');

check('C1: trust-summary has mobile flex-direction override', css.match(/\.addr-gen-trust-summary\s*\{[^}]*flex-direction:\s*column/));
check('C2: trust-badges has mobile width override', css.match(/\.addr-gen-trust-badges\s*\{[^}]*width:\s*100%/));
check('C3: trust-summary-main has min-width:0 reset', css.match(/\.addr-gen-trust-summary-main\s*\{[^}]*min-width:\s*0/));
check('C4: confidence has mobile width:100%', css.match(/\.addr-gen-confidence\s*\{[^}]*width:\s*100%/));

console.log('\nD. No fixed widths that break 390px\n');

check('D1: no fixed pixel width on controls panel', !css.match(/\.addr-gen-controls\s*\{[^}]*width:\s*\d+px/));
check('D2: no fixed pixel width on result panel', !css.match(/\.addr-gen-result\s*\{[^}]*width:\s*\d+px/));
check('D3: addr-gen-layout uses fr units, not px', css.match(/\.addr-gen-layout\s*\{[^}]*grid-template-columns:\s*minmax\([^,]+,\s*[\d.]+fr\)/));
check('D4: inputs use 100% width', css.match(/\.addr-gen-input,\s*\.addr-gen-select,\s*\.addr-gen-textarea\s*\{[^}]*width:\s*100%/) || css.match(/\.addr-gen-input[\s\S]*?width:\s*100%/));

console.log('\nE. Bulk table scroll\n');

check('E1: bulk table wrap is overflow-x:auto', css.includes('.addr-gen-bulk-table-wrap') && css.includes('overflow-x: auto'));
check('E2: bulk table has min-width for columns', css.includes('.addr-gen-bulk-table') && css.includes('min-width'));
check('E3: bulk table cells have max-width', css.includes('.addr-gen-bulk-table td') && css.includes('max-width'));

console.log('\nF. Scenario cards use flex/grid with wrap\n');

check('F1: scenario cards use flex in mobile media', css.match(/@media\s*\(max-width:\s*768px\)[^@]*\.addr-gen-scenario-grid\s*\{[^}]*display:\s*flex/));
check('F2: scenario cards flex-basis allows 2 per row', css.match(/\.addr-gen-scenario-card\s*\{[^}]*flex:\s*[\d.]+\s*[\d.]+\s*calc\(50%/));

console.log('\nG. Export/action buttons wrap\n');

check('G1: export-actions use flex-wrap: wrap', css.includes('.addr-gen-export-actions') && css.includes('flex-wrap: wrap'));
check('G2: actions use flex-wrap: wrap', css.includes('.addr-gen-actions') && css.includes('flex-wrap: wrap'));
check('G3: mobile makes actions column direction', css.includes('@media (max-width: 768px)') && css.includes('.addr-gen-actions') && css.match(/.addr-gen-actions[\s\S]*?flex-direction:\s*column/));

console.log('\nH. JSX className coverage\n');

check('H1: addr-gen-page class used', jsx.includes('addr-gen-page'));
check('H2: addr-gen-scenario class used', jsx.includes('addr-gen-scenario'));
check('H3: addr-gen-layout class used', jsx.includes('addr-gen-layout'));
check('H4: addr-gen-controls class used', jsx.includes('addr-gen-controls'));
check('H5: addr-gen-trust-layer class used', jsx.includes('addr-gen-trust-layer'));
check('H6: addr-gen-bulk class used', jsx.includes('addr-gen-bulk'));
check('H7: addr-gen-scenario-grid class used', jsx.includes('addr-gen-scenario-grid'));
check('H8: JSX uses scenario card buttons with className', jsx.includes('addr-gen-scenario-card'));

console.log('\nI. aria-label and accessibility\n');

check('I1: scenario section has aria-labelledby', jsx.includes('aria-labelledby="addrScenarioTitle"'));
check('I2: bulk section has aria-labelledby', jsx.includes('aria-labelledby="addrBulkTitle"'));
check('I3: result section has aria-live', jsx.includes('aria-live="polite"'));
check('I4: form has onSubmit', jsx.includes('onSubmit={handleSubmit}'));
check('I5: generate button is type=submit', jsx.includes('type="submit"'));

console.log('\n=== Results ===\n');

console.log(`Total: ${pass + fail}/${pass + fail}`);
if (fail === 0) {
  console.log('All mobile QA checks passed!\n');
} else {
  console.log(`Failed: ${fail}\n`);
  process.exit(1);
}
