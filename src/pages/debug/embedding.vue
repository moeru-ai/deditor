<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import Progress from '../../components/basic/Progress.vue'
import { useDuckDB } from '../../composables/use-duckdb'
import { useXsAITransformers } from '../../composables/use-xsai-transformers'
import embedWorkerURL from '../../workers/embed?worker&url'

const modelId = ref('Xenova/bge-large-zh')
const { db } = useDuckDB({ autoConnect: true })
const { loadingItems, load, isLoading, overallProgress } = useXsAITransformers(embedWorkerURL, 'embed')
watch(db, db => db?.execute(`INSTALL vss; LOAD vss;`))

onMounted(async () => await load(modelId.value))
</script>

<template>
  <div
    v-if="loadingItems.length > 0 && isLoading"
    h-5 w-full
  >
    <Progress :percentage="Math.min(100, overallProgress)" />
  </div>
</template>
