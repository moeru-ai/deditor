import type { SafeStorageMethods } from '@deditor-app/shared'
import type { App, BrowserWindow } from 'electron'

import { safeStorage } from 'electron'
import { Buffer } from 'node:buffer'

import { defineIPCHandler } from '../../define-ipc-handler'

export function registerSafeStorage(window: BrowserWindow, _app: App) {
  defineIPCHandler<SafeStorageMethods>(window, 'isEncryptionAvailable')
    .handle(async () => {
      return safeStorage.isEncryptionAvailable()
    })

  defineIPCHandler<SafeStorageMethods>(window, 'encryptString')
    .handle(async (_, { plainText }) => {
      const res = safeStorage.encryptString(plainText)
      return res.buffer as ArrayBuffer
    })

  defineIPCHandler<SafeStorageMethods>(window, 'decryptString')
    .handle(async (_, { encryptedData }) => {
      const res = safeStorage.decryptString(Buffer.from(encryptedData))
      return res
    })
}
