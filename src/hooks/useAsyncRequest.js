import { useCallback, useEffect, useRef } from 'react'

export function useAsyncRequest() {
  const requestIdRef = useRef(0)
  const controllerRef = useRef(null)

  const abortCurrent = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
  }, [])

  useEffect(() => () => abortCurrent(), [abortCurrent])

  const runRequest = useCallback(async (requestFn) => {
    requestIdRef.current += 1
    const requestId = requestIdRef.current

    abortCurrent()

    const controller = new AbortController()
    controllerRef.current = controller

    const isCurrent = () => requestIdRef.current === requestId && !controller.signal.aborted
    const abort = () => controller.abort()

    try {
      const result = await requestFn({ requestId, signal: controller.signal, isCurrent, abort })
      if (!isCurrent()) {
        return { status: 'stale' }
      }

      return { status: 'success', result }
    } catch (error) {
      if (!isCurrent()) {
        return { status: 'stale' }
      }

      return { status: controller.signal.aborted ? 'aborted' : 'error', error }
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
      }
    }
  }, [abortCurrent])

  const markTask = useCallback(() => {
    requestIdRef.current += 1
    const requestId = requestIdRef.current

    return {
      requestId,
      isCurrent: () => requestIdRef.current === requestId,
    }
  }, [])

  return {
    runRequest,
    abortCurrent,
    markTask,
  }
}
