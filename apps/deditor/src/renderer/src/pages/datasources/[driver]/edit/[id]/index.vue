<script setup lang="ts">
import type { Datasource, DatasourceThroughConnectionParameters, Driver } from '../../../../../stores/datasources'

import { nanoid } from '@deditor-app/shared'
import { useRefHistory } from '@vueuse/core'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import Editable from '../../../../../components/basic/Editable.vue'
import { Input } from '../../../../../components/ui/input'
import { useRemotePostgres } from '../../../../../composables/ipc/databases/remote'
import { defaultParamsFromDriver, fromDSN, toDSN } from '../../../../../libs/dsn'
import { useDatasourcesStore } from '../../../../../stores/datasources'

const route = useRoute('/datasources/[driver]/edit/[id]/')

const id = computed(() => route.params.id)
const driver = computed<Driver>(() => route.params.driver as Driver)

const testConnectionConnecting = ref(false)
const testConnectionSucceeded = ref(false)
const testConnectionErrored = ref(false)
const testConnectionErrorMessage = ref('')

const datasourcesStore = useDatasourcesStore()

function datasourceFromId() {
  const datasource = datasourcesStore.datasources.find(ds => ds.id === id.value)
  if (typeof datasource === 'undefined') {
    const newDatasource = { id: nanoid(), name: 'New Datasource', driver: driver.value, connectionString: '', database: 'postgres', sslmode: '' } satisfies Datasource
    datasourcesStore.datasources.push(newDatasource)

    return newDatasource
  }

  return datasource
}

const datasource = ref(datasourceFromId())
const datasourceName = ref(datasource.value.name || 'New Datasource')
const { undo, clear } = useRefHistory(datasourceName)
const DSN = computed({
  get: () => {
    return toDSN(driver.value, datasource.value as DatasourceThroughConnectionParameters, defaultParamsFromDriver(driver.value))
  },
  set: (value) => {
    if (!datasource.value)
      return

    const params = datasource.value as DatasourceThroughConnectionParameters
    const paramsFromDSN = fromDSN(value, defaultParamsFromDriver(driver.value))

    params.host = paramsFromDSN.host
    params.port = paramsFromDSN.port
    params.user = paramsFromDSN.user
    params.password = paramsFromDSN.password
    params.database = paramsFromDSN.database
    params.extraOptions = paramsFromDSN.extraOptions || { sslmode: '' }
  },
})

// TODO: ?
onMounted(() => {
  DSN.value = toDSN(driver.value, datasource.value as DatasourceThroughConnectionParameters, defaultParamsFromDriver(driver.value))
})

watch([id, driver], () => {
  clear()
  datasource.value = datasourceFromId()
  datasourceName.value = datasource.value.name || 'New Datasource'
})

function handleBlur() {
  if (!datasourceName.value) {
    undo()
  }
}

watch(datasourceName, (newName) => {
  if (datasource.value) {
    datasource.value.name = newName
  }
}, {
  immediate: true,
})

watch(datasource, () => {
  const datasourceIndex = datasourcesStore.datasources.findIndex(ds => ds.id === id.value)
  if (datasourceIndex !== -1) {
    datasourcesStore.datasources[datasourceIndex] = datasource.value
  }
  else {
    console.error(`Datasource with id ${id.value} not found in store.`)
  }
}, {
  deep: true,
})

async function handleTestConnection() {
  const { connect, execute } = useRemotePostgres()
  if ('connectionString' in datasource.value && !!datasource.value.connectionString) {
    try {
      testConnectionSucceeded.value = false
      testConnectionConnecting.value = true
      await connect(datasource.value.connectionString)
      // eslint-disable-next-line no-console
      console.debug(await execute('SELECT 1'))
      testConnectionSucceeded.value = true
    }
    catch (err) {
      testConnectionErrored.value = true
      testConnectionErrorMessage.value = (err as Error).message || 'Unknown error occurred while testing connection.'
      console.error('Error testing connection:', testConnectionErrorMessage.value)
      return
    }
    finally {
      testConnectionConnecting.value = false
    }
  }
  else {
    const params = datasource.value as DatasourceThroughConnectionParameters
    try {
      testConnectionSucceeded.value = false
      testConnectionConnecting.value = true

      await connect(toDSN(driver.value, params, defaultParamsFromDriver(driver.value)))
      // eslint-disable-next-line no-console
      console.debug(await execute('SELECT 1'))

      testConnectionSucceeded.value = true
    }
    catch (err) {
      testConnectionErrored.value = true
      testConnectionErrorMessage.value = (err as Error).message || 'Unknown error occurred while testing connection.'
      console.error('Error testing connection:', testConnectionErrorMessage.value)
      return
    }
    finally {
      testConnectionConnecting.value = false
    }
  }
}
</script>

<template>
  <div h-full max-w-screen-sm flex flex-col>
    <div flex>
      <h2 text="neutral-300/80" mb-1 flex flex-1>
        Edit Datasource
      </h2>
      <RouterLink to="/datasources">
        <div i-ph:x-bold text="neutral-300/80" />
      </RouterLink>
    </div>
    <div mt-3 flex flex-1 flex-col gap-2>
      <Editable v-model="datasourceName" mb-3 font-bold @blur="handleBlur">
        {{ driver }}
      </Editable>
      <div>
        <label flex="~ col gap-2">
          <div>
            <div class="flex items-center gap-1 text-sm font-medium">
              DSN
            </div>
            <div class="text-xs text-neutral-500 dark:text-neutral-400" text-nowrap>
              Data Source Name for the database connection.
            </div>
          </div>
          <Input v-model="DSN" />
        </label>
      </div>
      <div grid="~ cols-[1fr_2px_1fr] rows-[1fr_1fr]" items-center gap-2>
        <div>
          <div class="flex items-center gap-1 text-sm font-medium">
            Host
            <span class="text-red-500">*</span>
          </div>
          <div class="text-xs text-neutral-500 dark:text-neutral-400" text-nowrap>
            Host or IP address of the database server.
          </div>
        </div>
        <div />
        <div>
          <div class="flex items-center gap-1 text-sm font-medium">
            Port
            <span class="text-red-500">*</span>
          </div>
          <div class="text-xs text-neutral-500 dark:text-neutral-400" text-nowrap>
            Port number of the database server.
          </div>
        </div>
        <Input v-model="(datasource as DatasourceThroughConnectionParameters).host" />
        <div translate-y="-1.5px" text="neutral-500" w-fit text-lg font-bold>
          <span>:</span>
        </div>
        <Input v-model="(datasource as DatasourceThroughConnectionParameters).port" />
      </div>
      <div>
        <label flex="~ col gap-2">
          <div>
            <div class="flex items-center gap-1 text-sm font-medium">
              User
              <span class="text-red-500">*</span>
            </div>
            <div class="text-xs text-neutral-500 dark:text-neutral-400" text-nowrap>
              Username for the database connection. This user must have the necessary permissions to access the database.
            </div>
          </div>
          <Input v-model="(datasource as DatasourceThroughConnectionParameters).user" />
        </label>
      </div>
      <div>
        <label flex="~ col gap-2">
          <div>
            <div class="flex items-center gap-1 text-sm font-medium">
              Password
            </div>
            <div class="text-xs text-neutral-500 dark:text-neutral-400" text-nowrap>
              Password for the database user. Ensure this is kept secure and not hard-coded in your application.
            </div>
          </div>
          <Input v-model="(datasource as DatasourceThroughConnectionParameters).password" type="password" />
        </label>
      </div>
      <div>
        <label flex="~ col gap-2">
          <div>
            <div class="flex items-center gap-1 text-sm font-medium">
              Database
            </div>
            <div class="text-xs text-neutral-500 dark:text-neutral-400" text-nowrap>
              Name of the database to connect to. If not specified, the default database for the user will be used.
            </div>
          </div>
          <Input v-model="(datasource as DatasourceThroughConnectionParameters).database" />
        </label>
      </div>
      <div>
        <label flex="~ col gap-2">
          <div>
            <div class="flex items-center gap-1 text-sm font-medium">
              SSL Mode
            </div>
            <div class="text-xs text-neutral-500 dark:text-neutral-400" text-nowrap>
              SSL mode for the connection.
            </div>
          </div>
          <Input v-model="(datasource as DatasourceThroughConnectionParameters).sslmode" />
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
</template>
