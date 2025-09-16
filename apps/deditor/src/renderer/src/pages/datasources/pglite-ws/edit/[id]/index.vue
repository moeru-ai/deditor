<script setup lang="ts">
import type { ConnectionThroughParameters, DatasourceDriver } from '../../../../../libs/datasources'

import { nanoid } from '@deditor-app/shared'
import { useClipboard, useRefHistory } from '@vueuse/core'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import Button from '../../../../../components/basic/Button.vue'
import Editable from '../../../../../components/basic/Editable.vue'
import { Input } from '../../../../../components/ui/input'
import { useRemotePGLiteWebSocket } from '../../../../../composables/ipc/databases/remote'
import { DatasourceDriverEnum, defaultParamsFromDriver, fromDSN, toDSN } from '../../../../../libs/datasources'
import { useDatasourcesStore } from '../../../../../stores/datasources'

const route = useRoute('/datasources/pglite/edit/[id]/')

const id = computed(() => route.params.id)
const driver = computed(() => DatasourceDriverEnum.PGLiteWebSocket)

const testConnectionConnecting = ref(false)
const testConnectionSucceeded = ref(false)
const testConnectionErrored = ref(false)
const testConnectionErrorMessage = ref('')

const datasourcesStore = useDatasourcesStore()

function datasourceFromId() {
  const datasource = datasourcesStore.datasources.find(ds => ds.id === id.value)
  if (typeof datasource === 'undefined') {
    const newDatasource = datasourcesStore.createDatasource(driver.value as DatasourceDriver)
    datasourcesStore.datasources.push(newDatasource)
    return newDatasource
  }

  return datasource
}

const datasource = computed({
  get: () => datasourceFromId(),
  set: (value) => {
    const datasourceIndex = datasourcesStore.datasources.findIndex(ds => ds.id === id.value)
    if (datasourceIndex !== -1) {
      datasourcesStore.datasources[datasourceIndex] = value
    }
    else {
      console.error(`Datasource with id ${id.value} not found in store.`)
    }
  },
})

const DSN = computed({
  get: () => {
    return toDSN(
      driver.value,
      datasource.value as ConnectionThroughParameters,
      defaultParamsFromDriver(driver.value),
    )
  },
  set: (value) => {
    if (!datasource.value)
      return

    const params = datasource.value as ConnectionThroughParameters
    const paramsFromDSN = fromDSN(
      value,
      defaultParamsFromDriver(driver.value),
    )

    params.host = paramsFromDSN.host
    params.port = paramsFromDSN.port
    params.user = paramsFromDSN.user
    params.password = paramsFromDSN.password
    params.database = paramsFromDSN.database
    params.extraOptions = paramsFromDSN.extraOptions || { sslmode: false }
  },
})

const token = computed({
  get: () => {
    const paramsFromDSN = fromDSN(
      DSN.value,
      defaultParamsFromDriver(driver.value),
    )

    return paramsFromDSN.extraOptions?.token as string
  },
  set: (val) => {
    const dsn = toDSN(
      driver.value,
      {
        ...datasource.value,
        extraOptions: { token: val },
      } as ConnectionThroughParameters,
      defaultParamsFromDriver(driver.value),
    )

    DSN.value = dsn
  },
})

const datasourceName = computed({
  get: () => datasource.value.name || 'New Datasource',
  set: (value) => {
    datasource.value.name = value
  },
})

const { undo, clear } = useRefHistory(datasourceName)

// TODO: ?
onMounted(() => {
  DSN.value = toDSN(
    driver.value,
    datasource.value as ConnectionThroughParameters,
    defaultParamsFromDriver(driver.value),
  )

  if (!token.value) {
    token.value = nanoid()
  }
})

watch([id, driver], () => {
  clear()
  datasource.value = datasourceFromId()
})

function handleBlur() {
  if (!datasourceName.value) {
    undo()
  }
}

async function handleTestConnection() {
  const { connect, execute } = useRemotePGLiteWebSocket()
  let dsn = ''

  if ('connectionString' in datasource.value && !!datasource.value.connectionString) {
    dsn = datasource.value.connectionString
  }
  else {
    const params = datasource.value as ConnectionThroughParameters
    dsn = toDSN(driver.value, params, defaultParamsFromDriver(driver.value))
  }

  try {
    testConnectionSucceeded.value = false
    testConnectionConnecting.value = true

    await connect(dsn)
    // eslint-disable-next-line no-console
    console.debug(await execute('SELECT 1'))

    testConnectionSucceeded.value = true
  }
  catch (err) {
    testConnectionErrored.value = true

    const e = err as Error
    testConnectionErrorMessage.value = e.message || 'Unknown error occurred while testing connection.'
    if (e.cause != null) {
      testConnectionErrorMessage.value += ` Cause: ${String(e.cause)}`
    }

    console.error('Error testing connection:', testConnectionErrorMessage.value)
  }
  finally {
    testConnectionConnecting.value = false
  }
}

async function handlePasteDSN() {
  const { text } = useClipboard()
  DSN.value = text.value || ''
}
</script>

<template>
  <div h-full flex flex-col>
    <div flex>
      <h2 text="neutral-300/80" mb-1 flex flex-1>
        Edit PGLite Datasource
      </h2>
      <RouterLink to="/datasources">
        <div i-ph:x-bold text="neutral-300/80" />
      </RouterLink>
    </div>
    <div h-full flex flex-col>
      <div mt-3 flex flex-1 flex-col gap-2>
        <Editable v-model="datasourceName" mb-3 font-bold @blur="handleBlur">
          {{ driver }}
        </Editable>
        <div>
          <label flex="~ col gap-2">
            <div>
              <div class="flex items-center gap-1 text-sm font-medium">
                WebSocket Listen Address
              </div>
              <div class="text-xs text-neutral-500 dark:text-neutral-400">
                Address for the WebSocket server to listen on
              </div>
            </div>
            <div flex items-center gap-2>
              <Input :model-value="token" disabled flex-1 />
              <Button @click="handlePasteDSN">
                Paste
              </Button>
            </div>
          </label>
        </div>
      </div>
      <div flex flex-col gap-3>
        <div v-if="testConnectionErrored" class="mt-2 text-sm text-red-500" border="2 solid red-800/50" bg="red-900/50" flex items-center gap-1 rounded-lg px-3 py-2 text-lg>
          <div i-ph:warning-circle-bold mr-1 inline-block />
          {{ testConnectionErrorMessage }}
        </div>
        <button bg="green-800/50" flex items-center justify-center gap-2 rounded-lg px-3 py-2 @click="handleTestConnection">
          Test
          <div v-if="testConnectionConnecting" i-svg-spinners:270-ring />
          <div v-else-if="testConnectionSucceeded" i-ph:check-bold />
        </button>
      </div>
    </div>
  </div>
</template>
