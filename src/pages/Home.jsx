import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SEO from '../components/SEO'
import './Home.css'

const tools = [
  {
    id: 'number-to-words',
    path: '/number-to-words',
    icon: '🔢',
    title: 'Число прописью',
    description: 'Конвертация числа в текст (рубли, евро, доллары)',
    category: 'converters'
  },
  {
    id: 'vat-calculator',
    path: '/vat-calculator',
    icon: '💰',
    title: 'НДС калькулятор',
    description: 'Добавить, убрать или рассчитать НДС',
    category: 'calculators'
  },
  {
    id: 'compound-interest',
    path: '/compound-interest',
    icon: '📈',
    title: 'Сложные проценты',
    description: 'Расчет доходности инвестиций',
    category: 'calculators'
  },
  {
    id: 'seo-audit-pro',
    path: '/seo-audit-pro',
    icon: '🚀',
    title: 'SEO-аудит PRO',
    description: 'Профессиональный анализ любых сайтов',
    category: 'tools'
  },
  {
    id: 'meta-tags-generator',
    path: '/meta-tags-generator',
    icon: '🏷️',
    title: 'Мета-теги',
    description: 'Генератор SEO мета-тегов',
    category: 'tools'
  },
  {
    id: 'random-number',
    path: '/random-number',
    icon: '🎲',
    title: 'Случайные числа',
    description: 'Генератор случайных чисел в диапазоне',
    category: 'generators'
  },
  {
    id: 'calculator',
    path: '/calculator',
    icon: '🧮',
    title: 'Калькулятор',
    description: 'Базовые операции и проценты',
    category: 'calculators'
  },
  {
    id: 'time-calculator',
    path: '/time-calculator',
    icon: '⏰',
    title: 'Калькулятор времени',
    description: 'Сложение, вычитание и разница времени',
    category: 'calculators'
  }
]

function Home() {
  const [search, setSearch] = useState('')
  const [filteredTools, setFilteredTools] = useState(tools)
  const [searchParams] = useSearchParams()
  const categoryFilter = searchParams.get('category')

  useEffect(() => {
    let result = tools

    // Фильтр по категории из URL
    if (categoryFilter) {
      result = result.filter(tool => tool.category === categoryFilter)
    }

    // Фильтр по поиску
    if (search.trim() !== '') {
      const query = search.toLowerCase()
      result = result.filter(
        tool =>
          tool.title.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query)
      )
    }

    setFilteredTools(result)
  }, [search, categoryFilter])

  return (
    <>
      <SEO
        title="Онлайн калькуляторы и конвертеры - Бесплатные инструменты"
        description="Бесплатные онлайн калькуляторы: НДС, сумма прописью, генератор чисел, калькулятор времени. Быстрые расчеты без регистрации."
        path="/"
      />

      <div className="home">
        <div className="container">
          <div className="hero">
            <h1>Полезные онлайн инструменты</h1>
            <p>Быстрые и удобные утилиты для повседневных задач</p>

            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Поиск инструмента..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="tools-grid">
            {filteredTools.length > 0 ? (
              filteredTools.map(tool => (
                <Link to={tool.path} key={tool.id} className="tool-card">
                  <div className="tool-icon">{tool.icon}</div>
                  <h2>{tool.title}</h2>
                  <p>{tool.description}</p>
                </Link>
              ))
            ) : (
              <div className="no-results">
                <p>Ничего не найдено</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Home
