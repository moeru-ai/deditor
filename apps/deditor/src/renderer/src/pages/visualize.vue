<script setup lang="ts">
import type { EmbedResult } from '@xsai/embed'

import type { ProvidedVisualizerState, VisualizerState } from '@/types/visualizer'

import { embed } from '@xsai/embed'
import { Pane, Splitpanes } from 'splitpanes'
import { onMounted, provide, reactive, ref } from 'vue'

import PaneArea from '@/components/container/PaneArea.vue'
import DataNavigator from '@/components/visualizer/DataNavigator.vue'
import PointVisualizer from '@/components/visualizer/PointVisualizer.vue'
// import ScatterEmbeddings3d from '@/components/plot/ScatterEmbeddings3d.vue'
import ProjectionControls from '@/components/visualizer/ProjectionControls.vue'
// import { useDuckDB } from '@/composables/use-duckdb'
import { useXsAITransformers } from '@/composables/use-xsai-transformers'
import { ProvidedVisualizerStateKey } from '@/constants'
import baseTexts from '@/fixtures/vis-base-texts.json'
import testTexts from '@/fixtures/vis-test-texts.json'
// import Migration0000 from '~/drizzle-migrations/0000_redundant_lady_deathstrike.sql?raw'
// import * as VisualizerSchemas from '~/drizzle/schemas/visualizer'

import embedWorkerURL from '../workers/embed?worker&url'

const state = reactive<VisualizerState>({
  texts: [],
  vectors: [],
  points: [],
  styles: [],
  styleDefinitions: {},
})

provide<ProvidedVisualizerState>(ProvidedVisualizerStateKey, state)

const baseEmbeddings = ref<EmbedResult[]>([])
const testEmbeddings = ref<EmbedResult[]>([])

// const { db } = useDuckDB({ autoConnect: true }, { schema: VisualizerSchemas })

const modelId = ref('mixedbread-ai/mxbai-embed-large-v1')
const { load, embedProvider } = useXsAITransformers(embedWorkerURL, 'embed')

onMounted(async () => {
  state.texts = [
    ...baseTexts,
    ...testTexts,
  ]

  state.styles = [
    ...Array.from({ length: baseTexts.length }).fill('base'),
    ...Array.from({ length: testTexts.length }).fill('test'),
  ]

  // await db.value?.execute(Migration0000)
  // console.log(await db.value?.select().from(VisualizerSchemas.embeddings))

  state.styleDefinitions = {
    base: {
      color: 'rgb(255, 255, 255)',
    },
    test: {
      color: 'rgb(146, 101, 237)',
    },
  }

  await load(modelId.value).then(async () => {
    baseEmbeddings.value = await embedMany(baseTexts)
    testEmbeddings.value = await embedMany(testTexts)

    baseEmbeddings.value.reduce<
      [VisualizerState['vectors'], VisualizerState['styles'], VisualizerState['texts']]
    >(([vectors, styles, texts], result) => {
      vectors.push(result.embedding)
      styles.push('base')
      texts.push(result.input)
      return [vectors, styles, texts]
    }, [state.vectors, state.styles, state.texts])

    testEmbeddings.value.reduce<
      [VisualizerState['vectors'], VisualizerState['styles'], VisualizerState['texts']]
    >(([vectors, styles, texts], result) => {
      vectors.push(result.embedding)
      styles.push('test')
      texts.push(result.input)
      return [vectors, styles, texts]
    }, [state.vectors, state.styles, state.texts])
  })

  // console.log('Base Embeddings:', baseEmbeddings.value)
  // console.log('Test Embeddings:', testEmbeddings.value)
})

// TODO: We should have a real `embedMany`
async function embedMany(messages: string[]) {
  const results: EmbedResult[] = []
  for (const message of messages) {
    console.debug('[embed]', message)
    results.push(await embed({
      ...embedProvider.embed(modelId.value),
      input: message,
    }))
  }
  return results
}
</script>

<template>
  <div h-full w-full>
    <Splitpanes class="h-full w-full flex gap-0.8 bg-transparent">
      <Pane :min-size="20" :size="70">
        <Splitpanes horizontal class="h-full w-full gap-0.8 bg-transparent">
          <Pane :min-size="20" :size="60">
            <PaneArea no-padding no-scroll>
              <PointVisualizer />
            </PaneArea>
          </Pane>

          <Pane :min-size="20" :size="40">
            <PaneArea flex="~ col gap-4">
              <DataNavigator />
            </PaneArea>
          </Pane>
        </Splitpanes>
      </Pane>

      <Pane :min-size="20" :size="30">
        <PaneArea flex flex-col gap-6>
          <ProjectionControls />
        </PaneArea>
      </Pane>
    </Splitpanes>
  </div>
</template>
