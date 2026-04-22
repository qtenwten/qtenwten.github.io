import { useLanguage } from '../contexts/LanguageContext'
import { lazy, Suspense, useState, useEffect } from 'react'
import SEO from '../components/SEO'
import RelatedTools from '../components/RelatedTools'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import ToolPageShell, { ToolControls, ToolHelp, ToolPageHero, ToolPageLayout, ToolRelated, ToolResult } from '../components/ToolPageShell'
import ModeSwitcher from '../components/calculator/ModeSwitcher'
import CalculatorPanel from '../components/calculator/CalculatorPanel'
import HistoryPanel from '../components/calculator/HistoryPanel'
import { safeGetItem, safeSetItem, safeRemoveItem, safeParseJSON } from '../utils/storage'
import { analytics } from '../utils/analytics'
import '../styles/calculator.css'

const GraphPanel = lazy(() => import('../components/calculator/GraphPanel'))

function Calculator() {
  const { t, language } = useLanguage()
  const [mode, setMode] = useState('calculator')
  const [history, setHistory] = useState([])
  const [restoredCalculation, setRestoredCalculation] = useState(null)
  const [restoredGraphExpression, setRestoredGraphExpression] = useState(null)

  useEffect(() => {
    const savedHistory = safeGetItem('calculator-history')
    if (savedHistory) {
      setHistory(safeParseJSON(savedHistory, []))
    }
  }, [])

  const handleHistoryAdd = (item) => {
    if (history[0] && JSON.stringify(history[0]) === JSON.stringify(item)) {
      return
    }

    if (item.type === 'calculation') {
      analytics.trackCalculatorUsed(item.expression, String(item.result))
    }

    const newHistory = [item, ...history.slice(0, 19)]
    setHistory(newHistory)
    safeSetItem('calculator-history', JSON.stringify(newHistory))
  }

  const handleHistoryRestore = (item) => {
    if (item.type === 'calculation') {
      setMode('calculator')
      setRestoredCalculation({ value: item.expression, stamp: Date.now() })
      return
    }

    if (item.type === 'graph') {
      setMode('graph')
      setRestoredGraphExpression({ value: item.expression, stamp: Date.now() })
    }
  }

  const handleHistoryClear = () => {
    setHistory([])
    safeRemoveItem('calculator-history')
  }

  return (
    <>
      <SEO
        title={t('seo.calculator.title')}
        description={t('seo.calculator.description')}
        path={`/${language}/calculator`}
        keywords={t('seo.calculator.keywords')}
      />

      <ToolPageShell className="calculator-container">
        <ToolPageHero title={t('seo.calculator.title')} subtitle={t('seo.calculator.description')} />

        <ToolControls className="calc-mode-shell tool-page-panel--subtle">
          <ModeSwitcher mode={mode} setMode={setMode} t={t} />
        </ToolControls>

        <ToolPageLayout>
          <ToolResult className="calc-workspace-shell tool-page-panel--subtle">
            <div className={`calc-workspace mode-${mode}`}>
              {(mode === 'calculator' || mode === 'split') && (
                <div className="calc-section">
                  <CalculatorPanel onHistoryAdd={handleHistoryAdd} restoredExpression={restoredCalculation} />
                </div>
              )}

              {(mode === 'graph' || mode === 'split') && (
                <div className="calc-section">
                  <Suspense fallback={<div className="graph-panel graph-panel-skeleton" aria-hidden="true"><span className="skeleton-line graph-skeleton-line graph-skeleton-line--hero" /><span className="skeleton-line graph-skeleton-line" /><span className="skeleton-line graph-skeleton-line" /><span className="skeleton-line graph-skeleton-line graph-skeleton-line--canvas" /></div>}>
                    <GraphPanel onHistoryAdd={handleHistoryAdd} restoredExpression={restoredGraphExpression} />
                  </Suspense>
                </div>
              )}
            </div>
          </ToolResult>

          {history.length > 0 && (
            <ToolResult>
              <HistoryPanel
                history={history}
                onRestore={handleHistoryRestore}
                onClear={handleHistoryClear}
              />
            </ToolResult>
          )}
        </ToolPageLayout>

        <ToolHelp>
        <ToolDescriptionSection>
          <div className="tool-help-prose">
          <h2 className="tool-help-heading">{t('calculator.infoTitle')}</h2>
          <p>
            {t('calculator.infoDescription')}
          </p>

          <h3 className="tool-help-subheading">{t('calculator.featuresTitle')}</h3>
          <ul>
            <li key="expressions">{t('calculator.features.expressions')}</li>
            <li key="scientific">{t('calculator.features.scientific')}</li>
            <li key="plot">{t('calculator.features.plot')}</li>
            <li key="modes">{t('calculator.features.modes')}</li>
            <li key="history">{t('calculator.features.history')}</li>
          </ul>

          <h3 className="tool-help-subheading">{t('calculator.graphTitle')}</h3>
          <ul>
            <li key="expressions">{t('calculator.graphFeatures.expressions')}</li>
            <li key="functions">{t('calculator.graphFeatures.functions')}</li>
            <li key="xRange">{t('calculator.graphFeatures.xRange')}</li>
            <li key="yScale">{t('calculator.graphFeatures.yScale')}</li>
            <li key="preview">{t('calculator.graphFeatures.preview')}</li>
          </ul>

          <h3 className="tool-help-subheading">{t('calculator.modesTitle')}</h3>
          <ul>
            <li key="calculator">{t('calculator.modes.calculator')}</li>
            <li key="graph">{t('calculator.modes.graph')}</li>
            <li key="both">{t('calculator.modes.both')}</li>
          </ul>

          <h3 className="tool-help-subheading">{t('calculator.examplesTitle')}</h3>
          <p>
            {t('calculator.calcExample')}
          </p>
          <p>
            {t('calculator.graphExample')}
          </p>

          <ToolFaq title={t('calculator.faqTitle')} items={[
            { q: t('calculator.faq.q1'), a: t('calculator.faq.a1') },
            { q: t('calculator.faq.q2'), a: t('calculator.faq.a2') },
            { q: t('calculator.faq.q3'), a: t('calculator.faq.a3') },
            { q: t('calculator.faq.q4'), a: t('calculator.faq.a4') },
          ]} />
          </div>
        </ToolDescriptionSection>

        </ToolHelp>

        <ToolRelated>
          <RelatedTools currentPath={`/${language}/calculator`} />
        </ToolRelated>
      </ToolPageShell>
    </>
  )
}

export default Calculator
