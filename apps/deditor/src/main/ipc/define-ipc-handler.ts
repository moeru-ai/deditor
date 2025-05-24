import type { BrowserWindow, IpcMainEvent } from 'electron'

import strings from '@stdlib/string'
import { ipcMain } from 'electron'

export function defineIPCHandler<
  TMethods,
  TMethodName extends keyof TMethods = keyof TMethods,
>(
  window: BrowserWindow,
  method: TMethodName,
) {
  type MethodType = TMethods[TMethodName]
  type ParamType = MethodType extends (params: infer P) => any ? P : never
  type ReturnType = MethodType extends (...args: any[]) => infer R ? R : never

  return {
    handle: (handler: (context: { event: IpcMainEvent }, params: ParamType) => Promise<ReturnType>) => {
      const methodName = strings.kebabcase(String(method))

      const wrappedHandler = (event: IpcMainEvent, params: ParamType) => {
        try {
          handler({ event }, params)
            .then(result => window.webContents.send(`response:${methodName}`, result))
            .catch(err => window.webContents.send(`response:error:${methodName}`, err))
        }
        catch (err) {
          window.webContents.send(`response:error:${methodName}`, err)
        }
      }

      ipcMain.on(`request:${methodName}`, wrappedHandler)

      return () => ipcMain.removeListener(`request:${methodName}`, wrappedHandler)
    },
  }
}
