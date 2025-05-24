import type { AppMethods } from '@deditor-app/shared'
import type { App, BrowserWindow } from 'electron'

import { defineIPCHandler } from '../define-ipc-handler'

export function registerApp(window: BrowserWindow, app: App) {
  defineIPCHandler<AppMethods>(window, 'getPath')
    .handle(async (_, { name }) => {
      return app.getPath(name)
    })
}
