import type { FsMethods } from '@deditor-app/shared'
import type { App, BrowserWindow } from 'electron'
import type { PathLike } from 'node:fs'

import { Buffer } from 'node:buffer'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'

import { defineIPCHandler } from '../define-ipc-handler'

export async function exists(path: PathLike) {
  try {
    await stat(path)
    return true
  }
  catch (error) {
    if (isENOENTError(error))
      return false

    throw error
  }
}

export function isENOENTError(error: unknown): boolean {
  if (!(error instanceof Error))
    return false
  if (!('code' in error))
    return false
  if (error.code !== 'ENOENT')
    return false

  return true
}

export function registerFs(window: BrowserWindow, _app: App) {
  defineIPCHandler<FsMethods>(window, 'exists').handle(async (_, params) => await exists(params.path))
  defineIPCHandler<FsMethods>(window, 'readFile').handle(async (_, params) => (await readFile(params.path, params.options)).buffer)
  defineIPCHandler<FsMethods>(window, 'writeFile').handle(async (_, params) => await writeFile(params.path, Buffer.from(params.data), params.options))
  defineIPCHandler<FsMethods>(window, 'mkdir').handle(async (_, params) => await mkdir(params.path, params.options))
}
