<script setup lang="ts">
import type { CanvasTexture, SpriteMaterial } from 'three'

import { OrbitControls } from '@tresjs/cientos'
import { TresCanvas } from '@tresjs/core'
import * as THREE from 'three'
import { shallowRef, watch } from 'vue'

import { useVisualizerStore } from '@/stores/visualizer'

const visualizerStore = useVisualizerStore()

const gl = {
  antialias: true,
  alpha: true,
  shadows: false,
}

const pointMaterials = shallowRef<Record<string, SpriteMaterial>>({})

function onPointClick(_point: THREE.Vector3, _index: number) {
  // Stub
}

function onPointHover(_point: THREE.Vector3, _index: number, _isHovered: boolean) {
  // Stub
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

function createPointTexture(color?: string) {
  const texture = new THREE.CanvasTexture(createPointCanvas(color))
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  return texture
}

function createPointMaterial(color?: string) {
  return new THREE.SpriteMaterial({
    map: createPointTexture(color),
    color: color || '#ffffff',
    transparent: true,
    sizeAttenuation: true,
  })
}

const defaultPointMaterial = createPointMaterial()

watch(visualizerStore.styleDefinitions, (styles) => {
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
    materials[name] = createPointMaterial(style.color)
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
          v-for="(point, index) in visualizerStore.points"
          :key="index"
          :position="point"
          :scale="[0.05, 0.05, 0.05]"
          :material="pointMaterials[visualizerStore.styles[index]] ?? defaultPointMaterial"
          @click="onPointClick(point, index)"
          @pointer-enter="onPointHover(point, index, true)"
          @pointer-leave="onPointHover(point, index, false)"
        />
      </TresGroup>
    </TresCanvas>
  </div>
</template>
