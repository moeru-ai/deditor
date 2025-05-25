import type { UseStorageAsyncOptions } from '@vueuse/core'
import type { MaybeRefOrGetter } from 'vue'

import { useStorageAsync } from '@vueuse/core'
import { dirname, sep } from 'pathe'

import { app, fs, path } from '../ipc/electron'
import { typedArrayToBuffer } from '../utils'

export function useAppDataStorage<T extends(string | number | boolean | object | null)>(
  filename: string,
  key: string,
  initialValue: MaybeRefOrGetter<T>,
  options: UseStorageAsyncOptions<T> = {},
) {
  return useStorageAsync<T>(key, initialValue, {
    getItem: async (key) => {
      const appDataPath = await app('getPath').call({ name: 'appData' })
      const fileDirPath = await path('join').call([appDataPath, ...dirname(filename).split(sep)])
      const fileDirPathExists = await fs('exists').call({ path: fileDirPath })
      if (!fileDirPathExists) {
        await fs('mkdir').call({ path: fileDirPath, recursive: true })
      }

      const filePath = await path('join').call([appDataPath, ...filename.split(sep)])

      const exists = await fs('exists').call({ path: filePath })
      if (!exists) {
        await fs('writeFile').call({ path: filePath, data: typedArrayToBuffer(new TextEncoder().encode('{}')) })
      }

      const readContent = await fs('readFile').call({ path: filePath })

      const decoder = new TextDecoder()
      const content = decoder.decode(readContent as ArrayBuffer)
      const data = JSON.parse(content)

      return data[key]
    },
    removeItem: async (key) => {
      const appDataPath = await app('getPath').call({ name: 'appData' })
      const fileDirPath = await path('join').call([appDataPath, ...dirname(filename).split(sep)])
      const fileDirPathExists = await fs('exists').call({ path: fileDirPath })
      if (!fileDirPathExists) {
        await fs('mkdir').call({ path: fileDirPath, recursive: true })
      }

      const filePath = await path('join').call([appDataPath, ...filename.split(sep)])

      const exists = await fs('exists').call({ path: filePath })
      if (!exists) {
        return
      }

      const readContent = await fs('readFile').call({ path: filePath })

      const decoder = new TextDecoder()
      const content = decoder.decode(readContent as ArrayBuffer)
      const data = JSON.parse(content)

      delete data[key]

      const encoder = new TextEncoder()
      const writeContent = encoder.encode(JSON.stringify(data, null, 2))

      await fs('writeFile').call({ path: filePath, data: typedArrayToBuffer(writeContent) })

      return undefined
    },
    setItem: async (key, value) => {
      const appDataPath = await app('getPath').call({ name: 'appData' })
      const fileDirPath = await path('join').call([appDataPath, ...dirname(filename).split(sep)])
      const fileDirPathExists = await fs('exists').call({ path: fileDirPath })
      if (!fileDirPathExists) {
        await fs('mkdir').call({ path: fileDirPath, recursive: true })
      }

      const filePath = await path('join').call([appDataPath, ...filename.split(sep)])

      const exists = await fs('exists').call({ path: filePath })
      if (!exists) {
        await fs('writeFile').call({ path: filePath, data: typedArrayToBuffer(new TextEncoder().encode('{}')) })
      }

      const readContent = await fs('readFile').call({ path: filePath })

      const decoder = new TextDecoder()
      const content = decoder.decode(readContent as ArrayBuffer)
      const data = JSON.parse(content)

      if (typeof value === 'undefined') {
        delete data[key]
      }
      else {
        data[key] = value
      }

      const encoder = new TextEncoder()
      const writeContent = encoder.encode(JSON.stringify(data, null, 2))

      await fs('writeFile').call({ path: filePath, data: typedArrayToBuffer(writeContent) })
    },
  }, options)
}
