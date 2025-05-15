<script setup lang="ts">
import { BasicTextarea } from '@proj-airi/ui'
import { Pane, Splitpanes } from 'splitpanes'
import { computed, ref } from 'vue'

import Chat from '../components/table/Chat.vue'

const input = ref('[{"question": "What is the capital of France?", "answer": "Paris"}, {"question": "What is the capital of Germany?", "answer": "Berlin"}]')
const data = computed<Record<string, unknown>[]>(() => {
  if (!input.value)
    return {}

  try {
    return JSON.parse(input.value)
  }
  catch (error) {
    console.error(error)
    return {}
  }
})
</script>

<template>
  <div h-full w-full>
    <Splitpanes class="flex gap-1">
      <Pane :min-size="20" :size="60">
        <Splitpanes horizontal class="flex gap-1">
          <Pane min-size="20" :size="40">
            <div
              v-motion
              :initial="{ opacity: 0, y: 16 }"
              :enter="{ opacity: 1, y: 0 }"
              bg="neutral-800/90"
              h-full w-full flex flex-col gap-2
              rounded-2xl
              px-4 py-3
              backdrop-blur-sm
              transition="all duration-300 ease-in-out"
            >
              <h2 text="neutral-300/80" mb-1 flex justify-between>
                <div>
                  Query From
                </div>
              </h2>
              <div flex flex-col gap-2 text-sm>
                <div bg="neutral-700/50 hover:neutral-700/80" border="2 solid neutral-700/20 hover:neutral-700/50" transition="all duration-300 ease-in-out" flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2>
                  <div i-ph:folder-dotted-fill />
                  <div>One-Time</div>
                </div>
                <div bg="neutral-700/50 hover:neutral-700/80" border="2 solid neutral-700/20 hover:neutral-700/50" transition="all duration-300 ease-in-out" flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2>
                  <div i-ph:folder-notch-plus-fill />
                  <div>Files</div>
                </div>
                <div bg="neutral-700/50 hover:neutral-700/80" border="2 solid neutral-700/20 hover:neutral-700/50" transition="all duration-300 ease-in-out" flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2>
                  <div i-ph:database-fill />
                  <div>Datasets</div>
                </div>
              </div>
              <div h-full max-h-full flex flex-col gap-2 overflow-y-scroll rounded-lg>
                <BasicTextarea
                  v-model="input"
                  placeholder="请输入"
                  bg="neutral-900/80 hover:neutral-900" border="2 solid neutral-700/20 hover:primary-700/50"
                  min-h-30 border-none px-3 py-2 text-sm outline-none rounded-lg
                  transition="colors duration-300 ease-in-out"
                />
              </div>
            </div>
          </Pane>
          <Pane min-size="20" :size="60">
            <div
              v-motion
              :initial="{ opacity: 0, y: 16 }"
              :enter="{ opacity: 1, y: 0, transition: { delay: 100 } }"
              bg="neutral-800/90"
              h-full w-full flex flex-col gap-2
              rounded-2xl
              px-4 py-3
              backdrop-blur-sm
              transition="all duration-300 ease-in-out"
            >
              <h2 text="neutral-300/80" mb-1 flex justify-between>
                <div>
                  Results
                </div>
              </h2>
              <Chat :data="data" />
            </div>
          </Pane>
        </Splitpanes>
      </Pane>
      <Pane :min-size="20" :size="40">
        <div
          v-motion
          :initial="{ opacity: 0, y: 16 }"
          :enter="{ opacity: 1, y: 0, transition: { delay: 200 } }"
          bg="neutral-800/90"
          h-full w-full flex flex-col gap-2 overflow-y-scroll rounded-2xl px-4 py-3 backdrop-blur-sm
          transition="all duration-300 ease-in-out"
        >
          <h2 text="neutral-300/80" mb-1 flex justify-between>
            <div>
              Chat
            </div>
          </h2>
          <div flex flex-col gap-2>
            <div v-for="(value, key) in data" :key="key">
              <template v-if="typeof value === 'object'">
                <template v-if="'question' in value">
                  <div>
                    <div
                      bg="neutral-900/50" transition="all duration-300 ease-in-out"
                      mb-2 mr-6 self-end
                      rounded-lg p-3 text-white
                    >
                      {{ value.question }}
                    </div>
                    <div
                      mb-2 ml-6 self-start
                      rounded-lg
                      bg="primary-900/50" transition="all duration-300 ease-in-out"
                      p-3
                      text-white
                    >
                      <div whitespace-pre-wrap>
                        {{ value.answer }}
                      </div>
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>
        </div>
      </Pane>
    </Splitpanes>
  </div>
</template>
