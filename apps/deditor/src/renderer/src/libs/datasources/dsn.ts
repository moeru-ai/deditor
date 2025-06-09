import type { ConnectionThroughParameters, DSNDefaultParams } from './types'

import { DatasourceDriverEnum } from './types'

export function defaultParamsFromDriver(driver: string): DSNDefaultParams {
  switch (driver) {
    case DatasourceDriverEnum.Postgres:
      return postgresDefaultParams()
    case DatasourceDriverEnum.MySQL:
      return mysqlDefaultParams()
    case DatasourceDriverEnum.PGLite:
      return pgliteDefaultParams()
    default:
      throw new Error(`Unsupported driver: ${driver}`)
  }
}

export function postgresDefaultParams(): DSNDefaultParams {
  return {
    params: {
      driver: DatasourceDriverEnum.Postgres,
      host: '127.0.0.1',
      password: '',
      port: 5432,
      user: 'postgres',
      database: 'postgres',
    },
    applyParamsURLSearchParams: (search: URLSearchParams) => {
      search.set('sslmode', 'false')
    },
  }
}

export function mysqlDefaultParams(): DSNDefaultParams {
  return {
    params: {
      driver: DatasourceDriverEnum.MySQL,
      host: '127.0.0.1',
      password: '',
      port: 3306,
      user: 'root',
    },
  }
}

export function pgliteDefaultParams(): DSNDefaultParams {
  return {
    params: {
      driver: DatasourceDriverEnum.PGLite,
      host: '127.0.0.1',
      password: '',
      port: 0,
      user: '',
    },
  }
}

export function toDSN(
  driver: string,
  params: ConnectionThroughParameters,
  defaultParams?: DSNDefaultParams,
) {
  const {
    applyParamsURLSearchParams = () => {},
    applyURL = () => {},
  } = defaultParams || {
    applyParamsURLSearchParams: () => {},
    applyURL: () => {},
  }

  const search = new URLSearchParams()
  if (applyParamsURLSearchParams != null && typeof applyParamsURLSearchParams === 'function') {
    applyParamsURLSearchParams(search)
  }

  for (const [key, value] of Object.entries(params.extraOptions || {})) {
    if (Array.isArray(value)) {
      value.forEach(v => search.set(key, v))
    }
    else {
      search.set(key, String(value))
    }
  }

  const dsn = new URL('/test', 'https://127.0.0.1')
  dsn.username = params.user || ''
  dsn.password = params.password || ''
  dsn.host = params.host || defaultParams?.params?.host || '127.0.0.1'
  dsn.port = String(params.port || defaultParams?.params?.port || 5432)
  dsn.pathname = params.database || defaultParams?.params?.database || ''
  dsn.search = search.toString()

  if (applyURL != null && typeof applyURL === 'function') {
    applyURL(dsn)
  }

  return dsn.toString().replace('https', driver)
}

export function fromDSN(dsn: string, defaultParams: DSNDefaultParams): ConnectionThroughParameters {
  const params: ConnectionThroughParameters = {
    ...defaultParams.params!,
  }

  try {
    const url = new URL(dsn)
    params.host = url.hostname || '127.0.0.1'
    params.port = Number(url.port) || 5432
    params.user = url.username || ''
    params.password = url.password || ''
    params.database = url?.pathname?.slice(1) || 'postgres' // Remove leading slash

    if (!params.extraOptions)
      params.extraOptions = { sslmode: false }

    // Parse SSL mode from query params if present
    const sslMode = url.searchParams.get('sslmode')
    if (sslMode) {
      if (sslMode === 'true') {
        params.extraOptions!.sslmode = true
      }
      else if (sslMode === 'false') {
        params.extraOptions!.sslmode = false
      }
      else {
        params.extraOptions!.sslmode = sslMode as 'require' | 'allow' | 'prefer' | 'verify-full'
      }
    }
  }
  catch (err) {
    console.warn('Invalid connection string format:', err)
  }

  return params
}
