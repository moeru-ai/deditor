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
  return {
    handle: <
      P extends TMethods[TMethodName] extends (...params: infer Params) => infer _Returns ? Params : never,
      R extends TMethods[TMethodName] extends (...params: infer _Params) => infer Returns ? Returns : never,
    >(handler: (context: { event: IpcMainEvent }, ...params: P) => Promise<R>) => {
      const methodName = strings.kebabcase(String(method))

      const wrappedHandler = (event: IpcMainEvent, params: any) => {
        try {
          handler({ event }, ...params)
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
