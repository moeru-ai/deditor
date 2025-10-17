<script setup lang="ts">
import { Pane, Splitpanes } from 'splitpanes'
import { onMounted } from 'vue'

import PaneArea from '@/components/container/PaneArea.vue'
import DataNavigator from '@/components/visualizer/DataNavigator.vue'
import PointVisualizer from '@/components/visualizer/PointVisualizer.vue'
import ProjectionControls from '@/components/visualizer/ProjectionControls.vue'

import { useVisualizerStore } from '@/stores/visualizer'

import Button from '../components/basic/Button.vue'

const visualizerStore = useVisualizerStore()

onMounted(async () => {
  visualizerStore.defineStyle('base', {
    color: 'rgb(255, 255, 255)',
  })
  visualizerStore.defineStyle('test', {
    color: 'rgb(146, 101, 237)',
  })
})
</script>

<template>
  <div h-full w-full>
    <Splitpanes class="h-full w-full flex gap-0.8 bg-transparent">
      <Pane :min-size="20" :size="70">
        <Splitpanes horizontal class="h-full w-full gap-0.8 bg-transparent">
          <Pane :min-size="20" :size="60">
            <PaneArea overflow="hidden!" p="0!" flex items-center justify-center>
              <PointVisualizer />
            </PaneArea>
          </Pane>

          <Pane :min-size="20" :size="40" :enter-delay="200">
            <PaneArea flex="~ col gap-4" items-center justify-center>
              <DataNavigator />
            </PaneArea>
          </Pane>
        </Splitpanes>
      </Pane>

      <Pane :min-size="20" :size="30">
        <div flex="~ col gap-2" h-full w-full>
          <PaneArea flex="~ col grow" :enter-delay="100">
            <ProjectionControls />
          </PaneArea>
          <PaneArea flex="~ col shrink-0" class="h-auto!" :enter-delay="300">
            <Button @click="visualizerStore.visualize">
              Visualize
            </Button>
          </PaneArea>
        </div>
      </Pane>
    </Splitpanes>
  </div>
</template>
