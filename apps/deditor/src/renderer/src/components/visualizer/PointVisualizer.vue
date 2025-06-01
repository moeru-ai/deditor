<script setup lang="ts">
import type { CanvasTexture, SpriteMaterial } from 'three'

import type { ProvidedVisualizerState } from '@/types/visualizer'

import { OrbitControls } from '@tresjs/cientos'
import { TresCanvas } from '@tresjs/core'
import * as THREE from 'three'
import { inject, shallowRef, watch } from 'vue'

import { ProvidedVisualizerStateKey } from '@/constants'

const state = inject<ProvidedVisualizerState>(ProvidedVisualizerStateKey)!

const gl = {
  antialias: true,
  alpha: true,
  shadows: false,
}

const pointMaterials = shallowRef<Record<string, SpriteMaterial>>({})

function onPointClick(point: THREE.Vector3, index: number) {
  console.log(`Clicked point`, point)
}

function onPointHover(point: THREE.Vector3, index: number, isHovered: boolean) {
  console.log(`Point ${index} hovered:`, isHovered ? 'Enter' : 'Leave')
}

function createPointCanvas(color?: string) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  const size = ctx.canvas.width
  const r = size * 0.4

  canvas.width = size
  canvas.height = size

  ctx.clearRect(0, 0, size, size)

  ctx.fillStyle = color || 'rgba(255, 255, 255, 1)'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2)
  ctx.fill()

  return canvas
}

watch(() => state.styleDefinitions, (styles) => {
  // Dispose the materials, textures, and unset references to the underlying canvases
  Object.values(pointMaterials.value).forEach((material) => {
    const texture = material.map as CanvasTexture | undefined
    if (texture) {
      texture.image = null
      texture.dispose()
    }
    material.dispose()
  })

  // Create new materials, textures, and canvases
  pointMaterials.value = Object.entries(styles).reduce((materials, [name, style]) => {
    const texture = new THREE.CanvasTexture(createPointCanvas(style.color))
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter

    materials[name] = new THREE.SpriteMaterial({
      map: texture,
      color: style?.color || '#ffffff',
      transparent: true,
      sizeAttenuation: true,
    })
    return materials
  }, {} as Record<string, SpriteMaterial>)
}, { deep: true, immediate: true })
</script>

<template>
  <div h-full w-full>
    <TresCanvas v-bind="gl">
      <TresPerspectiveCamera :position="[10, 10, 10]" :look-at="[0, 0, 0]" />

      <OrbitControls
        :enable-damping="true"
        :damping-factor="0.05"
        :enable-zoom="true"
        :enable-pan="true"
        :enable-rotate="true"
        :auto-rotate="false"
        :min-distance="1"
        :max-distance="20"
      />

      <TresGridHelper :size="5" :divisions="10" />

      <TresGroup>
        <TresSprite
          v-for="(point, index) in state.points"
          :key="index"
          :position="point"
          :scale="[0.05, 0.05, 0.05]"
          :material="pointMaterials[state.styles[index]]"
          @click="onPointClick(point, index)"
          @pointer-enter="onPointHover(point, index, true)"
          @pointer-leave="onPointHover(point, index, false)"
        />
      </TresGroup>

      <!-- Point Labels -->
      <!-- <TresGroup>
        <TresSprite
          v-for="(point, index) in points"
          :key="`label-${index}`"
          :position="[point.position[0], point.position[1] + 1, point.position[2]]"
          :scale="[2, 1, 1]"
        >
          <TresSpriteMaterial>
            <TresCanvasTexture>
              <canvas ref="canvas" width="256" height="128">
                {{ drawLabel(point.label) }}
              </canvas>
            </TresCanvasTexture>
          </TresSpriteMaterial>
        </TresSprite>
      </TresGroup> -->
    </TresCanvas>
  </div>
</template>
