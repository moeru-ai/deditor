export interface DialogMethods {
  showOpenDialog: (params: {
    title?: string
    defaultPath?: string
    /**
     * Custom label for the confirmation button, when left empty the default label will
     * be used.
     */
    buttonLabel?: string
    filters?: {
      // Docs: https://electronjs.org/docs/api/structures/file-filter
      extensions: string[]
      name: string
    }[]
    /**
     * Contains which features the dialog should use. The following values are
     * supported:
     */
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory' | 'promptToCreate' | 'noResolveAliases' | 'treatPackageAsDirectory' | 'dontAddToRecent'>
    /**
     * Message to display above input boxes.
     *
     * @platform darwin
     */
    message?: string
    /**
     * Create security scoped bookmarks when packaged for the Mac App Store.
     *
     * @platform darwin,mas
     */
    securityScopedBookmarks?: boolean
  }) => {
    /**
     * whether or not the dialog was canceled.
     */
    canceled: boolean
    /**
     * An array of file paths chosen by the user. If the dialog is cancelled this will
     * be an empty array.
     */
    filePaths: string[]
    /**
     * An array matching the `filePaths` array of base64 encoded strings which contains
     * security scoped bookmark data. `securityScopedBookmarks` must be enabled for
     * this to be populated. (For return values, see table here.)
     *
     * @platform darwin,mas
     */
    bookmarks?: string[]
  }
}
