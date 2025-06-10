import type { DialogMethods } from '@deditor-app/shared'
import type { App, BrowserWindow } from 'electron'

import { dialog } from 'electron'

import { defineIPCHandler } from '../define-ipc-handler'

export function registerDialog(window: BrowserWindow, _app: App) {
  defineIPCHandler<DialogMethods>(window, 'electron/dialog', 'showOpenDialog').handle(async (_, params) => dialog.showOpenDialog(window, params))
}
