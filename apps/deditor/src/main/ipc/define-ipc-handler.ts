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
    handle: (handler: (context: { event: IpcMainEvent }, request: ParamType) => Promise<ReturnType>) => {
      const methodName = strings.kebabcase(String(method))

      const wrappedHandler = (event: IpcMainEvent, request: { _eventId: string, params: ParamType }) => {
        console.log(`Handling IPC request for method: ${methodName}`, request.params)
        try {
          handler({ event }, request.params)
            .then((result) => {
              window.webContents.send(`response:${methodName}`, { _eventId: request._eventId, returns: result })
            })
            .catch(err => {
              window.webContents.send(`response:error:${methodName}`, { _eventId: request._eventId, error: err })
            })
        }
        catch (err) {
          window.webContents.send(`response:error:${methodName}`, { _eventId: request._eventId, error: err as Error })
        }
      }

      ipcMain.on(`request:${methodName}`, wrappedHandler)
      return () => ipcMain.removeListener(`request:${methodName}`, wrappedHandler)
    },
  }
}
