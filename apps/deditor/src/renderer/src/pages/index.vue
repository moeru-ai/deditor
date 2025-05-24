<script setup lang="ts">
import { Pane, Splitpanes } from 'splitpanes'

import PaneCard from '../components/ui/pane/PaneCard.vue'
</script>

<template>
  <div h-full w-full>
    <Splitpanes class="flex gap-0.8">
      <Pane :min-size="20" :size="70">
        <PaneCard>
          <h2 flex justify-between>
            <div>
              Overview
            </div>
          </h2>
        </PaneCard>
      </Pane>
      <Pane :min-size="20" :size="30">
        <PaneCard :enter-delay="100">
          <h2 flex justify-between>
            <div>
              Tasks
            </div>
          </h2>
        </PaneCard>
      </Pane>
    </Splitpanes>
  </div>
</template>
