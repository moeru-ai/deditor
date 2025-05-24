export interface AppMethods {
  /**
   * @see https://www.electronjs.org/docs/latest/api/app#appgetpathname
   */
  getPath: (params: {
    name:
      | 'home'
      | 'appData'
      | 'userData'
      | 'sessionData'
      | 'temp'
      | 'exe'
      | 'module'
      | 'desktop'
      | 'documents'
      | 'downloads'
      | 'music'
      | 'pictures'
      | 'videos'
      | 'recent'
      | 'logs'
      | 'crashDumps'
  }) => string
}
