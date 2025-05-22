export interface PostgresMethods {
  connectRemoteDatabasePostgres: (params: { dsn: string }) => { databaseSessionId: string, dialect: 'postgres' }
  queryRemoteDatabasePostgres: (params: {
    databaseSessionId: string,
    statement: string,
    parameters?: any[]
  }) => {
    databaseSessionId: string,
    results: any[]
  }
}

export interface MySQL2Methods {
  connectRemoteDatabaseMySQL2: (params: { dsn: string }) => { databaseSessionId: string, dialect: 'mysql2' }
  queryRemoteDatabaseMySQL2: (params: {
    databaseSessionId: string,
    statement: string,
    parameters?: any[]
  }) => {
    databaseSessionId: string,
    results: any[]
  }
}
