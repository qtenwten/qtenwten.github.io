import { Link } from 'react-router-dom'
import './RelatedTools.css'

const tools = [
  {
    path: '/number-to-words',
    icon: '🔢',
    title: 'Число прописью',
    description: 'Конвертер числа в текст с НДС'
  },
  {
    path: '/vat-calculator',
    icon: '💰',
    title: 'Калькулятор НДС',
    description: 'Расчет налога на добавленную стоимость'
  },
  {
    path: '/compound-interest',
    icon: '📈',
    title: 'Сложные проценты',
    description: 'Расчет доходности инвестиций'
  },
  {
    path: '/seo-audit-pro',
    icon: '🚀',
    title: 'SEO-аудит PRO',
    description: 'Профессиональный анализ сайтов'
  },
  {
    path: '/qr-code-generator',
    icon: '📱',
    title: 'QR-код генератор',
    description: 'Создание QR-кодов онлайн'
  },
  {
    path: '/url-shortener',
    icon: '🔗',
    title: 'Сокращатель ссылок',
    description: 'Короткие ссылки бесплатно'
  },
  {
    path: '/meta-tags-generator',
    icon: '🏷️',
    title: 'Генератор мета-тегов',
    description: 'Создание SEO тегов'
  },
  {
    path: '/random-number',
    icon: '🎲',
    title: 'Генератор чисел',
    description: 'Случайные числа в диапазоне'
  },
  {
    path: '/calculator',
    icon: '🧮',
    title: 'Калькулятор',
    description: 'Базовые операции и проценты'
  },
  {
    path: '/time-calculator',
    icon: '⏰',
    title: 'Калькулятор времени',
    description: 'Сложение и вычитание времени'
  }
]

function RelatedTools({ currentPath }) {
  const otherTools = tools.filter(tool => tool.path !== currentPath)

  return (
    <div className="related-tools">
      <h2>Другие полезные инструменты</h2>
      <div className="tools-grid">
        {otherTools.map(tool => (
          <Link key={tool.path} to={tool.path} className="tool-card">
            <div className="tool-icon">{tool.icon}</div>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default RelatedTools