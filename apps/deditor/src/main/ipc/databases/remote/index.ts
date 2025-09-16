import type { BrowserWindow } from 'electron'

import { registerPGLiteDatabaseDialect } from '../local'
import { registerMySQL2DatabaseDialect } from './mysql'
import { registerPGLiteWebSocketDatabaseDialect } from './pglite-ws'
import { registerPostgresJsDatabaseDialect } from './postgres'

export function registerDatabaseDialects(window: BrowserWindow) {
  registerMySQL2DatabaseDialect(window)
  registerPostgresJsDatabaseDialect(window)
  registerPGLiteDatabaseDialect(window)
  registerPGLiteWebSocketDatabaseDialect(window)
}

export {
  registerMySQL2DatabaseDialect,
  registerPGLiteDatabaseDialect,
  registerPGLiteWebSocketDatabaseDialect,
  registerPostgresJsDatabaseDialect,
}
