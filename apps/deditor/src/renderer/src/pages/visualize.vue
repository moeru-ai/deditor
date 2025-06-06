<script setup lang="ts">
import { Pane, Splitpanes } from 'splitpanes'
import { onMounted } from 'vue'

import PaneArea from '@/components/container/PaneArea.vue'
import DataNavigator from '@/components/visualizer/DataNavigator.vue'
import PointVisualizer from '@/components/visualizer/PointVisualizer.vue'
import ProjectionControls from '@/components/visualizer/ProjectionControls.vue'
import { useVisualizerStore } from '@/stores/visualizer'

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

          <Pane :min-size="20" :size="40">
            <PaneArea flex="~ col gap-4" items-center justify-center>
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
