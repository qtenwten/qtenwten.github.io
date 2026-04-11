import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../dist')

// Page metadata for all 26 routes (13 pages × 2 languages)
const pages = {
  // Home pages
  '/ru': {
    title: 'Онлайн калькуляторы и генераторы — НДС, QR, SEO | QSEN.RU',
    description: 'Бесплатные онлайн-инструменты: калькулятор НДС, сумма прописью, QR-коды, случайные числа, графический калькулятор, сокращатель ссылок и SEO-аудит сайта.',
    h1: 'Онлайн калькуляторы, генераторы и SEO-инструменты',
    keywords: 'онлайн калькуляторы, генераторы онлайн, калькулятор НДС, сумма прописью онлайн, генератор qr кода, seo аудит сайта'
  },
  '/en': {
    title: 'QSEN.RU - Online Calculators and SEO Tools',
    description: 'Free online calculators, SEO tools and business utilities. VAT calculator, number to words, QR code generator and other useful tools.',
    h1: 'Useful Online Tools',
    keywords: 'online calculator, VAT calculator, number to words, SEO audit, meta tags generator'
  },

  // Number to Words
  '/ru/number-to-words': {
    title: 'Сумма прописью онлайн — число прописью для счетов и договоров',
    description: 'Сумма прописью онлайн в рублях, долларах, евро и других валютах. Перевод числа в текст для счетов, договоров, актов и документов, с НДС и без НДС.',
    h1: 'Сумма прописью онлайн',
    keywords: 'сумма прописью онлайн, число прописью, перевести сумму прописью, сумма прописью для договора, число прописью для счета'
  },
  '/en/number-to-words': {
    title: 'Number to Words Online - Amount in Words with VAT',
    description: 'Convert numbers to words. Amount in words with VAT for contracts and documents. Support for rubles, dollars, euros.',
    h1: 'Number to Words Online',
    keywords: 'number to words, amount in words, number converter, text converter'
  },

  // VAT Calculator
  '/ru/vat-calculator': {
    title: 'Калькулятор НДС онлайн — выделить и начислить НДС 22%, 20%, 10%',
    description: 'Калькулятор НДС онлайн для счетов, накладных и договоров. Помогает выделить НДС из суммы, начислить НДС сверху и быстро рассчитать налог по ставкам 5%, 10%, 18%, 19%, 20% и 22%.',
    h1: 'Калькулятор НДС онлайн',
    keywords: 'калькулятор ндс онлайн, выделить ндс из суммы, начислить ндс, расчет ндс 20 процентов, калькулятор ндс 22 процента'
  },
  '/en/vat-calculator': {
    title: 'VAT Calculator Online - Add and Remove VAT',
    description: 'Online VAT calculator. Remove VAT from amount, add VAT, calculate VAT amount. Rates 20%, 10%, 0%.',
    h1: 'VAT Calculator Online',
    keywords: 'VAT calculator, remove VAT, add VAT, online VAT calculator'
  },

  // Random Number
  '/ru/random-number': {
    title: 'Генератор случайных чисел онлайн — рандомайзер от 1 до 100',
    description: 'Генератор случайных чисел онлайн для розыгрышей, выборки, лотерей и игр. Задайте диапазон, количество чисел и режим без повторений.',
    h1: 'Генератор случайных чисел онлайн',
    keywords: 'генератор случайных чисел онлайн, рандомайзер, генератор чисел без повторений, случайное число от 1 до 100, генератор для розыгрыша'
  },
  '/en/random-number': {
    title: 'Random Number Generator 1 to 100 - Online Randomizer',
    description: 'Random number generator from 1 to 100, 1 to 1000. Unique numbers without repetition. Randomizer for lottery and giveaways.',
    h1: 'Random Number Generator',
    keywords: 'random number generator, randomizer, random number, number generator'
  },

  // Calculator
  '/ru/calculator': {
    title: 'Графический калькулятор онлайн — графики функций и формулы',
    description: 'Графический калькулятор онлайн для вычислений, функций и построения графиков. Поддерживает тригонометрию, логарифмы, степени, корни и историю расчетов.',
    h1: 'Графический калькулятор онлайн',
    keywords: 'графический калькулятор, графический калькулятор онлайн, калькулятор с графиком функции, инженерный калькулятор онлайн, построить график функции'
  },
  '/en/calculator': {
    title: 'Graph Calculator - Engineering Calculator with Function Graphs',
    description: 'Modern online calculator with graphing. Engineering functions: sin, cos, tan, log, sqrt. Real-time function graphing.',
    h1: 'Graph Calculator',
    keywords: 'online calculator, engineering calculator, function graph, graph calculator'
  },

  // Date Difference Calculator
  '/ru/date-difference': {
    title: 'Калькулятор дней между датами онлайн — разница дат и отсчёт',
    description: 'Рассчитайте количество дней между датами, разницу по времени и обратный отсчет до события. Онлайн-калькулятор дат подходит для отпусков, дедлайнов и планирования.',
    h1: 'Калькулятор дней между датами',
    keywords: 'калькулятор дней между датами, сколько дней между датами, калькулятор дней онлайн, разница между датами, обратный отсчет до даты'
  },
  '/en/date-difference': {
    title: 'Date and Time Calculator Online - Date Difference and Countdown',
    description: 'Online date and time difference calculator. Measure days, compare date times and run a live countdown.',
    h1: 'Date and Time Calculator',
    keywords: 'date difference calculator, time difference, countdown timer, date calculator'
  },

  // Compound Interest
  '/ru/compound-interest': {
    title: 'Калькулятор сложных процентов онлайн — с капитализацией и пополнением',
    description: 'Калькулятор сложных процентов для вклада, инвестиций и накоплений. Покажет итоговую сумму, доход, пополнения и график роста капитала.',
    h1: 'Калькулятор сложных процентов онлайн',
    keywords: 'калькулятор сложных процентов, сложные проценты онлайн, калькулятор сложных процентов с капитализацией, доходность вклада, рост капитала'
  },
  '/en/compound-interest': {
    title: 'Compound Interest Calculator - Investment Return Calculator',
    description: 'Compound interest calculator with capitalization. Calculate investment returns, deposits. Capital growth chart.',
    h1: 'Compound Interest Calculator',
    keywords: 'compound interest, investment calculator, deposit return, interest capitalization'
  },

  // SEO Audit
  '/ru/seo-audit': {
    title: 'Экспресс SEO-аудит страницы онлайн — проверить title, description и H1',
    description: 'Быстрая SEO-проверка страницы онлайн: title, description, H1-H3, alt и Open Graph. Экспресс-аудит базовых ошибок без установки сервисов.',
    h1: 'Экспресс SEO-аудит страницы',
    keywords: 'seo аудит онлайн, экспресс seo аудит, проверка meta тегов, проверка h1 страницы, аудит страницы онлайн'
  },
  '/en/seo-audit': {
    title: 'Free Online SEO Audit - Website SEO Check',
    description: 'Free online SEO audit. Check meta tags, headings, images, and Open Graph markup. SEO optimization analysis.',
    h1: 'SEO Audit',
    keywords: 'SEO audit, SEO check, website analysis, SEO optimization'
  },

  // Meta Tags Generator
  '/ru/meta-tags-generator': {
    title: 'Генератор мета-тегов для сайта — title, description, Open Graph',
    description: 'Генератор мета-тегов для сайта: title, description, keywords, Open Graph и Twitter Card. Помогает быстро подготовить SEO-теги для Яндекса и Google.',
    h1: 'Генератор мета-тегов онлайн',
    keywords: 'генератор мета тегов, генератор мета тегов для сайта, title description keywords, open graph генератор, meta description'
  },
  '/en/meta-tags-generator': {
    title: 'Meta Tags Generator - Create Meta Tags for Website',
    description: 'Meta tags generator for website. Create title, description, keywords, Open Graph, Twitter Card. SEO optimization.',
    h1: 'Meta Tags Generator',
    keywords: 'meta tags generator, meta tags, Open Graph, Twitter Card, SEO tags'
  },

  // SEO Audit Pro
  '/ru/seo-audit-pro': {
    title: 'SEO-аудит сайта онлайн — подробная проверка SEO страницы',
    description: 'Подробный SEO-аудит сайта онлайн: проверка title, description, H1-H3, alt, robots, Open Graph, keywords и структуры страницы. Подходит для технического анализа и быстрой проверки.',
    h1: 'SEO-аудит сайта PRO',
    keywords: 'seo аудит сайта, seo аудит сайта онлайн, проверка seo сайта, аудит сайта онлайн, анализ страницы'
  },
  '/en/seo-audit-pro': {
    title: 'SEO Audit PRO - Professional Website Analysis',
    description: 'Professional SEO website audit. Deep analysis of technical SEO, content, usability. Detailed report with recommendations.',
    h1: 'SEO Audit PRO',
    keywords: 'SEO audit PRO, professional SEO analysis, technical SEO, SEO report'
  },

  // QR Code Generator
  '/ru/qr-code-generator': {
    title: 'Генератор QR-кода онлайн — создать QR-код бесплатно',
    description: 'Создайте QR-код онлайн бесплатно для ссылки, Wi‑Fi, телефона, email, SMS или текста. Настройте размер и цвета, скачайте готовый QR-код в PNG.',
    h1: 'Генератор QR-кода онлайн',
    keywords: 'генератор qr кодов онлайн, создать qr код бесплатно, qr код для wifi, qr код для ссылки, генератор qr кода на русском'
  },
  '/en/qr-code-generator': {
    title: 'Free Online QR Code Generator - Create QR Code',
    description: 'Free online QR code generator. Create QR codes for links, text, email, phone, and WiFi. Customize color and size.',
    h1: 'QR Code Generator',
    keywords: 'qr code generator, create qr code online, qr generator, free qr code'
  },

  // URL Shortener
  '/ru/url-shortener': {
    title: 'Сократить ссылку онлайн — бесплатный сокращатель URL',
    description: 'Сократите длинную ссылку онлайн и получите короткий URL за несколько секунд. Удобно для соцсетей, мессенджеров, email-рассылок, рекламы и печатных материалов.',
    h1: 'Сокращатель ссылок онлайн',
    keywords: 'сократить ссылку онлайн, сокращатель ссылок, короткая ссылка, сократить url, создать короткую ссылку'
  },
  '/en/url-shortener': {
    title: 'URL Shortener Online - Free Short Links',
    description: 'Free online URL shortener. Create short link in seconds. Shorten URL without registration.',
    h1: 'URL Shortener',
    keywords: 'url shortener, short links, shorten url, link shortener'
  },

  // Feedback
  '/ru/feedback': {
    title: 'Обратная связь - Связаться с нами',
    description: 'Свяжитесь с нами. Отправьте ваши предложения, вопросы или сообщения об ошибках. Мы ответим в ближайшее время.',
    h1: 'Обратная связь',
    keywords: 'обратная связь, связаться с нами, контакты, написать нам'
  },
  '/en/feedback': {
    title: 'Feedback - Contact Us',
    description: 'Contact us. Send your suggestions, questions or bug reports. We will respond as soon as possible.',
    h1: 'Feedback',
    keywords: 'feedback, contact us, contacts, write to us'
  },

  // Password Generator
  '/ru/password-generator': {
    title: 'Генератор паролей онлайн — создать надежный пароль бесплатно',
    description: 'Генератор надежных паролей онлайн с настройкой длины и набора символов. Создайте случайный пароль для почты, банков, Wi-Fi и социальных сетей.',
    h1: 'Генератор паролей',
    keywords: 'генератор паролей онлайн, создать надежный пароль, случайный пароль, сложный пароль, генератор пароля бесплатно'
  },
  '/en/password-generator': {
    title: 'Password Generator Online - Create Strong Password',
    description: 'Strong password generator online. Create complex password with numbers, letters and symbols. Customize length and complexity.',
    h1: 'Password Generator',
    keywords: 'password generator, create password, strong password, secure password'
  }
}

function generatePage(route, metadata) {
  try {
    const templatePath = path.join(distPath, 'index.html')

    if (!fs.existsSync(templatePath)) {
      console.error(`❌ Template not found: ${templatePath}`)
      console.error('   Run "npm run build" first to generate dist/index.html')
      return
    }

    const template = fs.readFileSync(templatePath, 'utf-8')

    // Inject meta tags and basic content
    let html = template
      // Update title
      .replace(/<title>.*?<\/title>/, `<title>${metadata.title}</title>`)
      // Update description
      .replace(/<meta name="description" content=".*?"/, `<meta name="description" content="${metadata.description}"`)
      // Update keywords
      .replace(/<meta name="keywords" content=".*?"/, `<meta name="keywords" content="${metadata.keywords}"`)
      // Inject basic content into root div for SEO
      .replace(
        /<div id="root"><\/div>/,
        `<div id="root"><div style="display:none"><h1>${metadata.h1}</h1><p>${metadata.description}</p></div></div>`
      )

    // Determine output path
    const routePath = route === '/ru' || route === '/en'
      ? path.join(distPath, route, 'index.html')
      : path.join(distPath, route, 'index.html')

    // Create directory if needed
    fs.mkdirSync(path.dirname(routePath), { recursive: true })

    // Write file
    fs.writeFileSync(routePath, html, 'utf-8')

    console.log(`✓ Generated: ${route}`)
  } catch (error) {
    console.error(`❌ Error generating ${route}:`, error.message)
  }
}

function main() {
  console.log('🚀 Starting pre-render generation...\n')

  // Check if dist exists
  if (!fs.existsSync(distPath)) {
    console.error('❌ dist/ folder not found!')
    console.error('   Run "npm run build" first\n')
    process.exit(1)
  }

  // Generate all pages
  let successCount = 0
  Object.entries(pages).forEach(([route, metadata]) => {
    generatePage(route, metadata)
    successCount++
  })

  console.log(`\n✅ Successfully generated ${successCount}/${Object.keys(pages).length} pages`)
  console.log('📁 Output: dist/ folder with pre-rendered HTML\n')
}

main()
