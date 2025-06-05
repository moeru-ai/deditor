<script setup lang="ts">
import { Pane, Splitpanes } from 'splitpanes'
</script>

<template>
  <div h-full w-full>
    <Splitpanes class="h-full w-full flex gap-0.8 bg-transparent">
      <Pane :min-size="20" :size="70">
        <Splitpanes horizontal class="h-full w-full gap-0.8 bg-transparent">
          <Pane :min-size="20" :size="60">
            <PaneArea no-padding no-scroll>
              Visualizer
            </PaneArea>
          </Pane>

          <Pane :min-size="20" :size="40">
            <PaneArea flex="~ col gap-4">
              Navigator
            </PaneArea>
          </Pane>
        </Splitpanes>
      </Pane>

      <Pane :min-size="20" :size="30">
        <PaneArea flex flex-col gap-6>
          Controls
        </PaneArea>
      </Pane>
    </Splitpanes>
  </div>
</template>
