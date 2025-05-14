<script setup lang="ts">
import { Pane, Splitpanes } from 'splitpanes'
</script>

<template>
  <div h-full w-full>
    <Splitpanes class="flex gap-1">
      <Pane :min-size="20" :size="70">
        <div
          v-motion
          :initial="{ opacity: 0, y: 16 }"
          :enter="{ opacity: 1, y: 0 }"
          bg="neutral-800/90" h-full w-full rounded-2xl px-4 py-3 backdrop-blur-sm
          transition="all duration-300 ease-in-out"
        >
          <h2 flex justify-between>
            <div>
              Overview
            </div>
          </h2>
        </div>
      </Pane>
      <Pane :min-size="20" :size="30">
        <div
          v-motion
          :initial="{ opacity: 0, y: 16 }"
          :enter="{ opacity: 1, y: 0, transition: { delay: 50 } }"
          bg="neutral-800/90" h-full w-full rounded-2xl px-4 py-3 backdrop-blur-sm
          transition="all duration-300 ease-in-out"
        >
          <h2 flex justify-between>
            <div>
              Tasks
            </div>
          </h2>
        </div>
      </Pane>
    </Splitpanes>
  </div>
</template>
