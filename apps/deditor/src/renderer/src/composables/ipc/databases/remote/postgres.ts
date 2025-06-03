import type { PostgresMethods } from '@deditor-app/shared'

import { ref } from 'vue'

import { defineClientMethod } from '../../define-client-method'

export function useRemotePostgres() {
  const methods = <TMethod extends keyof PostgresMethods>(method: TMethod) => defineClientMethod<PostgresMethods, TMethod>(method)
  const databaseSessionId = ref<string>()

  return {
    connect: async (dsn: string) => {
      const id = await methods('connectRemoteDatabasePostgres').call({ dsn })
      databaseSessionId.value = id.databaseSessionId

      return id
    },
    execute: async <R = Record<string, unknown>>(statement: string, parameters: any[] = []): Promise<R[]> => {
      if (!databaseSessionId.value) {
        throw new Error('Database session ID is not set. Please connect to a database first.')
      }

      const res = await methods('queryRemoteDatabasePostgres').call({
        databaseSessionId: databaseSessionId.value!,
        statement,
        parameters,
      })

      return res.results as R[]
    },
    listTables: async () => {
      if (!databaseSessionId.value) {
        throw new Error('Database session ID is not set. Please connect to a database first.')
      }

      const res = await methods('listTables').call({ databaseSessionId: databaseSessionId.value! })
      return res.results
    },
    listColumns: async (tableName: string, schema: string = 'public') => {
      if (!databaseSessionId.value) {
        throw new Error('Database session ID is not set. Please connect to a database first.')
      }

      const res = await methods('listColumns').call({ databaseSessionId: databaseSessionId.value!, tableName, schema })
      return res.results
    },
  }
}
