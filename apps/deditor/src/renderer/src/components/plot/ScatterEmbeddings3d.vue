<script setup lang="ts">
import type { EmbedResult } from '@xsai/embed'

import type { PCAProjectionConfig, TSNEProjectionConfig } from '../../utils/data-projection'

import { useMotions } from '@vueuse/motion'
import { ref, useTemplateRef, watch } from 'vue'

import { projectPCA, projectTSNE } from '../../utils/data-projection'
import Plotly from './Plotly.vue'

export type ProjectionConfig = {
  algorithm: 'pca'
  pcaConfig: PCAProjectionConfig
} | {
  algorithm: 'tsne'
  tsneConfig: TSNEProjectionConfig
}

const props = defineProps<{
  embeddings?: EmbedResult[]
  projection: ProjectionConfig
  queryEmbeddings?: EmbedResult
}>()

const plotRef = useTemplateRef('plot')

const zeroLineColor = 'rgba(255, 255, 255, 1)'
const zeroLineWidth = 2

const textSize = 12
const markerSize = 4
const markerColor = 'rgb(255, 255, 255)'
const textFamily = '"DM Mono",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace' // FIXME: "DM Mono" actually doesn't work here
const gridColor = 'rgb(128, 128, 128)'
const spikeColor = 'rgb(128, 128, 128)'
const spikeThickness = 2
const textColor = 'rgb(255, 255, 255)'
const hoverTemplate = '%{text}<br>%{x}, %{y}, %{z}<extra></extra>'
const isPlotUpdating = ref(false)

const queryColor = 'rgb(181, 144, 255)'

const motions = useMotions()

function processEmbedResults(embedResults?: EmbedResult[], queryEmbedResult?: EmbedResult): [Plotly.Data[], Plotly.Layout] {
  const xyz: [number[], number[], number[]] = [[], [], []]

  const results = [
    ...(embedResults ?? []),
    ...(queryEmbedResult ? [queryEmbedResult] : []),
  ]

  if (results.length) {
    switch (props.projection.algorithm) {
      case 'pca':
        projectPCA(results.map(e => e.embedding), props.projection.pcaConfig).forEach((v) => {
          xyz[0].push(v[0])
          xyz[1].push(v[1])
          xyz[2].push(v[2])
        })
        break
      case 'tsne':
        projectTSNE(results.map(e => e.embedding), props.projection.tsneConfig).forEach((v) => {
          xyz[0].push(v[0])
          xyz[1].push(v[1])
          xyz[2].push(v[2])
        })
        break
      default:
        throw new Error('Unreachable')
    }
  }

  const traceSetup = {
    marker: {
      size: markerSize,
      color: markerColor,
    },
    hoverlabel: {
      font: {
        family: textFamily,
      },
    },
    textfont: {
      family: textFamily,
      size: textSize,
      color: textColor,
    },
    hovertemplate: hoverTemplate,
    mode: 'text+markers',
    type: 'scatter3d',
  }

  return [
    [
      {
        ...traceSetup,
        text: results.slice(0, queryEmbedResult ? -1 : undefined).map(e => e.input),
        x: xyz[0].slice(0, queryEmbedResult ? -1 : undefined),
        y: xyz[1].slice(0, queryEmbedResult ? -1 : undefined),
        z: xyz[2].slice(0, queryEmbedResult ? -1 : undefined),
      } as Plotly.Data,
      ...(queryEmbedResult
        ? [
            {
              ...traceSetup,
              text: results.slice(-1).map(e => e.input),
              marker: {
                ...traceSetup.marker,
                color: queryColor,
              },
              textfont: {
                ...traceSetup.textfont,
                color: queryColor
              },
              x: xyz[0].slice(-1),
              y: xyz[1].slice(-1),
              z: xyz[2].slice(-1),
            } as Plotly.Data,
          ]
        : []),
    ],
    {
      autosize: true,
      font: {
        family: textFamily,
        size: 12,
      },
      hoverlabel: {
        bgcolor: 'transparent',
        font: {
          family: textFamily,
        },
      },
      margin: {
        l: 0,
        r: 0,
        t: 0,
        b: 0,
      },
      modebar: {
        bgcolor: 'transparent',
        color: 'rgba(0, 0, 0, 0.5)',
        orientation: 'h',
        remove: [
          'resetCameraDefault3d',
          'resetCameraLastSave3d',
        ],
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'black',
      scene: {
        aspectmode: 'cube',
        camera: {
          center: {
            x: 0,
            y: 0,
            z: 0,
          },
          eye: {
            x: 1.25,
            y: 1.25,
            z: 1.25,
          },
          up: {
            x: 0,
            y: 0,
            z: 1,
          },
        },
        xaxis: {
          color: textColor,
          gridcolor: gridColor,
          spikecolor: spikeColor,
          spikesides: false,
          spikethickness: spikeThickness,
          zerolinecolor: zeroLineColor,
          zerolinewidth: zeroLineWidth,
        },
        yaxis: {
          color: textColor,
          gridcolor: gridColor,
          spikecolor: spikeColor,
          spikesides: false,
          spikethickness: spikeThickness,
          zerolinecolor: zeroLineColor,
          zerolinewidth: zeroLineWidth,
        },
        zaxis: {
          color: textColor,
          gridcolor: gridColor,
          spikecolor: spikeColor,
          spikesides: false,
          spikethickness: spikeThickness,
          zerolinecolor: zeroLineColor,
          zerolinewidth: zeroLineWidth,
        },
      }
    } as Plotly.Layout
  ]
}

const [setupData, setupLayout] = processEmbedResults()

// TODO: For now, we update the plot whenever the embeddings or projection changes. This should be done neatly in the future.
watch([() => props.embeddings, () => props.queryEmbeddings, () => props.projection], async ([embeddings, queryEmbeddings, _]) => {
  const [data, layout] = processEmbedResults(embeddings, queryEmbeddings)
  plotRef.value?.react(data, layout)
  console.log(layout)

  isPlotUpdating.value = false
}, { immediate: true, deep: true })
</script>

<template>
  <div relative h-full w-full>
    <Transition :css="false" @leave="(_, done) => motions.plotMaskingOverlay.leave(done)">
      <div
        v-if="isPlotUpdating"
        v-motion="'plotMaskingOverlay'"
        absolute z-10
        h-full w-full
        flex items-center justify-center
        text-neutral-300 backdrop-blur-sm
        :initial="{ opacity: 0 }"
        :enter="{ opacity: 1 }"
      >
        Updating…
      </div>
    </Transition>

    <div h-full w-full>
      <Plotly ref="plot" :setup-data="setupData" :setup-layout="setupLayout" />
    </div>
  </div>
</template>
