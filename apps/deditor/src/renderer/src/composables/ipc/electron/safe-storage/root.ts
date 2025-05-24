import type { SafeStorageMethods } from '@deditor-app/shared'

import { decodeBase64, encodeBase64 } from '@moeru/std/base64'
import { computedAsync } from '@vueuse/core'

import { defineClientMethod } from '../../define-client-method'

const methods = <TMethod extends keyof SafeStorageMethods>(method: TMethod) => defineClientMethod<SafeStorageMethods, TMethod>(method)

function typedArrayToBuffer(array: Uint8Array): ArrayBuffer {
  return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset) as ArrayBuffer
}

export function useSafeStorage() {
  const isAvailable = computedAsync(async () => methods('isEncryptionAvailable').call())

  return {
    isAvailable,
    encrypt: (plainText: string) => {
      if (!isAvailable.value)
        throw new Error('Safe storage encryption is not available on this platform.')

      return methods('encryptString').call({ plainText })
    },
    encryptBase64: async (plainText: string) => {
      if (!isAvailable.value)
        throw new Error('Safe storage encryption is not available on this platform.')

      const res = await methods('encryptString').call({ plainText })
      return encodeBase64(res)
    },
    decrypt: (encryptedData: ArrayBuffer) => {
      if (!isAvailable.value)
        throw new Error('Safe storage decryption is not available on this platform.')

      // eslint-disable-next-line no-console
      console.log('Decrypting:', encryptedData)
      return methods('decryptString').call({ encryptedData })
    },
    decryptBase64: (encryptedBase64: string) => {
      const decryptedBuffer = decodeBase64(encryptedBase64)
      if (!decryptedBuffer)
        throw new Error('Invalid Base64 string for decryption.')
      if (!isAvailable.value)
        throw new Error('Safe storage decryption is not available on this platform.')

      const buffer = typedArrayToBuffer(decryptedBuffer)
      // eslint-disable-next-line no-console
      console.log('Decrypting Base64:', decryptedBuffer)
      return methods('decryptString').call({ encryptedData: buffer })
    },
  }
}
