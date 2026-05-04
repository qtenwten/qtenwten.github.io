import { describe, expect, it, vi } from 'vitest'
import { createWheelAudioController } from './wheelAudio'

function createMockAudioContextClass(initialState = 'running') {
  const instances = []

  class MockAudioContext {
    constructor() {
      this.state = initialState
      this.currentTime = 1
      this.destination = {}
      this.createdOscillators = []
      this.resume = vi.fn(async () => {
        this.state = 'running'
      })
      this.close = vi.fn(async () => {
        this.state = 'closed'
      })
      instances.push(this)
    }

    createOscillator() {
      const oscillator = {
        connect: vi.fn(),
        frequency: { value: 0 },
        type: '',
        start: vi.fn(),
        stop: vi.fn(),
      }
      this.createdOscillators.push(oscillator)
      return oscillator
    }

    createGain() {
      return {
        connect: vi.fn(),
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
      }
    }
  }

  return { MockAudioContext, instances }
}

describe('wheel audio controller', () => {
  it('plays immediately when the context is already running', async () => {
    const { MockAudioContext, instances } = createMockAudioContextClass('running')
    const controller = createWheelAudioController({
      getAudioContextConstructor: () => MockAudioContext,
    })

    await expect(controller.playTone()).resolves.toBe(true)

    expect(instances).toHaveLength(1)
    expect(instances[0].resume).not.toHaveBeenCalled()
    expect(instances[0].createdOscillators).toHaveLength(1)
    expect(instances[0].createdOscillators[0].start).toHaveBeenCalledTimes(1)
  })

  it('resumes a suspended context before playing', async () => {
    const { MockAudioContext, instances } = createMockAudioContextClass('suspended')
    const controller = createWheelAudioController({
      getAudioContextConstructor: () => MockAudioContext,
    })

    await expect(controller.playTone()).resolves.toBe(true)

    expect(instances).toHaveLength(1)
    expect(instances[0].resume).toHaveBeenCalledTimes(1)
    expect(instances[0].createdOscillators).toHaveLength(1)
  })

  it('recreates a closed context', async () => {
    const { MockAudioContext, instances } = createMockAudioContextClass('running')
    const controller = createWheelAudioController({
      getAudioContextConstructor: () => MockAudioContext,
    })

    await controller.warmUp()
    instances[0].state = 'closed'
    await controller.warmUp()

    expect(instances).toHaveLength(2)
    expect(controller.getContext()).toBe(instances[1])
  })
})
