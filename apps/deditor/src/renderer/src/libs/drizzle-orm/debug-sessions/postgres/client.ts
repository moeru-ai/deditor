export type Row = Record<string, any>

export type RowList<T extends Row[]> = T

export interface DebuggingClient {
  conn: {
    send: (query: string) => Promise<void>
  }
  query: (query: string, params: unknown[]) => Promise<RowList<Row[]>>
  collect: () => Array<{ sql: string, params: unknown[] }>
}

export function connect(..._args: any[]): DebuggingClient {
  const sqlBuffer: Array<{ sql: string, params: unknown[] }> = []

  return {
    conn: {
      send: async (query: string) => {
        sqlBuffer.push({ sql: query, params: [] })
      },
    },
    query: async (query: string, params: unknown[]) => {
      sqlBuffer.push({ sql: query, params })
      return []
    },
    collect: () => {
      return sqlBuffer
    },
  }
}
