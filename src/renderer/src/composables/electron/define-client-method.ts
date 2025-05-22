import { kebabcase } from '@stdlib/string'

export function defineClientMethod<TMethods, TMethodName extends keyof TMethods>(method: TMethodName) {
  type P = TMethods[TMethodName] extends (...args: infer Params) => infer _Returns ? Params : never
  type R = TMethods[TMethodName] extends (...args: infer _Params) => infer Returns ? Returns : never

  function call(...params: P): Promise<Awaited<R>> {
    return new Promise<Awaited<R>>((resolve, reject) => {
      window.electron.ipcRenderer.send(`request:${kebabcase(String(method))}`, params)
      window.electron.ipcRenderer.on(`response:${kebabcase(String(method))}`, (_, res) => resolve(res))
      window.electron.ipcRenderer.on(`response:error:${kebabcase(String(method))}`, (_, err) => reject(err))
    })
  }

  function callWithOptions(params: P, options?: { timeout?: number }): Promise<Awaited<R>> {
    return new Promise<Awaited<R>>((resolve, reject) => {
      let onResponseCleanup: () => void
      let onErrorCleanup: () => void

      window.electron.ipcRenderer.send(`request:${kebabcase(String(method))}`, params)

      if (options?.timeout != null && Number.isFinite(options.timeout) && options.timeout > 0) {
        setTimeout(() => {
          onResponseCleanup()
          onErrorCleanup()
          reject(new Error(`Timeout after ${options.timeout}ms`))
        }, options.timeout)
      }

      onResponseCleanup = window.electron.ipcRenderer.on(`response:${kebabcase(String(method))}`, (_, res: Awaited<R>) => resolve(res))
      onErrorCleanup = window.electron.ipcRenderer.on(`response:error:${kebabcase(String(method))}`, (_, err: Error) => reject(err))
    })
  }

  return { call, callWithOptions }
}
