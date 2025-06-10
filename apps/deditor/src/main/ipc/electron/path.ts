import type { PathMethods } from '@deditor-app/shared'
import type { App, BrowserWindow } from 'electron'

import { join } from 'node:path'

import { defineIPCHandler } from '../define-ipc-handler'

export function registerPath(window: BrowserWindow, _app: App) {
  defineIPCHandler<PathMethods>(window, 'node/path', 'join').handle(async (_, params) => join(...params))
}
