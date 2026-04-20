import { useState, useEffect, useRef } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { useLanguage } from '../../contexts/LanguageContext'
import { compileFunction } from '../../utils/mathParser'
import { generateGraphData, calculateYRange } from '../../utils/graphUtils'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

function GraphPanel({ onHistoryAdd, restoredExpression }) {
  const { language, t } = useLanguage()
  const [functionExpr, setFunctionExpr] = useState('')
  const [error, setError] = useState('')
  const [chartData, setChartData] = useState(null)
  const [xRange, setXRange] = useState({ min: -10, max: 10 })

  useEffect(() => {
    let active = true

    const buildGraph = async () => {
      if (!functionExpr.trim()) {
        setChartData(null)
        setError('')
        return
      }

      const { compiled, error: compileError } = await compileFunction(functionExpr)

      if (!active) {
        return
      }

      if (compileError) {
        setError(compileError)
        setChartData(null)
        return
      }

      setError('')

      const { xValues, yValues } = generateGraphData(compiled, xRange.min, xRange.max)

      if (xValues.length === 0) {
        setError(t('calculator.graphPanel.unableToBuild'))
        setChartData(null)
        return
      }

      const yRange = calculateYRange(yValues)

      setChartData({
        labels: xValues,
        datasets: [
          {
            label: functionExpr,
            data: yValues,
            borderColor: 'rgb(79, 70, 229)',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1
          }
        ],
        yRange
      })

      onHistoryAdd({ type: 'graph', expression: functionExpr })
    }

    buildGraph()

    return () => {
      active = false
    }
  }, [functionExpr, xRange, onHistoryAdd])

  useEffect(() => {
    if (restoredExpression?.value) {
      setFunctionExpr(restoredExpression.value)
    }
  }, [restoredExpression])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        type: 'linear',
        min: xRange.min,
        max: xRange.max,
        title: {
          display: true,
          text: 'x'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        min: chartData?.yRange?.min,
        max: chartData?.yRange?.max,
        title: {
          display: true,
          text: 'y'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }

  return (
    <div className="graph-panel">
      <div className="graph-input">
        <label htmlFor="function">{t('calculator.graphPanel.functionLabel')}</label>
        <input
          id="function"
          type="text"
          value={functionExpr}
          onChange={(e) => setFunctionExpr(e.target.value)}
          placeholder="x^2, sin(x), x^3 - 2*x + 1"
          className="graph-input-field"
        />
        {error && <div className="graph-error">{error}</div>}
      </div>

      <div className="graph-controls">
        <div className="range-control">
          <label>
            {t('calculator.graphPanel.xFrom')}
            <input
              type="number"
              value={xRange.min}
              onChange={(e) => setXRange(prev => ({ ...prev, min: parseFloat(e.target.value) || -10 }))}
              style={{ width: '80px', marginLeft: '0.5rem' }}
            />
          </label>
          <label style={{ marginLeft: '0.25rem' }}>
            {t('calculator.graphPanel.xTo')}
            <input
              type="number"
              value={xRange.max}
              onChange={(e) => setXRange(prev => ({ ...prev, max: parseFloat(e.target.value) || 10 }))}
              style={{ width: '80px', marginLeft: '0.5rem' }}
            />
          </label>
        </div>
        <button
          onClick={() => setXRange({ min: -10, max: 10 })}
          style={{
            flexShrink: 0,
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            background: 'var(--bg-secondary)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {t('calculator.graphPanel.reset')}
        </button>
      </div>

      <div className="graph-canvas">
        {chartData ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="graph-placeholder">
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>📈</div>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('calculator.graphPanel.enterFunction')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default GraphPanel
