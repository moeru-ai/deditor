<script setup lang="ts">
import { useRefHistory } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import Editable from '../../../../../components/basic/Editable.vue'
import { useDatasourcesStore } from '../../../../../stores/datasources'

const route = useRoute()

const id = computed(() => (route.params as any).id as string)
const driver = computed(() => (route.params as any).driver as string)

const datasourcesStore = useDatasourcesStore()

function datasourceNameFromId() {
  const datasource = datasourcesStore.datasources.find(ds => ds.id === id.value)
  return datasource ? datasource.name : ''
}

const datasourceName = ref(datasourceNameFromId())
const { undo, clear } = useRefHistory(datasourceName)

watch([id, driver], () => {
  clear()
  datasourceName.value = datasourceNameFromId()
})

watch(datasourceName, (newName) => {
  const datasource = datasourcesStore.datasources.find(ds => ds.id === id.value)
  if (datasource) {
    datasource.name = newName
  }
})

function handleBlur() {
  if (!datasourceName.value) {
    undo()
  }
}
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
  </div>
</template>
