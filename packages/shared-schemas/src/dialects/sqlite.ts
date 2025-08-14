import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const sqliteSqliteSchema = sqliteTable('sqlite_schema', {
  type: text('type').notNull(),
  name: text('name').notNull(),
  tblName: text('tbl_name').notNull(),
  rootPage: integer('rootpage').notNull(),
  sql: text('sql'),
})
