import { sql } from 'drizzle-orm'
import { customType, pgTable, text, uuid } from 'drizzle-orm/pg-core'

const floatArray = customType<{
  data: number[]
  driverData: string
  config: { length: number }
  configRequired: true
}>({
  dataType(config) {
    return `FLOAT[${config.length}]`
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value)
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value)
  },
})

// Raw embeddings
export const embeddings = pgTable('visualizer_embeddings', () => ({
  id: uuid().primaryKey().unique().default(sql`gen_random_uuid()`),
  text: text(),
  embedding: floatArray({ length: 1024 }),
}))
