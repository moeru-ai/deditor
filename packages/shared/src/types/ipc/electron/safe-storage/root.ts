export interface SafeStorageMethods {
  isEncryptionAvailable: () => boolean
  encryptString: (params: { plainText: string }) => ArrayBuffer
  decryptString: (params: { encryptedData: ArrayBuffer }) => string
  setUsePlainTextEncryption: (params: { usePlainText: boolean }) => void
  getSelectedStorageBackend: () =>
    | 'basic_text'
    | 'gnome_libsecret'
    | 'kwallet'
    | 'kwallet5'
    | 'kwallet6'
}
