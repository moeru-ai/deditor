import type { PostgresMethods } from '@deditor-app/shared'

import { ref } from 'vue'

import { defineClientMethod } from '../../define-client-method'

export function useRemotePostgres() {
  const methods = <TMethod extends keyof PostgresMethods>(method: TMethod) => defineClientMethod<PostgresMethods, TMethod>('databaseRemotePostgres', method)
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
    listColumns: async (tableName: string, schema: string = 'public') => {
      if (!databaseSessionId.value) {
        throw new Error('Database session ID is not set. Please connect to a database first.')
      }

      const res = await methods('listColumns').call({ databaseSessionId: databaseSessionId.value!, tableName, schema })
      return res.results
    },
    listIndexes: async (tableName: string, schema: string = 'public') => {
      if (!databaseSessionId.value) {
        throw new Error('Database session ID is not set. Please connect to a database first.')
      }

      const res = await methods('listIndexes').call({ databaseSessionId: databaseSessionId.value!, tableName, schema })
      return res.results
    },
    listColumnsWithTypes: async (tableName: string, schema: string = 'public') => {
      if (!databaseSessionId.value) {
        throw new Error('Database session ID is not set. Please connect to a database first.')
      }

      const res = await methods('listColumnsWithTypes').call({ databaseSessionId: databaseSessionId.value!, tableName, schema })
      return res.results
    },
  }
}
