import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const defaultOutputDir = path.join(repoRoot, 'BD/article-autogen-out')
const defaultApiBase = 'https://fancy-scene-deeb.qten.workers.dev'
const editorialStandardPath = path.join(repoRoot, 'BD/ARTICLE_EDITORIAL_STANDARD.md')

const ARTICLE_COUNT_RU = 3
const ARTICLE_COUNT_EN = 3
const PAIR_COUNT = 3
const PAGE_SIZE = 50

const MODEL = process.env.OPENAI_ARTICLE_MODEL || 'gpt-5.4'
const REASONING_EFFORT = process.env.OPENAI_REASONING_EFFORT || 'medium'
const MAX_ATTEMPTS = Number(process.env.OPENAI_ARTICLE_ATTEMPTS || 3)
const MAX_OUTPUT_TOKENS = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 24000)

const tools = [
  {
    tool_slug: 'number-to-words',
    ru_url: '/ru/number-to-words/',
    en_url: '/en/number-to-words/',
    focus: 'amounts in words for invoices, contracts, acts, payment documents, currencies, VAT wording',
  },
  {
    tool_slug: 'vat-calculator',
    ru_url: '/ru/vat-calculator/',
    en_url: '/en/vat-calculator/',
    focus: 'VAT calculation, extracting VAT, adding VAT, comparing gross and net prices, invoice checks',
  },
  {
    tool_slug: 'random-number',
    ru_url: '/ru/random-number/',
    en_url: '/en/random-number/',
    focus: 'random numbers, winners, raffles, no-repeat selection, random order, samples',
  },
  {
    tool_slug: 'calculator',
    ru_url: '/ru/calculator/',
    en_url: '/en/calculator/',
    focus: 'quick arithmetic, percent calculations, everyday formulas, checking manual calculations',
  },
  {
    tool_slug: 'date-difference',
    ru_url: '/ru/date-difference/',
    en_url: '/en/date-difference/',
    focus: 'days between dates, deadlines, overdue days, contract dates, event countdowns',
  },
  {
    tool_slug: 'compound-interest',
    ru_url: '/ru/compound-interest/',
    en_url: '/en/compound-interest/',
    focus: 'compound interest, monthly contributions, savings goals, investment projections',
  },
  {
    tool_slug: 'meta-tags-generator',
    ru_url: '/ru/meta-tags-generator/',
    en_url: '/en/meta-tags-generator/',
    focus: 'meta tags, Open Graph, social previews, title and description snippets',
  },
  {
    tool_slug: 'seo-audit-pro',
    ru_url: '/ru/seo-audit-pro/',
    en_url: '/en/seo-audit-pro/',
    focus: 'page SEO checks, publishing checklist, redesign audits, technical and content SEO',
  },
  {
    tool_slug: 'qr-code-generator',
    ru_url: '/ru/qr-code-generator/',
    en_url: '/en/qr-code-generator/',
    focus: 'QR codes for menus, Wi-Fi, contacts, print materials, events, payments, short links',
  },
  {
    tool_slug: 'url-shortener',
    ru_url: '/ru/url-shortener/',
    en_url: '/en/url-shortener/',
    focus: 'short links, UTM campaigns, QR-friendly links, messenger links, tracking hygiene',
  },
  {
    tool_slug: 'password-generator',
    ru_url: '/ru/password-generator/',
    en_url: '/en/password-generator/',
    focus: 'strong passwords, temporary access, Wi-Fi passwords, manual entry, password length',
  },
  {
    tool_slug: 'generator-adresata',
    ru_url: '/ru/generator-adresata/',
    en_url: '/en/generator-adresata/',
    focus: 'Russian business letter addressee, to/from blocks, applications, memos, salutations',
  },
]

const forbiddenPhrases = [
  'in today\'s fast-paced world',
  'in the modern world',
  'it is important to note',
  'this article will help you',
  'is an important tool',
  'in conclusion',
  'данная статья',
  'важно отметить',
  'в современном мире',
  'является важным инструментом',
  'в заключение',
  'test',
  'demo',
  'placeholder',
]

function parseArgs(argv) {
  const options = {
    outDir: process.env.ARTICLE_OUTPUT_DIR || defaultOutputDir,
    apiBase: (process.env.ARTICLE_API_BASE_URL || defaultApiBase).replace(/\/+$/, ''),
    dryRun: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--out-dir') {
      options.outDir = path.resolve(repoRoot, argv[i + 1] || '')
      i += 1
    } else if (arg === '--api-base') {
      options.apiBase = (argv[i + 1] || '').replace(/\/+$/, '')
      i += 1
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  options.outDir = path.resolve(repoRoot, options.outDir)
  return options
}

function printUsage() {
  console.log(`
Usage:
  node scripts/article-agent/generate-daily-articles.mjs --out-dir "$RUNNER_TEMP/qsen-daily/daily-YYYY-MM-DD"

Environment:
  OPENAI_API_KEY              Required
  OPENAI_ARTICLE_MODEL        Optional, default: gpt-5.4
  OPENAI_REASONING_EFFORT     Optional, default: medium
  OPENAI_MAX_OUTPUT_TOKENS    Optional, default: 24000
  ARTICLE_API_BASE_URL        Optional, used to avoid existing article duplicates
`)
}

async function requestJson(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    const text = await response.text()
    let data = null
    if (text.trim()) data = JSON.parse(text)
    if (!response.ok || data?.error) {
      throw new Error(data?.error || `HTTP ${response.status}`)
    }
    return data
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchExistingArticles(apiBase) {
  const articles = []
  let offset = 0
  let total = null

  while (total === null || offset < total) {
    const page = await requestJson(`${apiBase}/articles?limit=${PAGE_SIZE}&offset=${offset}`)
    if (Array.isArray(page)) return page

    const pageItems = Array.isArray(page?.articles) ? page.articles : []
    articles.push(...pageItems)
    total = Number.isFinite(Number(page?.total)) ? Number(page.total) : articles.length
    if (pageItems.length === 0 || pageItems.length < PAGE_SIZE) break
    offset += pageItems.length
  }

  return articles
}

function buildSchema() {
  const articleSchema = {
    type: 'object',
    additionalProperties: false,
    required: [
      'language',
      'translation_key',
      'tool_slug',
      'slug',
      'title',
      'excerpt',
      'content',
      'status',
      'author',
      'cover_image',
      'seo_title',
      'seo_description',
    ],
    properties: {
      language: { type: 'string', enum: ['ru', 'en'] },
      translation_key: { type: 'string' },
      tool_slug: { type: 'string', enum: tools.map((tool) => tool.tool_slug) },
      slug: { type: 'string' },
      title: { type: 'string' },
      excerpt: { type: 'string' },
      content: { type: 'string' },
      status: { type: 'string', enum: ['published'] },
      author: { type: 'string', enum: ['Ars'] },
      cover_image: { type: ['string', 'null'] },
      seo_title: { type: 'string' },
      seo_description: { type: 'string' },
    },
  }

  return {
    type: 'object',
    additionalProperties: false,
    required: ['pairs'],
    properties: {
      pairs: {
        type: 'array',
        minItems: PAIR_COUNT,
        maxItems: PAIR_COUNT,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['search_intent', 'ru', 'en'],
          properties: {
            search_intent: { type: 'string' },
            ru: articleSchema,
            en: articleSchema,
          },
        },
      },
    },
  }
}

function existingSummary(articles) {
  return articles.map((article) => ({
    language: article.language,
    translation_key: article.translation_key,
    tool_slug: article.tool_slug,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
  }))
}

function readEditorialStandard() {
  if (!fs.existsSync(editorialStandardPath)) {
    return '(BD/ARTICLE_EDITORIAL_STANDARD.md was not found; use the inline rules below.)'
  }

  return fs.readFileSync(editorialStandardPath, 'utf8')
}

function buildPrompt(articles, priorIssues = []) {
  const published = existingSummary(articles)
  const editorialStandard = readEditorialStandard()

  return [
    'Create exactly 3 new Qsen article translation pairs: 3 Russian articles and 3 English articles.',
    '',
    'Return only JSON matching the supplied schema.',
    '',
    'Allowed tools:',
    JSON.stringify(tools, null, 2),
    '',
    'Already published articles. Avoid duplicate slugs, duplicate translation_key values, and duplicate search intents:',
    JSON.stringify(published, null, 2),
    '',
    'Editorial standard file:',
    editorialStandard,
    '',
    'Non-negotiable article rules:',
    '- Each pair must target one narrow practical search intent.',
    '- Write human-first content, not AI filler.',
    '- Include concrete examples, mistakes, checklists, criteria, or scenarios.',
    '- RU and EN must cover the same intent but must not be literal translations.',
    '- RU content must be natural Russian and contain Cyrillic text.',
    '- EN content must be natural English.',
    '- No test/demo/placeholder wording anywhere.',
    '- status must be published, author must be Ars, cover_image must be null.',
    '- Each article content must start with a CTA link to the correct localized tool, then an H1.',
    '- Each article content must end with a final CTA link to the same localized tool.',
    '- RU article links must only use the tool ru_url for its tool.',
    '- EN article links must only use the tool en_url for its tool.',
    '- seo_title should usually be 45-70 characters.',
    '- seo_description should usually be 130-170 characters.',
    '- Content should normally be 650-1100 words per article.',
    '- Include an FAQ section with 2-4 questions.',
    '- Avoid forbidden phrases: ' + forbiddenPhrases.join(', '),
    '',
    'Slug rules:',
    '- lowercase Latin kebab-case only.',
    '- RU slugs must be transliterated Latin, not Cyrillic.',
    '- EN slugs must be natural English kebab-case.',
    '- translation_key must be short, stable, lowercase kebab-case, and shared by RU/EN pair.',
    '',
    priorIssues.length
      ? `Previous attempt failed validation. Fix these issues:\n${priorIssues.map((issue) => `- ${issue}`).join('\n')}`
      : '',
  ].filter(Boolean).join('\n')
}

async function createResponse(prompt) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY GitHub secret is required')
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      reasoning: { effort: REASONING_EFFORT },
      max_output_tokens: MAX_OUTPUT_TOKENS,
      instructions: 'You are a senior SEO editor and bilingual RU/EN article writer for Qsen online tools. Produce useful, specific, non-generic articles that are ready to publish.',
      input: prompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'qsen_daily_articles',
          strict: true,
          schema: buildSchema(),
        },
      },
    }),
  })

  const data = await response.json()
  if (!response.ok || data?.error) {
    throw new Error(data?.error?.message || data?.error || `OpenAI API HTTP ${response.status}`)
  }

  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return JSON.parse(data.output_text)
  }

  const text = data.output
    ?.flatMap((item) => item.content || [])
    ?.filter((item) => item.type === 'output_text')
    ?.map((item) => item.text)
    ?.join('')

  if (!text?.trim()) {
    throw new Error('OpenAI response did not contain output_text')
  }

  return JSON.parse(text)
}

function getLinks(content) {
  return [...String(content || '').matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1])
}

function validateArticle(article, expectedLanguage, pairKey, existingArticles, issues, label) {
  const tool = tools.find((item) => item.tool_slug === article.tool_slug)
  const expectedUrl = expectedLanguage === 'ru' ? tool?.ru_url : tool?.en_url
  const wrongPrefix = expectedLanguage === 'ru' ? '/en/' : '/ru/'
  const textBlob = `${article.title}\n${article.excerpt}\n${article.content}\n${article.seo_title}\n${article.seo_description}`
  const lowerBlob = textBlob.toLowerCase()

  if (article.language !== expectedLanguage) issues.push(`${label}: language must be ${expectedLanguage}`)
  if (article.translation_key !== pairKey) issues.push(`${label}: translation_key does not match pair`)
  if (!tool) issues.push(`${label}: invalid tool_slug ${article.tool_slug}`)
  if (article.status !== 'published') issues.push(`${label}: status must be published`)
  if (article.author !== 'Ars') issues.push(`${label}: author must be Ars`)
  if (article.cover_image !== null) issues.push(`${label}: cover_image must be null`)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) issues.push(`${label}: slug must be lowercase Latin kebab-case`)
  if (!article.content.startsWith('[')) issues.push(`${label}: content must start with a CTA link`)
  if (!/^#\s+\S/m.test(article.content)) issues.push(`${label}: content must include H1`)
  if (expectedLanguage === 'ru' && !/[А-Яа-яЁё]/.test(textBlob)) issues.push(`${label}: RU text must contain Cyrillic`)
  if (/\?\?\?|�/.test(textBlob)) issues.push(`${label}: text contains broken UTF-8 markers`)
  if (forbiddenPhrases.some((phrase) => lowerBlob.includes(phrase))) issues.push(`${label}: contains forbidden filler/test phrase`)

  const links = getLinks(article.content)
  const expectedLinks = links.filter((href) => href === expectedUrl)
  if (expectedLinks.length < 2) issues.push(`${label}: expected at least two CTA links to ${expectedUrl}`)
  if (links.some((href) => href.startsWith(wrongPrefix))) issues.push(`${label}: contains wrong-language link`)

  const existingSlug = existingArticles.find((item) => item.slug === article.slug)
  if (existingSlug) issues.push(`${label}: slug already exists: ${article.slug}`)

  const existingKey = existingArticles.find(
    (item) => item.translation_key === article.translation_key && item.language === article.language,
  )
  if (existingKey) issues.push(`${label}: translation_key+language already exists: ${article.translation_key}:${article.language}`)

  if (article.seo_title.length < 35 || article.seo_title.length > 80) {
    issues.push(`${label}: seo_title length should be 35-80 chars, got ${article.seo_title.length}`)
  }
  if (article.seo_description.length < 120 || article.seo_description.length > 180) {
    issues.push(`${label}: seo_description length should be 120-180 chars, got ${article.seo_description.length}`)
  }
}

function validateGenerated(payload, existingArticles) {
  const issues = []
  if (!payload || !Array.isArray(payload.pairs)) {
    return ['payload.pairs must be an array']
  }
  if (payload.pairs.length !== PAIR_COUNT) {
    issues.push(`expected ${PAIR_COUNT} pairs, got ${payload.pairs.length}`)
  }

  const slugs = new Set()
  const keys = new Set()

  payload.pairs.forEach((pair, index) => {
    const label = `pair ${index + 1}`
    if (!pair.ru || !pair.en) {
      issues.push(`${label}: missing ru or en article`)
      return
    }
    if (pair.ru.translation_key !== pair.en.translation_key) {
      issues.push(`${label}: RU/EN translation_key mismatch`)
    }
    if (pair.ru.tool_slug !== pair.en.tool_slug) {
      issues.push(`${label}: RU/EN tool_slug mismatch`)
    }

    const key = pair.ru.translation_key
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) issues.push(`${label}: translation_key must be kebab-case`)
    if (keys.has(key)) issues.push(`${label}: duplicate translation_key in batch`)
    keys.add(key)

    for (const article of [pair.ru, pair.en]) {
      if (slugs.has(article.slug)) issues.push(`${label}: duplicate slug in batch: ${article.slug}`)
      slugs.add(article.slug)
    }

    validateArticle(pair.ru, 'ru', key, existingArticles, issues, `${label} RU`)
    validateArticle(pair.en, 'en', key, existingArticles, issues, `${label} EN`)
  })

  return issues
}

function writeArticles(payload, outDir) {
  fs.mkdirSync(outDir, { recursive: true })

  const files = []
  for (const pair of payload.pairs) {
    for (const article of [pair.ru, pair.en]) {
      const filename = `${article.language}-${article.slug}.json`
      const filePath = path.join(outDir, filename)
      fs.writeFileSync(filePath, `${JSON.stringify(article, null, 2)}\n`, 'utf8')
      files.push(filePath)
    }
  }
  return files
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  console.log(`Generating Qsen daily articles into: ${options.outDir}`)
  console.log(`Model: ${MODEL}`)

  const existingArticles = await fetchExistingArticles(options.apiBase)
  console.log(`Existing published articles loaded: ${existingArticles.length}`)

  let priorIssues = []
  let payload = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    console.log(`Generation attempt ${attempt}/${MAX_ATTEMPTS}`)
    payload = await createResponse(buildPrompt(existingArticles, priorIssues))
    const issues = validateGenerated(payload, existingArticles)
    if (issues.length === 0) {
      console.log('Generator quality validation: PASS')
      const files = writeArticles(payload, options.outDir)
      console.log(`Wrote ${files.length} article JSON files.`)
      for (const file of files) {
        console.log(`- ${path.relative(repoRoot, file)}`)
      }
      return
    }

    console.log('Generator quality validation: FAIL')
    for (const issue of issues) console.log(`- ${issue}`)
    priorIssues = issues
  }

  throw new Error(`Failed to generate valid articles after ${MAX_ATTEMPTS} attempts`)
}

main().catch((err) => {
  console.error(`\nRESULT: FAIL\n${err.message}`)
  process.exit(1)
})
