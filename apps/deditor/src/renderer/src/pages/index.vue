<script setup lang="ts">
import { Pane, Splitpanes } from 'splitpanes'

import PaneArea from '../components/container/PaneArea.vue'
</script>

<template>
  <div h-full w-full>
    <Splitpanes class="flex gap-0.8">
      <Pane :min-size="20" :size="70">
        <PaneArea>
          <h2 flex justify-between>
            <div>
              Overview
            </div>
          </h2>
        </PaneArea>
      </Pane>
      <Pane :min-size="20" :size="30">
        <PaneArea :enter-delay="100">
          <h2 flex justify-between>
            <div>
              Tasks
            </div>
          </h2>
        </PaneArea>
      </Pane>
    </Splitpanes>
  </div>
</template>
