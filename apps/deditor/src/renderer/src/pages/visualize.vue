<script setup lang="ts">
import type { EmbedResult } from '@xsai/embed'

import type { ProjectionConfig } from '@/components/plot/ScatterEmbeddings3d.vue'

import { BasicTextarea } from '@proj-airi/ui'
import { embed } from '@xsai/embed'
import { Pane, Splitpanes } from 'splitpanes'
import { onMounted, ref, watch } from 'vue'

import Button from '@/components/basic/Button.vue'
import PaneCard from '@/components/pane/PaneCard.vue'
import ScatterEmbeddings3d from '@/components/plot/ScatterEmbeddings3d.vue'
import ProjectionControls from '@/components/visualizer-controls/ProjectionControls.vue'
import { useXsAITransformers } from '@/composables/use-xsai-transformers'

import embedWorkerURL from '../workers/embed?worker&url'

const wildContext = ref([
  '"nya" means "cat" in Makitoish.',
  '"appi" means "happy" in Makitoish.',
  '"ko" means "little" in Makitoish.',
  '"hwahwa" means "rainy" in Makitoish.',
  '"Makitoish" is a coffee-based language spoken by the Makito.',
  '"English" is a language spoken by many people around the world.',
  '"Japanese" is a language written in kanji, hiragana, and katakana.',
])
const wildContextEmbeddings = ref<EmbedResult[]>([])

const query = ref('What is "nyanyaappi"?')
const queryEmbeddings = ref<EmbedResult>()

const projectionConfig = ref<ProjectionConfig>()

const modelId = ref('Xenova/bge-large-zh')
const { load, embedProvider } = useXsAITransformers(embedWorkerURL, 'embed')

onMounted(async () => {
  await load(modelId.value)
})

// TODO: We should a real `embedMany`
async function embedMany(messages: string[]) {
  const results: EmbedResult[] = []
  for (const message of messages) {
    results.push(await embed({
      ...embedProvider.embed(modelId.value),
      input: message,
    }))
  }
  return results
}

async function updateQueryEmbeddings() {
  queryEmbeddings.value = await embed({
    ...embedProvider.embed(modelId.value),
    input: query.value,
  })
}

watch(wildContext, async (messages) => {
  wildContextEmbeddings.value = await embedMany(messages)
}, { immediate: true })
</script>

<template>
  <div h-full w-full>
    <Splitpanes class="h-full w-full flex gap-0.8 bg-transparent">
      <Pane :min-size="20" :size="70">
        <ScatterEmbeddings3d
          v-if="projectionConfig"
          :embeddings="wildContextEmbeddings"
          :projection="projectionConfig"
          :query-embeddings="queryEmbeddings"
        />
      </Pane>

      <Pane :min-size="20" :size="30">
        <PaneCard flex flex-col gap-6>
          <div flex flex-col items-start gap-4>
            <h2>Query</h2>
            <BasicTextarea
              v-model="query"
              bg="neutral-900/80 hover:neutral-900" border="2 solid neutral-700/20 hover:primary-700/50"
              min-h-30 w-full rounded-lg border-none px-3 py-2 text-sm font-mono outline-none
              transition="colors duration-300 ease-in-out"
            />
            <Button self-end @click="updateQueryEmbeddings">
              Update Query Embeddings
            </Button>
          </div>

          <ProjectionControls @update="projectionConfig = $event" />
        </PaneCard>
      </Pane>
    </Splitpanes>
  </div>
</template>
