import type { BrowserWindow } from 'electron'

import { registerPGLiteDatabaseDialect } from '../local'
import { registerMySQL2DatabaseDialect } from './mysql'
import { registerPostgresJsDatabaseDialect } from './postgres'

export function registerDatabaseDialects(window: BrowserWindow) {
  registerMySQL2DatabaseDialect(window)
  registerPostgresJsDatabaseDialect(window)
  registerPGLiteDatabaseDialect(window)
}

export {
  registerMySQL2DatabaseDialect,
  registerPGLiteDatabaseDialect,
  registerPostgresJsDatabaseDialect,
}
