export interface BaseEvent<T, D> {
  data: D
  type: T
}

export type EventFrom<E> = {
  [K in keyof E]: BaseEvent<K, E[K]>
}

export function useIPC() {
  return {
    connectRemoteDatabase: (databaseDsn: string) => {
      return new Promise((resolve, reject) => {
        window.electron.ipcRenderer.send('request:connect-remote-database', databaseDsn)
        window.electron.ipcRenderer.on('response:connect-remote-database', (_, res) => resolve(res))
        window.electron.ipcRenderer.on('resposne:error:connect-remote-database', (_, err) => reject(err))
      })
    },
  }
}
