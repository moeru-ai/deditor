import type { SQLiteMethods } from '@deditor-app/shared'

import { ref } from 'vue'

import { defineClientMethod } from '../../define-client-method'

export function useLocalSQLite() {
  const methods = <TMethod extends keyof SQLiteMethods>(method: TMethod) => defineClientMethod<SQLiteMethods, TMethod>('databaseLocalSQLite', method)
  const databaseSessionId = ref<string>()

  return {
    connect: async (dsn: string) => {
      const id = await methods('connect').call({ dsn })
      databaseSessionId.value = id.databaseSessionId

      return id
    },
    execute: async <R = Record<string, unknown>>(statement: string, parameters: any[] = []): Promise<R[]> => {
      if (!databaseSessionId.value) {
        throw new Error('Database session ID is not set. Please connect to a database first.')
      }

      const res = await methods('query').call({
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
  }
}
