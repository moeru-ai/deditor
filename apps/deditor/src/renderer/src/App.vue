<script setup lang="ts">
import { useDark } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const isDark = useDark()
const isNavExpanded = ref(false)

onMounted(() => {
  isDark.value = true
})
</script>

<template>
  <main h-full font-sans>
    <div
      class="titlebar"
      top="0" left="0" w="[100dvw]" bg="[rgba(10,10,10,0.5)]"
      fixed z-9999 h-9 flex select-none items-center justify-center text-sm backdrop-blur-lg
    >
      <h1>Deditor</h1>
    </div>
    <!-- Sidebar Nav -->
    <div
      class="nav-container"
      fixed left-0 top-9 z-999 h="[calc(100%-36px)]" overflow-hidden rounded-r-xl
      border="t-1 b-1 r-1 solid neutral-700/50"
      @mouseenter="isNavExpanded = true"
      @mouseleave="isNavExpanded = false"
    >
      <div absolute left--3 top--2 size-20 rounded-full bg="primary-500/80" blur-xl />
      <div
        :class="[isNavExpanded ? 'w-70' : 'w-14']"
        bg="neutral-800/70" h-full flex flex-col gap-6 px-2 py-3
        shadow-lg backdrop-blur-md
        transition="all duration-300 ease-in-out"
      >
        <!-- Nav Header -->
        <div flex items-center gap-2 whitespace-nowrap rounded-xl p-1>
          <div i-ph:vector-three-duotone h-full max-h-8 max-w-8 min-h-8 min-w-8 w-full text-2xl text-primary-400 />
          <div
            v-if="isNavExpanded"
            v-motion
            :initial="{ opacity: 0.3, x: -10 }"
            :enter="{ opacity: 1, x: 0 }"
            whitespace-nowrap text-lg text-primary-400 font-bold
          >
            Deditor
          </div>
        </div>
        <!-- Nav Content -->
        <div flex flex-1 flex-col justify-center gap-2>
          <RouterLink
            to="/"
            flex items-center gap-1 whitespace-nowrap rounded-xl p-1 outline-none
            active-class="bg-neutral-500/20 font-bold"
            transition="all duration-300 ease-in-out"
          >
            <div h-full max-h-8 max-w-8 min-h-8 min-w-8 w-full flex items-center justify-center>
              <div i-ph:chart-line-bold text-lg />
            </div>
            <div
              v-if="isNavExpanded"
              v-motion
              :initial="{ opacity: 0.3, x: -10 }"
              :enter="{ opacity: 1, x: 0 }"
              whitespace-nowrap text-sm
            >
              Overview
            </div>
          </RouterLink>
          <RouterLink
            to="/explore"
            flex items-center gap-1 whitespace-nowrap rounded-xl p-1 outline-none
            active-class="bg-neutral-500/20 font-bold"
            transition="all duration-300 ease-in-out"
          >
            <div h-full max-h-8 max-w-8 min-h-8 min-w-8 w-full flex items-center justify-center>
              <div i-ph:popcorn-fill text-lg />
            </div>
            <div
              v-if="isNavExpanded"
              v-motion
              :initial="{ opacity: 0.3, x: -10 }"
              :enter="{ opacity: 1, x: 0 }"
              whitespace-nowrap text-sm
            >
              Explore
            </div>
          </RouterLink>
          <RouterLink
            to="/datasets"
            flex items-center gap-1 whitespace-nowrap rounded-xl p-1 outline-none
            active-class="bg-neutral-500/20 font-bold"
            transition="all duration-300 ease-in-out"
          >
            <div h-full max-h-8 max-w-8 min-h-8 min-w-8 w-full flex items-center justify-center>
              <div i-ph:database-bold text-lg />
            </div>
            <div
              v-if="isNavExpanded"
              v-motion
              :initial="{ opacity: 0.3, x: -10 }"
              :enter="{ opacity: 1, x: 0 }"
              whitespace-nowrap text-sm
            >
              Datasets
            </div>
          </RouterLink>
        </div>
        <!-- Nav Footer -->
        <button flex items-center gap-1 whitespace-nowrap rounded-xl p-1>
          <div h-full max-h-8 max-w-8 min-h-8 min-w-8 w-full flex items-center justify-center>
            <div v-if="!isDark" i-ph:sun-dim-fill text-lg />
            <div v-else i-ph:moon-fill text-lg />
          </div>
        </button>
      </div>
    </div>
    <div h="[calc(100%-36px)]" relative top-9 ml-14 mr-2 pl-2>
      <RouterView />
    </div>
  </main>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0.5;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

.titlebar {
  app-region: drag;
}
</style>
