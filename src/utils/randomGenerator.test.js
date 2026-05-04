import { describe, expect, it } from 'vitest'
import {
  calculateSpinResult,
  generateRandomNumbers,
  getIndexAtPointer,
  getWheelSelectionState,
} from './randomGenerator'

describe('random wheel selection state', () => {
  it('does not let sequence history filter the regular wheel mode', () => {
    const state = getWheelSelectionState({
      mode: 'picker',
      normalizedItems: ['Aram', 'Sen'],
      history: [{ item: 'Aram', index: 0 }],
      excludeChosen: true,
    })

    expect(state.spinItems).toEqual(['Aram', 'Sen'])
    expect(state.wheelItems).toEqual(['Aram', 'Sen'])
    expect(state.canSpin).toBe(true)
  })

  it('lets sequence mode spin the last remaining item', () => {
    const state = getWheelSelectionState({
      mode: 'sequence',
      normalizedItems: ['Aram', 'Sen'],
      history: [{ item: 'Aram', index: 0 }],
      excludeChosen: true,
    })

    expect(state.remainingItems).toEqual(['Sen'])
    expect(state.spinItems).toEqual(['Sen'])
    expect(state.canSpin).toBe(true)
    expect(state.allSequenceItemsChosen).toBe(false)
  })

  it('marks sequence mode complete when every item is selected', () => {
    const state = getWheelSelectionState({
      mode: 'sequence',
      normalizedItems: ['Aram', 'Sen'],
      history: [
        { item: 'Aram', index: 0 },
        { item: 'Sen', index: 1 },
      ],
      excludeChosen: true,
    })

    expect(state.remainingItems).toEqual([])
    expect(state.canSpin).toBe(false)
    expect(state.allSequenceItemsChosen).toBe(true)
  })

  it('keeps the wheel snapshot visible while a result is shown', () => {
    const state = getWheelSelectionState({
      mode: 'sequence',
      normalizedItems: ['Aram', 'Sen'],
      history: [{ item: 'Aram', index: 0 }],
      excludeChosen: true,
      wheelItemsSnapshot: ['Aram', 'Sen'],
      hasSpinResult: true,
    })

    expect(state.wheelItems).toEqual(['Aram', 'Sen'])
  })
})

describe('random wheel math', () => {
  it('supports a single final sequence item', () => {
    const result = calculateSpinResult(['Sen'], 1, 0)

    expect(result.error).toBeUndefined()
    expect(result.winnerIndex).toBe(0)
    expect(result.winnerItem).toBe('Sen')
    expect(result.chance).toBe(100)
    expect(getIndexAtPointer(result.targetAngle, 1)).toBe(0)
  })
})

describe('random number generation', () => {
  it('generates unique samples from a large range without materializing the range', () => {
    const result = generateRandomNumbers(1, 1000000000, 10, true)

    expect(result.error).toBeUndefined()
    expect(result.numbers).toHaveLength(10)
    expect(new Set(result.numbers).size).toBe(10)
    expect(result.numbers.every(number => number >= 1 && number <= 1000000000)).toBe(true)
  })
})
