import type { BrowserWindow } from 'electron'

import { registerMySQL2DatabaseDialect } from './mysql'
import { registerPostgresJsDatabaseDialect } from './postgres'

export function registerDatabaseDialects(window: BrowserWindow) {
  registerMySQL2DatabaseDialect(window)
  registerPostgresJsDatabaseDialect(window)
}

export {
  registerMySQL2DatabaseDialect,
  registerPostgresJsDatabaseDialect,
}
