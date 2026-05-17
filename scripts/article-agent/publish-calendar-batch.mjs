import path from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const defaultCalendarRoot = 'BD/article-publish-calendar'

function getMoscowDate() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function printUsage() {
  console.log(`
Usage:
  node scripts/article-agent/publish-calendar-batch.mjs --dry-run
  node scripts/article-agent/publish-calendar-batch.mjs --date 2026-05-18 --publish

Options:
  --date YYYY-MM-DD                 Calendar date. Defaults to current Europe/Moscow date.
  --calendar-root <path>            Defaults to BD/article-publish-calendar.
  --publish                         Publish through Worker API.
  --dry-run                         Validate only (default).
  --skip-existing                   Safe rerun mode for already published identical articles.
  --skip-remote-duplicate-check     Skip Worker public duplicate scan.
  --env-file <path>                 Forward env file option to publish-daily-batch.mjs.
  --public-base-url <url>           Forward public base URL option.
`)
}

function parseArgs(argv) {
  const options = {
    date: '',
    calendarRoot: defaultCalendarRoot,
    publish: false,
    skipExisting: false,
    skipRemoteDuplicateCheck: false,
    envFile: '',
    publicBaseUrl: '',
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--date') {
      options.date = argv[i + 1] || ''
      i += 1
    } else if (arg === '--calendar-root') {
      options.calendarRoot = argv[i + 1] || ''
      i += 1
    } else if (arg === '--publish') {
      options.publish = true
    } else if (arg === '--dry-run') {
      options.publish = false
    } else if (arg === '--skip-existing') {
      options.skipExisting = true
    } else if (arg === '--skip-remote-duplicate-check') {
      options.skipRemoteDuplicateCheck = true
    } else if (arg === '--env-file') {
      options.envFile = argv[i + 1] || ''
      i += 1
    } else if (arg === '--public-base-url') {
      options.publicBaseUrl = argv[i + 1] || ''
      i += 1
    } else if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (!options.date) options.date = getMoscowDate()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.date)) {
    throw new Error(`Invalid --date value: ${options.date}. Expected YYYY-MM-DD.`)
  }

  if (!options.calendarRoot) {
    throw new Error('Missing --calendar-root value')
  }

  return options
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const batchDir = path.resolve(repoRoot, options.calendarRoot, options.date)
  const relativeBatchDir = path.relative(repoRoot, batchDir)

  if (!fs.existsSync(batchDir) || !fs.statSync(batchDir).isDirectory()) {
    throw new Error(`Calendar batch not found for ${options.date}: ${relativeBatchDir}`)
  }

  const args = [
    path.join(repoRoot, 'scripts/article-agent/publish-daily-batch.mjs'),
    '--dir',
    relativeBatchDir,
    options.publish ? '--publish' : '--dry-run',
  ]

  if (options.publish || options.skipExisting) args.push('--skip-existing')
  if (options.skipRemoteDuplicateCheck) args.push('--skip-remote-duplicate-check')
  if (options.envFile) args.push('--env-file', options.envFile)
  if (options.publicBaseUrl) args.push('--public-base-url', options.publicBaseUrl)

  console.log(`Calendar date: ${options.date}`)
  console.log(`Calendar batch: ${relativeBatchDir}`)
  console.log(`Mode: ${options.publish ? 'publish' : 'dry-run'}`)

  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  })

  if (result.error) throw result.error
  process.exit(result.status ?? 1)
}

try {
  main()
} catch (err) {
  console.error(`\nRESULT: FAIL\n${err.message}`)
  process.exit(1)
}
