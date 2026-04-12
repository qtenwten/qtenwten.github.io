import { useLanguage } from '../contexts/LanguageContext'
import './ToolDescriptionSection.css'

function ToolDescriptionSection({ eyebrow, className = '', children }) {
  const { language } = useLanguage()
  const sectionEyebrow = eyebrow || (language === 'en' ? 'Helpful Guide' : 'Полезная информация')

  return (
    <section className={`tool-description-section ${className}`.trim()}>
      <div className="tool-description-section__eyebrow">{sectionEyebrow}</div>
      <div className="tool-description-section__content">{children}</div>
    </section>
  )
}

export function ToolFaq({ title = 'FAQ', items = [] }) {
  if (!items.length) {
    return null
  }

  return (
    <section className="tool-description-faq-block">
      <h3>{title}</h3>
      <div className="tool-description-faq">
        {items.map((item) => (
          <div key={item.q} className="tool-description-faq-item">
            <p className="tool-description-faq-question">{item.q}</p>
            <p className="tool-description-faq-answer">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ToolDescriptionSection
