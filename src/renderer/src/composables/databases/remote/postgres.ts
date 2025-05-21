import { useIPC } from '../../electron/use-ipc'

export function useRemotePostgres() {
  const { connectRemoteDatabase } = useIPC()

  return {
    connect: (dsn: string) => {
      return connectRemoteDatabase(dsn)
    },
  }
}
