// Генератор случайных чисел

export function generateRandomNumbers(min, max, count, unique = false) {
  const minNum = parseInt(min)
  const maxNum = parseInt(max)
  const countNum = parseInt(count)

  if (isNaN(minNum) || isNaN(maxNum) || isNaN(countNum)) {
    return { error: 'INVALID_PARAMS' }
  }

  if (minNum >= maxNum) {
    return { error: 'MIN_NOT_LESS_THAN_MAX' }
  }

  if (countNum < 1 || countNum > 10000) {
    return { error: 'COUNT_OUT_OF_RANGE' }
  }

  if (unique && countNum > (maxNum - minNum + 1)) {
    return { error: 'UNIQUE_COUNT_EXCEEDS_RANGE' }
  }

  const numbers = []

  if (unique) {
    const rangeSize = maxNum - minNum + 1

    if (!Number.isSafeInteger(rangeSize) || rangeSize < 1) {
      return { error: 'INVALID_PARAMS' }
    }

    if (rangeSize <= countNum * 3) {
      const available = []
      for (let i = minNum; i <= maxNum; i++) {
        available.push(i)
      }

      for (let i = 0; i < countNum; i++) {
        const randomIndex = Math.floor(Math.random() * available.length)
        numbers.push(available[randomIndex])
        available.splice(randomIndex, 1)
      }
    } else {
      const picked = new Set()
      while (picked.size < countNum) {
        const randomNum = Math.floor(Math.random() * rangeSize) + minNum
        if (!picked.has(randomNum)) {
          picked.add(randomNum)
          numbers.push(randomNum)
        }
      }
    }
  } else {
    for (let i = 0; i < countNum; i++) {
      const randomNum = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum
      numbers.push(randomNum)
    }
  }

  return { numbers }
}

const TAU = 2 * Math.PI

function normalizeAngle(angle) {
  return ((angle % TAU) + TAU) % TAU
}

export function getIndexAtPointer(rotation, itemsCount) {
  if (!itemsCount) return -1

  const segmentAngle = TAU / itemsCount

  const angleUnderPointer = normalizeAngle(-rotation)

  return Math.floor(angleUnderPointer / segmentAngle) % itemsCount
}

export function calculateSpinResult(items, duration, currentAngleRad = 0) {
  if (!items || items.length < 1) {
    return { error: 'NOT_ENOUGH_ITEMS' }
  }

  const segmentAngle = TAU / items.length

  const minFullRotations = 8
  const maxExtraRotations = 4
  const fullRotations =
    minFullRotations + Math.floor(Math.random() * maxExtraRotations)

  const winnerIndex = Math.floor(Math.random() * items.length)

  const winnerCenterAngle = (winnerIndex + 0.5) * segmentAngle

  const targetRotationNormalized = normalizeAngle(-winnerCenterAngle)

  const currentNormalized = normalizeAngle(currentAngleRad)

  const deltaToTarget = normalizeAngle(
    targetRotationNormalized - currentNormalized
  )

  const targetAngle =
    currentAngleRad + fullRotations * TAU + deltaToTarget

  const visualIndex = getIndexAtPointer(targetAngle, items.length)

  if (visualIndex !== winnerIndex) {
    console.error('[wheel mismatch after calculation]', {
      winnerIndex,
      visualIndex,
      winnerItem: items[winnerIndex],
      visualItem: items[visualIndex],
      currentAngleRad,
      currentNormalized,
      targetRotationNormalized,
      targetAngle,
    })
  }

  return {
    targetAngle,
    winnerIndex,
    winnerItem: items[winnerIndex],
    chance: Math.round((1 / items.length) * 100),
    duration,
  }
}

export function normalizeItems(rawItems) {
  const items = rawItems
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .filter((item, index, self) => {
      const lower = item.toLowerCase()
      return index === self.findIndex(t => t.toLowerCase() === lower)
    })
  return items
}

export function getWheelSelectionState({
  mode,
  normalizedItems,
  history = [],
  excludeChosen = true,
  wheelItemsSnapshot = null,
  isSpinning = false,
  hasSpinResult = false,
}) {
  const historyKeys = new Set(
    history.map(entry => String(entry.item || '').toLowerCase())
  )

  const remainingItems = excludeChosen
    ? normalizedItems.filter(item => !historyKeys.has(item.toLowerCase()))
    : normalizedItems

  const isSequenceMode = mode === 'sequence'
  const spinItems = isSequenceMode ? remainingItems : normalizedItems
  const wheelItems = wheelItemsSnapshot && (isSpinning || hasSpinResult)
    ? wheelItemsSnapshot
    : spinItems

  const hasEnoughItems = normalizedItems.length >= 2
  const minimumSpinItems = isSequenceMode ? 1 : 2
  const allSequenceItemsChosen =
    isSequenceMode && excludeChosen && hasEnoughItems && remainingItems.length === 0

  return {
    remainingItems,
    spinItems,
    wheelItems,
    hasEnoughItems,
    canSpin: hasEnoughItems && spinItems.length >= minimumSpinItems && !allSequenceItemsChosen,
    allSequenceItemsChosen,
  }
}
