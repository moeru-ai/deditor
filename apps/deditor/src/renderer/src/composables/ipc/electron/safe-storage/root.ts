import type { SafeStorageMethods } from '@deditor-app/shared'

import { decodeBase64, encodeBase64 } from '@moeru/std/base64'
import { computedAsync } from '@vueuse/core'

import { typedArrayToBuffer } from '../../../utils'
import { defineClientMethod } from '../../define-client-method'

export const safeStorage = <TMethod extends keyof SafeStorageMethods>(method: TMethod) => defineClientMethod<SafeStorageMethods, TMethod>('safeStorage', method)

export function useSafeStorage() {
  const isAvailable = computedAsync(async () => safeStorage('isEncryptionAvailable').call())

  return {
    isAvailable,
    encrypt: (plainText: string) => {
      if (!isAvailable.value)
        throw new Error('Safe storage encryption is not available on this platform.')

      return safeStorage('encryptString').call({ plainText })
    },
    encryptBase64: async (plainText: string) => {
      if (!isAvailable.value)
        throw new Error('Safe storage encryption is not available on this platform.')

      const res = await safeStorage('encryptString').call({ plainText })
      return encodeBase64(res)
    },
    decrypt: (encryptedData: ArrayBuffer) => {
      if (!isAvailable.value)
        throw new Error('Safe storage decryption is not available on this platform.')

      return safeStorage('decryptString').call({ encryptedData })
    },
    decryptBase64: (encryptedBase64: string) => {
      const decryptedBuffer = decodeBase64(encryptedBase64)
      if (!decryptedBuffer)
        throw new Error('Invalid Base64 string for decryption.')
      if (!isAvailable.value)
        throw new Error('Safe storage decryption is not available on this platform.')

      const buffer = typedArrayToBuffer(decryptedBuffer)
      return safeStorage('decryptString').call({ encryptedData: buffer })
    },
  }
}
