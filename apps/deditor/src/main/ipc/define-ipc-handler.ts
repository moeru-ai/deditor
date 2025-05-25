import type { BrowserWindow, IpcMainEvent } from 'electron'

import strings from '@stdlib/string'
import debug from 'debug'
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

  const debugIpcHandler = debug(`deditor:ipc:handler:${strings.kebabcase(String(method))}`)

  return {
    handle: (handler: (context: { event: IpcMainEvent }, request: ParamType) => Promise<ReturnType>) => {
      const methodName = strings.kebabcase(String(method))

      const wrappedHandler = (event: IpcMainEvent, request: { _eventId: string, params: ParamType }) => {
        debugIpcHandler(`request:`, request)

        try {
          handler({ event }, request.params)
            .then((result) => {
              debugIpcHandler(`response:`, result)
              window.webContents.send(`response:${methodName}`, { _eventId: request._eventId, returns: result })
            })
            .catch((err) => {
              debugIpcHandler(`error:`, err)
              window.webContents.send(`response:error:${methodName}`, { _eventId: request._eventId, error: err })
            })
        }
        catch (err) {
          debugIpcHandler(`unexpected caught error:`, err)
          window.webContents.send(`response:error:${methodName}`, { _eventId: request._eventId, error: err as Error })
        }
      }

      ipcMain.on(`request:${methodName}`, wrappedHandler)
      return () => ipcMain.removeListener(`request:${methodName}`, wrappedHandler)
    },
  }
}
