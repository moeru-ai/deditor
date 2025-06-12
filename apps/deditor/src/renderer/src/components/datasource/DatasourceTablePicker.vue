<script setup lang="ts">
import type { ConnectionThroughParameters, DatasourceTable } from '@/libs/datasources'
import type { Datasource, DatasourceDriver } from '@/stores'

import { computedAsync } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DATASOURCE_DRIVER_ICONS, DATASOURCE_DRIVER_NAMES, filterPgTables, fullyQualifiedTableName } from '@/libs/datasources'
import { useDatasource, useDatasourceSessionsStore, useDatasourcesStore } from '@/stores'

const datasourceModel = defineModel<Datasource>('datasource', { required: false })
const tableModel = defineModel<DatasourceTable>('table', { required: false })

const datasourcesStore = useDatasourcesStore()
const datasourceSessionsStore = useDatasourceSessionsStore()

const { datasources } = storeToRefs(datasourcesStore)
const { datasource } = useDatasource(computed(() => datasourceModel.value?.id), datasources)

const datasourceGroups = computed(() =>
  datasources.value.reduce((groups, ds) => {
    groups[ds.driver] ??= []
    groups[ds.driver].push(ds)
    return groups
  }, {} as Record<DatasourceDriver, Datasource[]>),
)

const tables = computedAsync(async () => {
  if (!datasource.value) {
    return []
  }

  try {
    return (
      await datasourceSessionsStore
        .listTablesByParameters(datasource.value.driver, datasource.value as ConnectionThroughParameters))
      .map<DatasourceTable>(t => ({ schema: t.table_schema, table: t.table_name }))
      .filter(filterPgTables)
  }
  catch (e) {
    console.error('Failed to fetch tables:', e)
    return []
  }
})

function selectDatasource(ds: Datasource | null) {
  tableModel.value = undefined
  datasourceModel.value = ds ?? undefined
}
</script>

<template>
  <div flex="~ row gap-1" items-center justify-start>
    <div flex="~ row gap-1" items-center justify-center>
      <Select
        :model-value="datasourceModel"
        @update:model-value="selectDatasource($event as Datasource | null)"
      >
        <SelectTrigger>
          <SelectValue flex="~ row gap-2" items-center>
            <div :class="datasourceModel?.driver ? DATASOURCE_DRIVER_ICONS[datasourceModel.driver] : 'i-ph:question'" />
            <div>{{ datasourceModel?.name ?? 'Select datasource' }}</div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <template v-if="Object.keys(datasourceGroups).length > 0">
            <SelectGroup v-for="(group, driver) in datasourceGroups" :key="driver">
              <SelectLabel>{{ DATASOURCE_DRIVER_NAMES[driver] ?? driver }}</SelectLabel>
              <SelectItem v-for="ds in group" :key="ds.id" :value="ds">
                <div flex="~ row gap-2" items-center>
                  <div :class="DATASOURCE_DRIVER_ICONS[ds.driver] ?? 'i-ph:question'" />
                  <div>{{ ds.name }}</div>
                </div>
              </SelectItem>
            </SelectGroup>
          </template>
          <SelectItem v-else value="_" disabled>
            No datasources available
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div i-ph:arrow-right />

    <div flex="~ row gap-1" items-center justify-center>
      <Select v-model="tableModel">
        <SelectTrigger>
          <SelectValue placeholder="Select table" />
        </SelectTrigger>
        <SelectContent>
          <template v-if="tables && tables.length > 0">
            <SelectItem v-for="(t) in tables" :key="fullyQualifiedTableName(t)" :value="t">
              {{ fullyQualifiedTableName(t) }}
            </SelectItem>
          </template>
          <SelectItem v-else value="_" disabled>
            No tables available
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
