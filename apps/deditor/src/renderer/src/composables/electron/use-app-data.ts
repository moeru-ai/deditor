import type { RemovableRef, UseStorageAsyncOptions, UseStorageOptions } from '@vueuse/core'
import type { MaybeRefOrGetter } from 'vue'

import { useStorageAsync } from '@vueuse/core'
import { dirname, sep } from 'pathe'
import { ref, toValue, watch } from 'vue'

import { app, fs, path } from '../ipc/electron'
import { typedArrayToBuffer } from '../utils'

function useAppDataStorage<T extends(string | number | boolean | object | null)>(
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
  }, {
    ...options,
  })
}

interface Versioned<T> { version?: string, data?: T }
interface UseVersionedStorageOptions<T> {
  defaultVersion?: string
  satisfiesVersionBy?: (version: string) => boolean
  onVersionMismatch?: (value: Versioned<T>) => OnVersionMismatchActions<T>
}

export interface OnVersionMismatchKeep<T> { action: 'keep', data?: T }
export interface OnVersionMismatchReset<T> { action: 'reset', data?: T }
export type OnVersionMismatchActions<T> = OnVersionMismatchKeep<T> | OnVersionMismatchReset<T>

export function useVersionedAppDataStorage<T>(
  filename: string,
  key: string,
  initialValue: MaybeRefOrGetter<T>,
  options?: UseStorageOptions<T> & UseVersionedStorageOptions<T>,
) {
  const defaultVersion = options?.defaultVersion || '1.0.0'
  const data = ref(toValue(initialValue))
  const rawValue = useAppDataStorage<Versioned<T>>(filename, key, { version: defaultVersion, data: toValue(initialValue) }, { ...options as unknown as UseStorageOptions<Versioned<T>> })

  watch(rawValue, (value) => {
    try {
      if ('version' in rawValue.value && rawValue.value.version != null) {
        if (options?.satisfiesVersionBy != null && !options.satisfiesVersionBy(rawValue.value.version)) {
          if (options.onVersionMismatch != null) {
            const action = options.onVersionMismatch(rawValue.value)
            if (action.action === 'reset') {
              rawValue.value = { version: defaultVersion, data: toValue(initialValue) }
              data.value = toValue(initialValue)
            }
          }
          else {
            console.warn(`version ${rawValue.value.version} doesn't satisfy the version ${options.defaultVersion} for key ${key}, will reset the value to default value ${toValue(initialValue)}`)
            rawValue.value = { version: defaultVersion, data: toValue(initialValue) }
            data.value = toValue(initialValue)
          }
        }

        data.value = rawValue.value.data
        return
      }

      console.warn(`property key 'version' wasn't found in the value of key ${key} as ${value}, will keep the current ${toValue(initialValue)}`)
      rawValue.value = { version: defaultVersion, data: toValue(initialValue) }
      data.value = toValue(initialValue)
    }
    catch (err) {
      console.warn(`failed to un-marshal Local Storage value, possibly due to incompatible or corrupted for key ${key} value ${value}, falling back to default value ${toValue(initialValue)}`, err)
      rawValue.value = { version: defaultVersion, data: toValue(initialValue) }
      data.value = toValue(initialValue)
    }
  }, {
    immediate: true,
    deep: true,
  })

  return data as RemovableRef<T>
}
