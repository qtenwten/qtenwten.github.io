export function calculateCompoundInterest(principal, rate, years, frequency, monthlyContribution = 0) {
  if (!principal || !rate || !years || !frequency) {
    return null
  }

  const p = parseFloat(principal)
  const r = parseFloat(rate) / 100
  const t = parseFloat(years)
  const n = parseFloat(frequency)
  const monthly = parseFloat(monthlyContribution) || 0

  if (p < 0 || r < 0 || t < 0 || monthly < 0) {
    return null
  }

  let totalInvested = p
  let chartData = []

  if (monthly === 0) {
    // Simple compound interest
    const amount = p * Math.pow(1 + r / n, n * t)
    const interest = amount - p

    // Generate chart data
    for (let year = 0; year <= t; year++) {
      const yearAmount = p * Math.pow(1 + r / n, n * year)
      chartData.push({
        year: year,
        amount: Math.round(yearAmount * 100) / 100
      })
    }

    return {
      finalAmount: Math.round(amount * 100) / 100,
      totalInvested: p,
      earnedInterest: Math.round(interest * 100) / 100,
      chartData
    }
  } else {
    // Compound interest with monthly contributions
    let balance = p
    const monthlyRate = r / 12
    const totalMonths = t * 12

    for (let month = 1; month <= totalMonths; month++) {
      balance = balance * (1 + monthlyRate) + monthly
      totalInvested += monthly

      // Add to chart data at year intervals
      if (month % 12 === 0) {
        chartData.push({
          year: month / 12,
          amount: Math.round(balance * 100) / 100
        })
      }
    }

    // Add initial point
    chartData.unshift({ year: 0, amount: p })

    const interest = balance - totalInvested

    return {
      finalAmount: Math.round(balance * 100) / 100,
      totalInvested: Math.round(totalInvested * 100) / 100,
      earnedInterest: Math.round(interest * 100) / 100,
      chartData
    }
  }
}

export function formatNumber(num) {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}
