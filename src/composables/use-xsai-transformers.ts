import { createEmbedProvider } from '@xsai-transformers/embed'
import type { LoadOptionProgressCallback, ProgressInfo, ProgressStatusInfo } from '@xsai-transformers/shared/types'

import { onUnmounted, ref } from 'vue'

export function useXsAITransformers(workerURL: string | URL, _type: 'embed') {
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const isError = ref(false)
  const isProcessing = ref(false)

  const loadingItems = ref<(ProgressInfo)[]>([])
  const loadingItemsSet = new Set<string>()
  const overallProgress = ref(0)
const overallTotal = ref(0)

  const embedProvider = createEmbedProvider({ baseURL: `xsai-transformers:///?worker-url=${workerURL}` })

  const onProgress: LoadOptionProgressCallback = async (progress) => {
  if (progress.status === 'initiate') {
    // New file discovered
    if (loadingItemsSet.has(progress.file)) {
      return
    }

    loadingItemsSet.add(progress.file)
    loadingItems.value.push(progress)
    isLoading.value = true
  }
  else if (progress.status === 'progress') {
    // Update progress for an existing file
    const itemIndex = loadingItems.value.findIndex((item: unknown) => {
      return (item as ProgressStatusInfo).file === progress.file
    })

    if (itemIndex >= 0) {
      // Update the item in the array
      loadingItems.value[itemIndex] = progress

      // Now recalculate the overall progress

      // First, calculate the total expected size of all known files
      let newTotalSize = 0
      let newLoadedSize = 0

      for (const item of loadingItems.value) {
        if ('total' in item && item.total) {
          newTotalSize += item.total

          if ('loaded' in item && item.loaded) {
            newLoadedSize += item.loaded
          }
        }
      }

      // Update the total size tracker
      overallTotal.value = newTotalSize

      // Calculate overall progress as a percentage
      if (newTotalSize > 0) {
        overallProgress.value = (newLoadedSize / newTotalSize) * 100
      }
    }
    else {
      // This is a progress update for a file we haven't seen before
      loadingItems.value.push(progress)

      // Recalculate total (same as above)
      let newTotalSize = 0
      let newLoadedSize = 0

      for (const item of loadingItems.value) {
        if ('total' in item && item.total) {
          newTotalSize += item.total

          if ('loaded' in item && item.loaded) {
            newLoadedSize += item.loaded
          }
        }
      }

      overallTotal.value = newTotalSize

      if (newTotalSize > 0) {
        overallProgress.value = (newLoadedSize / newTotalSize) * 100
      }
    }
  }
  else if (progress.status === 'done') {
    const itemIndex = loadingItems.value.findIndex((item: unknown) => {
      return (item as ProgressStatusInfo).file === progress.file
    })

    if (itemIndex >= 0) {
      loadingItems.value[itemIndex] = progress
    }

    const allDone = loadingItems.value.every(item =>
      item.status === 'done' || item.status === 'ready',
    )

    if (allDone) {
      isLoading.value = false
      // Set progress to 100% when done
      overallProgress.value = 100
    }
  }
  else if (progress.status === 'ready') {
    isLoading.value = false
    // Set progress to 100% when ready
    overallProgress.value = 100
  }
}

  async function load(
    modelId: string,
    options?: Parameters<ReturnType<typeof createEmbedProvider>['loadEmbed']>[1],
  ) {
    isLoading.value = true
    isInitialized.value = false

    try {
      await embedProvider.loadEmbed(modelId, { ...options, onProgress })
      isInitialized.value = true
      isError.value = false
    }
    catch {
      isInitialized.value = false
      isError.value = true
    }
    finally {
      isLoading.value = false
    }
  }

  async function process(
    modelId: string,
    options: Parameters<ReturnType<typeof createEmbedProvider>['embed']>[1],
  ) {
    isProcessing.value = true

    try {
      await embedProvider.embed(modelId, options)
      isError.value = false
    }
    catch {
      isError.value = true
    }
    finally {
      isProcessing.value = false
    }
  }

  onUnmounted(() => {
    embedProvider.terminateEmbed()
  })

  return {
    isLoading,
    isInitialized,
    loadingItems,
    overallProgress,
    overallTotal,
    load,
    process,
  }
}
