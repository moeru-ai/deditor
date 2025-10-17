import type { PathLike } from 'node:fs'

import type { FsMethods } from '@deditor-app/shared'
import type { App, BrowserWindow } from 'electron'

import { Buffer } from 'node:buffer'
import { writeFileSync } from 'node:fs'
import { mkdir, readFile, stat } from 'node:fs/promises'

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
  defineIPCHandler<FsMethods>(window, 'node/fs', 'exists').handle(async (_, params) => await exists(params.path))
  defineIPCHandler<FsMethods>(window, 'node/fs', 'readFile').handle(async (_, params) => {
    const buffer = await readFile(params.path, params.options)
    if (typeof buffer === 'string')
      return Buffer.from(buffer).buffer
    return buffer.buffer
  })
  defineIPCHandler<FsMethods>(window, 'node/fs', 'writeFile').handle(async (_, params) => writeFileSync(params.path, Buffer.from(params.data), params.options))
  defineIPCHandler<FsMethods>(window, 'node/fs', 'mkdir').handle(async (_, params) => await mkdir(params.path, params.options))
}
