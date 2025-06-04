import type { IpcRendererListener } from '@electron-toolkit/preload'

import { nanoid } from '@deditor-app/shared'
import strings from '@stdlib/string'

const eventListeners = new Map<string, { on: IpcRendererListener, off: () => void }>()
const requestPromiseResolvers = new Map<string, (value: any) => void>()
const requestPromiseRejectors = new Map<string, (reason?: any) => void>()

export function defineClientMethod<TMethods, TMethodName extends keyof TMethods>(namespace: string, method: TMethodName) {
  type MethodType = TMethods[TMethodName]
  type MethodParamType = MethodType extends (params: infer P) => any ? P : never
  type MethodReturnType = MethodType extends (...args: any[]) => infer R ? R : never

  function setupEventListenersForMethod(method: TMethodName, hooks?: {
    onResponse?: (response: MethodReturnType) => void
    onError?: (error: Error) => void
  }) {
    const responseEventKey = `response:${namespace}:${strings.kebabcase(String(method))}`
    const responseErrorEventKey = `response:error:${namespace}:${strings.kebabcase(String(method))}`

    if (!eventListeners.has(responseEventKey)) {
      const listener: IpcRendererListener = (_, res: Awaited<{ _eventId: string, returns: MethodReturnType }>) => {
        if (hooks?.onResponse) {
          hooks.onResponse(res.returns)
        }
        if (res._eventId && requestPromiseResolvers.has(res._eventId)) {
          requestPromiseResolvers.get(res._eventId)!(res.returns)
          requestPromiseResolvers.delete(res._eventId)
          requestPromiseRejectors.delete(res._eventId)
        }
      }

      eventListeners.set(responseEventKey, { on: listener, off: window.electron.ipcRenderer.on(responseEventKey, listener) })
    }
    if (!eventListeners.has(responseErrorEventKey)) {
      const listener: IpcRendererListener = (_, err: { _eventId: string, error: Error }) => {
        if (hooks?.onError) {
          hooks.onError(err.error)
        }
        if (err._eventId && requestPromiseRejectors.has(err._eventId)) {
          requestPromiseRejectors.get(err._eventId)!(err.error)
          requestPromiseRejectors.delete(err._eventId)
          requestPromiseResolvers.delete(err._eventId)
        }
      }

      eventListeners.set(responseErrorEventKey, { on: listener, off: window.electron.ipcRenderer.on(responseErrorEventKey, listener) })
    }

    if (globalThis.window != null) {
      globalThis.window.addEventListener('beforeunload', () => {
        eventListeners.get(responseEventKey)?.off()
        eventListeners.get(responseErrorEventKey)?.off()
      })
    }
  }

  function _call(params?: MethodParamType, options?: { timeout?: number }): Promise<Awaited<MethodReturnType>> {
    return new Promise<Awaited<MethodReturnType>>((resolve, reject) => {
      const eventId = nanoid()
      let setTimeoutId: ReturnType<typeof setTimeout> | undefined

      setupEventListenersForMethod(method, {
        onResponse: () => {
          if (setTimeoutId != null) {
            clearTimeout(setTimeoutId)
          }
        },
        onError: () => {
          if (setTimeoutId != null) {
            clearTimeout(setTimeoutId)
          }
        },
      })

      requestPromiseResolvers.set(eventId, resolve)
      requestPromiseRejectors.set(eventId, reject)

      const requestEventKey = `request:${namespace}:${strings.kebabcase(String(method))}`

      window.electron.ipcRenderer.send(requestEventKey, { _eventId: eventId, params })

      if (options?.timeout != null) {
        setTimeoutId = setTimeout(() => {
          if (!requestPromiseResolvers.has(eventId)) {
            return
          }

          requestPromiseResolvers.delete(eventId)
          requestPromiseRejectors.delete(eventId)

          console.error(`Timeout after ${options.timeout}ms for method: ${namespace}:${String(method)}`)
          reject(new Error(`Timeout after ${options.timeout}ms`))
        }, options.timeout)
      }
    })
  }

  function call(params?: MethodParamType): Promise<Awaited<MethodReturnType>> {
    return _call(params, { timeout: 60000 })
  }

  function callWithOptions(params: MethodParamType, options?: { timeout?: number }): Promise<Awaited<MethodReturnType>> {
    if (options?.timeout && (!Number.isFinite(options.timeout) || options.timeout < 0)) {
      return Promise.reject(new Error(`Timeout ${options.timeout} is not a valid number`))
    }

    return _call(params, options)
  }

  return { call, callWithOptions }
}
