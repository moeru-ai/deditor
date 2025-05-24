<script setup lang="ts">
import * as Plotly from 'plotly.js'
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'

type ShiftParameters<T extends (...args: any) => any> = Parameters<T> extends [infer _, ...infer B] ? B : never

const props = defineProps<{
  setupData?: Plotly.Data[]
  setupLayout?: Partial<Plotly.Layout>
}>()

const chartRef = useTemplateRef('chart')
const plot = shallowRef<Plotly.PlotlyHTMLElement>()
const resizeObserver = shallowRef<ResizeObserver>()

onMounted(async () => {
  await new Promise(resolve => setTimeout(resolve, 1000))

  plot.value = await Plotly.newPlot(chartRef.value!, props.setupData ?? [], props.setupLayout)

  resizeObserver.value = new ResizeObserver(() => {
    if (plot.value) {
      Plotly.Plots.resize(plot.value)
    }
  })
  resizeObserver.value.observe(chartRef.value!)
})

onBeforeUnmount(() => {
  resizeObserver.value?.disconnect()
})

defineExpose({
  restyle: (...args: ShiftParameters<typeof Plotly.restyle>) => {
    Plotly.restyle(chartRef.value!, ...args)
  },
  update: (...args: ShiftParameters<typeof Plotly.update>) => {
    Plotly.update(chartRef.value!, ...args)
  },
  react: (...args: ShiftParameters<typeof Plotly.react>) => {
    Plotly.react(chartRef.value!, ...args)
  },
})
</script>

<template>
  <div ref="chart" class="h-full w-full [&_svg]:display-inherit" />
</template>
