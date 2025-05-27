<script setup lang="ts">
import type { Datasource, DatasourceThroughConnectionParameters, Driver } from '../../../../../stores/datasources'

import { nanoid } from '@deditor-app/shared'
import { useRefHistory } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import Editable from '../../../../../components/basic/Editable.vue'
import { Input } from '../../../../../components/ui/input'
import { useDatasourcesStore } from '../../../../../stores/datasources'

const route = useRoute()

const id = computed(() => (route.params as any).id as string)
const driver = computed<Driver>(() => (route.params as any).driver)

const datasourcesStore = useDatasourcesStore()

function datasourceFromId() {
  const datasource = datasourcesStore.datasources.find(ds => ds.id === id.value)
  if (typeof datasource === 'undefined') {
    const newDatasource = { id: nanoid(), name: 'New Datasource', driver: driver.value, connectionString: '' } satisfies Datasource
    datasourcesStore.datasources.push(newDatasource)

    return newDatasource
  }

  return datasource
}

const datasource = ref(datasourceFromId())
const datasourceName = ref(datasource.value.name || 'New Datasource')
const { undo, clear } = useRefHistory(datasourceName)

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
</script>

<template>
  <div>
    <div flex>
      <Editable v-model="datasourceName" text="neutral-300/80" mb-1 flex flex-1 @blur="handleBlur">
        {{ driver }}
      </Editable>
      <RouterLink to="/datasources">
        <div i-ph:x-bold text="neutral-300/80" />
      </RouterLink>
    </div>
    <div mt-10 flex flex-col gap-2>
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
            Port number of the database server. Default is usually 5432 for PostgreSQL, 3306 for MySQL, etc.
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
          <Input v-model="(datasource as DatasourceThroughConnectionParameters).password" />
        </label>
      </div>
    </div>
  </div>
</template>
