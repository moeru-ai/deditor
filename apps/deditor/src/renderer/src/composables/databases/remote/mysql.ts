import type { MySQL2Methods } from '@deditor-app/shared'

import { ref } from 'vue'

import { defineClientMethod } from '../../electron/define-client-method'

export function useRemoteMySQL() {
  const methods = <TMethod extends keyof MySQL2Methods>(method: TMethod) => defineClientMethod<MySQL2Methods, TMethod>(method)
  const databaseSessionId = ref<string>()

  return {
    connect: async (dsn: string) => {
      const id = await methods('connectRemoteDatabaseMySQL2').call({ dsn })
      databaseSessionId.value = id.databaseSessionId

      return id
    },
    execute: async <R = Record<string, unknown>>(statement: string, parameters: any[] = []): Promise<R[]> => {
      if (!databaseSessionId.value) {
        throw new Error('Database session ID is not set. Please connect to a database first.')
      }

      const res = await methods('queryRemoteDatabaseMySQL2').call({
        databaseSessionId: databaseSessionId.value!,
        statement,
        parameters,
      })

      return res.results as R[]
    },
  }
}
