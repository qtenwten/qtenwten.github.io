import { useEffect, useRef } from 'react'

function LineChart({ data, width = 600, height = 300 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!data || data.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    // Set canvas size for retina displays
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Padding
    const padding = { top: 20, right: 40, bottom: 40, left: 60 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Find min and max values
    const values = data.map(d => d.amount)
    const minValue = 0
    const maxValue = Math.max(...values)

    // Scale functions
    const xScale = (index) => padding.left + (index / (data.length - 1)) * chartWidth
    const yScale = (value) => padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    const gridLines = 5
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }

    // Draw axes
    ctx.strokeStyle = '#9ca3af'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, height - padding.bottom)
    ctx.lineTo(width - padding.right, height - padding.bottom)
    ctx.stroke()

    // Draw Y-axis labels
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let i = 0; i <= gridLines; i++) {
      const value = maxValue - (maxValue / gridLines) * i
      const y = padding.top + (chartHeight / gridLines) * i
      const label = new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(value)
      ctx.fillText(label + ' ₽', padding.left - 10, y)
    }

    // Draw X-axis labels
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const labelStep = Math.ceil(data.length / 10)
    data.forEach((point, index) => {
      if (index % labelStep === 0 || index === data.length - 1) {
        const x = xScale(index)
        ctx.fillText(`Год ${point.year}`, x, height - padding.bottom + 10)
      }
    })

    // Draw line
    ctx.strokeStyle = '#4f46e5'
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    data.forEach((point, index) => {
      const x = xScale(index)
      const y = yScale(point.amount)
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw points
    ctx.fillStyle = '#4f46e5'
    data.forEach((point, index) => {
      const x = xScale(index)
      const y = yScale(point.amount)
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    })

  }, [data, width, height])

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          margin: '0 auto',
          maxWidth: '100%'
        }}
      />
    </div>
  )
}

export default LineChart
