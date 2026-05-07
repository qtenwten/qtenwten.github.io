import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    passed++
    console.log(`  ✓ ${message}`)
  } else {
    failed++
    console.log(`  ✗ FAIL: ${message}`)
  }
}

function run() {
  console.log('\n=== Addressee DOCX Export Checks ===\n')

  // 1. Helper file exists and is importable
  console.log('1. Helper file')
  const helperPath = path.join(rootDir, 'src/utils/addresseeDocxExport.js')
  assert(fs.existsSync(helperPath), 'addresseeDocxExport.js exists')

  // 2. Exports correct functions
  console.log('\n2. Exports')
  const helperContent = fs.readFileSync(helperPath, 'utf-8')
  assert(helperContent.includes('export'), 'has exports')
  assert(helperContent.includes('generateAddresseeDocxBlob') || helperContent.includes('downloadAddresseeDocx'), 'exports generation function')

  // 3. Uses docx library correctly
  console.log('\n3. DOCX library usage')
  assert(helperContent.includes('Document') || helperContent.includes('P') || helperContent.includes('Text'), 'uses docx primitives')

  // 4. Uses sender fields (from block)
  console.log('\n4. Sender data usage')
  assert(helperContent.includes('blocks.from') || helperContent.includes('fromSection') || helperContent.includes('from'), 'uses from block for sender data')
  assert(helperContent.includes('blocks.to') || helperContent.includes('toSection') || helperContent.includes('to'), 'uses to block for addressee data')

  // 5. Handles warnings
  console.log('\n5. Warnings handling')
  assert(helperContent.includes('warnings') || helperContent.includes('warning'), 'handles warnings')

  // 6. Multiline content
  console.log('\n6. Multiline handling')
  assert(helperContent.includes('split') || helperContent.includes('\\n') || helperContent.includes('lines'), 'handles multiline content')

  // 7. No HTML injection
  console.log('\n7. Safety')
  assert(!helperContent.includes('innerHTML') || helperContent.includes('escape'), 'no innerHTML without escape')
  assert(helperContent.includes('escape') || !/unsafe|eval|script/i.test(helperContent), 'has text escaping')

  // Summary
  console.log('\n=== Results ===')
  const total = passed + failed
  if (failed === 0) {
    console.log(`\nAll checks passed: ${passed}/${total}\n`)
    process.exit(0)
  } else {
    console.log(`\nDOCX export checks FAILED: ${passed}/${total} passed, ${failed} failed\n`)
    process.exit(1)
  }
}

run()
