import { Link } from 'react-router-dom'
import './RelatedTools.css'

const tools = [
  {
    path: '/number-to-words',
    title: 'Число прописью',
    description: 'Конвертер числа в текст с НДС'
  },
  {
    path: '/vat-calculator',
    title: 'Калькулятор НДС',
    description: 'Расчет налога на добавленную стоимость'
  },
  {
    path: '/compound-interest',
    title: 'Сложные проценты',
    description: 'Расчет доходности инвестиций'
  },
  {
    path: '/random-number',
    title: 'Генератор чисел',
    description: 'Случайные числа в диапазоне'
  },
  {
    path: '/calculator',
    title: 'Калькулятор',
    description: 'Базовые операции и проценты'
  },
  {
    path: '/time-calculator',
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
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default RelatedTools