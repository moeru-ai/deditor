import strings from '@stdlib/string'

export function defineClientMethod<TMethods, TMethodName extends keyof TMethods>(method: TMethodName) {
  type MethodType = TMethods[TMethodName]
  type ParamType = MethodType extends (params: infer P) => any ? P : never
  type ReturnType = MethodType extends (...args: any[]) => infer R ? R : never

  function call(params?: ParamType): Promise<Awaited<ReturnType>> {
    return new Promise<Awaited<ReturnType>>((resolve, reject) => {
      window.electron.ipcRenderer.send(`request:${strings.kebabcase(String(method))}`, params)

      const onResponseCleanup = window.electron.ipcRenderer.on(
        `response:${strings.kebabcase(String(method))}`,
        (_, res: Awaited<ReturnType>) => {
          resolve(res)
          onResponseCleanup?.()
        },
      )
      const onErrorCleanup = window.electron.ipcRenderer.on(
        `response:error:${strings.kebabcase(String(method))}`,
        (_, err: Error) => {
          reject(err)
          onErrorCleanup?.()
        },
      )
    })
  }

  function callWithOptions(params: ParamType, options?: { timeout?: number }): Promise<Awaited<ReturnType>> {
    return new Promise<Awaited<ReturnType>>((resolve, reject) => {
      let onResponseCleanup: () => void
      let onErrorCleanup: () => void

      window.electron.ipcRenderer.send(`request:${strings.kebabcase(String(method))}`, params)

      if (options?.timeout != null && Number.isFinite(options.timeout) && options.timeout > 0) {
        setTimeout(() => {
          onResponseCleanup?.()
          onErrorCleanup?.()
          reject(new Error(`Timeout after ${options.timeout}ms`))
        }, options.timeout)
      }

      onResponseCleanup = window.electron.ipcRenderer.on(
        `response:${strings.kebabcase(String(method))}`,
        (_, res: Awaited<ReturnType>) => {
          resolve(res)
          onResponseCleanup?.()
        },
      )
      onErrorCleanup = window.electron.ipcRenderer.on(
        `response:error:${strings.kebabcase(String(method))}`,
        (_, err: Error) => {
          reject(err)
          onErrorCleanup?.()
        },
      )
    })
  }

  return { call, callWithOptions }
}
