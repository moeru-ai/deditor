import { ref } from 'vue'

export function useRemotePostgres() {
  const databaseSessionId = ref<string>()

  return {
    connect: (dsn: string) => {
      return new Promise((resolve, reject) => {
        window.electron.ipcRenderer.send('request:connect-remote-database-postgres', dsn)
        window.electron.ipcRenderer.on('response:connect-remote-database-postgres', (_, res: { databaseSessionId: string }) => {
          databaseSessionId.value = res.databaseSessionId
          resolve(databaseSessionId.value)
        })
        window.electron.ipcRenderer.on('response:error:connect-remote-database-postgres', (_, err) => reject(err))
      })
    },
    execute: <R = Record<string, unknown>>(statement: string, ...params: any[]) => {
      return new Promise<R>((resolve, reject) => {
        window.electron.ipcRenderer.send('request:query-remote-database-postgres', { databaseSessionId: databaseSessionId.value, statement, parameters: params })
        window.electron.ipcRenderer.on('response:query-remote-database-postgres', (_, res: { databaseSessionId: string, results: R }) => {
          if (res.databaseSessionId !== databaseSessionId.value) {
            reject(new Error('Database session ID mismatch'))
            return
          }

          resolve(res.results)
        })
        window.electron.ipcRenderer.on('response:error:query-remote-database-postgres', (_, err) => reject(err))
      })
    },
  }
}
