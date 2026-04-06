import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import './Home.css'

const tools = [
  {
    id: 'number-to-words',
    path: '/number-to-words',
    icon: '🔢',
    title: 'Число прописью',
    description: 'Конвертация числа в текст (рубли, евро, доллары)'
  },
  {
    id: 'vat-calculator',
    path: '/vat-calculator',
    icon: '💰',
    title: 'НДС калькулятор',
    description: 'Добавить, убрать или рассчитать НДС'
  },
  {
    id: 'compound-interest',
    path: '/compound-interest',
    icon: '📈',
    title: 'Сложные проценты',
    description: 'Расчет доходности инвестиций'
  },
  {
    id: 'random-number',
    path: '/random-number',
    icon: '🎲',
    title: 'Случайные числа',
    description: 'Генератор случайных чисел в диапазоне'
  },
  {
    id: 'calculator',
    path: '/calculator',
    icon: '🧮',
    title: 'Калькулятор',
    description: 'Базовые операции и проценты'
  },
  {
    id: 'time-calculator',
    path: '/time-calculator',
    icon: '⏰',
    title: 'Калькулятор времени',
    description: 'Сложение, вычитание и разница времени'
  }
]

function Home() {
  const [search, setSearch] = useState('')
  const [filteredTools, setFilteredTools] = useState(tools)

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredTools(tools)
    } else {
      const query = search.toLowerCase()
      setFilteredTools(
        tools.filter(
          tool =>
            tool.title.toLowerCase().includes(query) ||
            tool.description.toLowerCase().includes(query)
        )
      )
    }
  }, [search])

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
