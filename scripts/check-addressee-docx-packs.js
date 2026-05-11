import { ADDRESSEE_DOC_PACKS, validatePackIntegrity, getAllPackIds, PACK_IDS } from '../src/utils/addresseeDocxPacks.js';
import {
  DOCUMENT_TEMPLATE_APPLICATION,
  DOCUMENT_TEMPLATE_COMPLAINT,
  DOCUMENT_TEMPLATE_REQUEST,
  DOCUMENT_TEMPLATE_MEMO,
  DOCUMENT_TEMPLATE_BUSINESS_LETTER,
} from '../src/utils/addresseeTypes.js';

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

const FORBIDDEN_LEGAL_CLAIMS = [
  'гарантированно',
  'обязаны принять',
  'юридическая консультация',
  'юридический совет',
  'суд обязан',
  'гарантия',
  '100%',
  'без ошибок',
  'без исключений',
];

const VALID_DOCUMENT_TEMPLATES = [
  DOCUMENT_TEMPLATE_APPLICATION,
  DOCUMENT_TEMPLATE_COMPLAINT,
  DOCUMENT_TEMPLATE_REQUEST,
  DOCUMENT_TEMPLATE_MEMO,
  DOCUMENT_TEMPLATE_BUSINESS_LETTER,
];

async function main() {
  console.log('\n=== Addressee DOCX Packs Checks ===\n');

  console.log('A. Pack integrity');
  const errors = validatePackIntegrity();
  assert(errors.length === 0, `All packs have valid structure (${errors.length} errors)`);
  if (errors.length > 0) {
    errors.forEach(e => console.log(`    - ${e}`));
  }

  console.log('\nB. Unique pack IDs');
  const ids = getAllPackIds();
  const uniqueIds = new Set(ids);
  assert(uniqueIds.size === ids.length, `All ${ids.length} pack IDs are unique`);
  assert(ids.length === 8, `Exactly 8 packs defined (got ${ids.length})`);

  console.log('\nC. Document template mapping');
  const templateCounts = {};
  for (const pack of ADDRESSEE_DOC_PACKS) {
    const t = pack.documentTemplate;
    templateCounts[t] = (templateCounts[t] || 0) + 1;
  }
  assert(templateCounts[DOCUMENT_TEMPLATE_APPLICATION] >= 4, `Application template has enough packs (${templateCounts[DOCUMENT_TEMPLATE_APPLICATION] || 0} >= 4)`);
  assert(templateCounts[DOCUMENT_TEMPLATE_COMPLAINT] >= 1, `Complaint template has packs (${templateCounts[DOCUMENT_TEMPLATE_COMPLAINT] || 0} >= 1)`);
  assert(templateCounts[DOCUMENT_TEMPLATE_REQUEST] >= 1, `Request template has packs (${templateCounts[DOCUMENT_TEMPLATE_REQUEST] || 0} >= 1)`);
  assert(templateCounts[DOCUMENT_TEMPLATE_MEMO] >= 1, `Memo template has packs (${templateCounts[DOCUMENT_TEMPLATE_MEMO] || 0} >= 1)`);
  assert(templateCounts[DOCUMENT_TEMPLATE_BUSINESS_LETTER] >= 1, `Business letter template has packs (${templateCounts[DOCUMENT_TEMPLATE_BUSINESS_LETTER] || 0} >= 1)`);

  console.log('\nD. No forbidden legal claims in packs');
  const allText = ADDRESSEE_DOC_PACKS.map(p => JSON.stringify(p.pack)).join(' ').toLowerCase();
  const foundForbidden = FORBIDDEN_LEGAL_CLAIMS.filter(w => allText.includes(w));
  assert(foundForbidden.length === 0, `No forbidden legal claims (found: ${foundForbidden.join(', ') || 'none'})`);

  console.log('\nE. Pack selection does not break formatter');
  const { formatAddressee } = await import('../src/utils/addresseeFormatter.js');
  for (const pack of ADDRESSEE_DOC_PACKS) {
    const testInput = {
      fullName: 'Иванов Иван Иванович',
      position: 'директор',
      organization: 'ООО "Тест"',
      documentTemplate: pack.documentTemplate,
    };
    try {
      const result = formatAddressee(testInput);
      assert(result && result.blocks, `Pack "${pack.id}": formatter produces result`);
      assert(result.blocks.to, `Pack "${pack.id}": formatter produces blocks.to`);
      assert(result.blocks.documentText, `Pack "${pack.id}": formatter produces blocks.documentText`);
    } catch (err) {
      assert(false, `Pack "${pack.id}": formatter does not throw (${err.message})`);
    }
  }

  console.log('\nF. DOCX export accepts pack result');
  const { generateAddresseeDocxBlob } = await import('../src/utils/addresseeDocxExport.js');
  for (const pack of ADDRESSEE_DOC_PACKS.slice(0, 3)) {
    const testInput = {
      fullName: 'Иванов Иван Иванович',
      position: 'директор',
      organization: 'ООО "Тест"',
      documentTemplate: pack.documentTemplate,
    };
    try {
      const result = formatAddressee(testInput);
      const blob = await generateAddresseeDocxBlob(result, { t: (key) => key, cleanExport: true });
      assert(blob && blob.size > 0, `Pack "${pack.id}": DOCX blob is non-empty (${blob?.size || 0} bytes)`);
    } catch (err) {
      assert(false, `Pack "${pack.id}": DOCX export does not throw (${err.message})`);
    }
  }

  console.log('\nG. Pack IDs match expected constants');
  const expectedIds = [
    PACK_IDS.SCHOOL_DIRECTOR_APPLICATION,
    PACK_IDS.EMPLOYER_APPLICATION,
    PACK_IDS.MANAGEMENT_COMPANY_APPLICATION,
    PACK_IDS.ADMINISTRATION_APPLICATION,
    PACK_IDS.COMPLAINT_TO_ORGANIZATION,
    PACK_IDS.REQUEST_TO_ORGANIZATION,
    PACK_IDS.MEMO_TO_MANAGER,
    PACK_IDS.BUSINESS_LETTER_TO_PARTNER,
  ];
  for (const expectedId of expectedIds) {
    assert(getAllPackIds().includes(expectedId), `Expected pack ID "${expectedId}" exists`);
  }

  console.log('\n=== Results ===');
  const total = passed + failed;
  if (failed === 0) {
    console.log(`\nAll pack checks passed: ${passed}/${total}\n`);
    process.exit(0);
  } else {
    console.log(`\nPack checks FAILED: ${passed}/${total} passed, ${failed} failed`);
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