<script setup lang="ts">
import { Pane, Splitpanes } from 'splitpanes'

import PaneArea from '../components/container/PaneArea.vue'
</script>

<template>
  <div h-full w-full>
    <Splitpanes class="flex gap-0.8">
      <Pane :min-size="20" :size="70">
        <Splitpanes horizontal class="flex gap-0.8">
          <Pane :min-size="20" :size="10">
            <PaneArea>
              <div h-full flex flex-col>
                <h2 text="neutral-300/80" mb-1 flex justify-between>
                  <div>
                    Quick start
                  </div>
                </h2>
                <div h-full flex flex-row items-center gap-2>
                  <RouterLink
                    to="/explore"
                    bg="neutral-800 hover:neutral-700/50"
                    h-full w-full flex flex-col items-center justify-center rounded-lg
                    decoration-none outline-none
                    transition-colors duration-200 ease-in-out
                  >
                    <div
                      text="[24px]" inline-block
                      class="from-40% to-90%"
                      from-neutral-100 to-transparent bg-gradient-to-b bg-clip-text text-transparent
                    >
                      Explore
                    </div>
                    <div i-ph:magnifying-glass-fill h-10 w-10 />
                  </RouterLink>
                  <RouterLink
                    to="/visualize"
                    bg="neutral-800 hover:neutral-700/50"
                    h-full w-full flex flex-col items-center justify-center rounded-lg
                    decoration-none outline-none
                    transition-colors duration-200 ease-in-out
                  >
                    <div
                      text="[24px]" inline-block
                      class="from-40% to-90%"
                      from-neutral-100 to-transparent bg-gradient-to-b bg-clip-text text-transparent
                    >
                      Visualize
                    </div>
                    <div i-ph:chart-scatter-bold h-10 w-10 />
                  </RouterLink>
                  <RouterLink
                    to="/inspect"
                    bg="neutral-800 hover:neutral-700/50"
                    h-full w-full flex flex-col items-center justify-center rounded-lg
                    decoration-none outline-none
                    transition-colors duration-200 ease-in-out
                  >
                    <div
                      text="[24px]" inline-block
                      class="from-40% to-90%"
                      from-neutral-100 to-transparent bg-gradient-to-b bg-clip-text text-transparent
                    >
                      Inspect
                    </div>
                    <div i-ph:microscope-duotone h-10 w-10 />
                  </RouterLink>
                </div>
              </div>
            </PaneArea>
          </Pane>
          <Pane :min-size="20" :size="90">
            <PaneArea>
              <h2 text="neutral-300/80" mb-1 flex justify-between>
                <div>
                  Overview
                </div>
              </h2>
            </PaneArea>
          </Pane>
        </Splitpanes>
      </Pane>
      <Pane :min-size="20" :size="30">
        <PaneArea :enter-delay="100">
          <h2 text="neutral-300/80" mb-1 flex justify-between>
            <div>
              Tasks
            </div>
          </h2>
        </PaneArea>
      </Pane>
    </Splitpanes>
  </div>
</template>
