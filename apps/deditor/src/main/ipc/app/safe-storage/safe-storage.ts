import { safeStorage } from 'electron'

export function useSafeStorage() {
  return {
    isAvailable: () => {
      safeStorage.isEncryptionAvailable()
    },
  }
}
