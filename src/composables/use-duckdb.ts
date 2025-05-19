import type { ConnectOptions, DuckDBWasmDrizzleDatabase } from '@proj-airi/drizzle-duckdb-wasm'
import type { MaybeRefOrGetter } from 'vue'

import { drizzle } from '@proj-airi/drizzle-duckdb-wasm'
import { getImportUrlBundles } from '@proj-airi/duckdb-wasm/bundles/import-url-browser'
import { onMounted, onUnmounted, ref, toValue, watch } from 'vue'

export function useDuckDB(options?: ConnectOptions & { autoConnect?: boolean }) {
  const db = ref<DuckDBWasmDrizzleDatabase>()
  const closeFunc = ref<() => Promise<void>>(async () => { })

  async function connect() {
    const drizzleClient = await drizzle({ connection: { ...options, bundles: getImportUrlBundles() } })
    db.value = drizzleClient

    closeFunc.value = async () => {
      const c = await drizzleClient?.$client
      c?.close()
    }
  }

  onMounted(async () => {
    if (options?.autoConnect) {
      await connect()
    }
  })

  onUnmounted(() => {
    closeFunc.value()
  })

  return {
    connect,
    db,
  }
}

export function useDuckDBQuery(queryStr: MaybeRefOrGetter<string>, options?: { autoConnect?: boolean, immediate?: boolean } & ConnectOptions) {
  const result = ref<Record<string, unknown>[]>()
  const errored = ref<boolean>(false)
  const error = ref<unknown>()

  const duckDB = useDuckDB(options)

  async function query() {
    try {
      result.value = await duckDB.db.value?.execute(toValue(queryStr))
      errored.value = false
      error.value = undefined
    }
    catch (err) {
      errored.value = true
      error.value = err
    }
  }

  onMounted(async () => options?.immediate && await query())
  watch(() => toValue(queryStr), () => query())

  return {
    result,
    error,
    errored,
    execute: query,
  }
}
