<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '.'

import { Primitive } from 'reka-ui'

import { buttonVariants } from '.'
import { cn } from '../../../libs/shadcn/utils'

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
    bg="neutral-900/80 hover:neutral-900"
    border="2 solid neutral-700/20 hover:primary-700/50"
    rounded-lg px-3 py-2 text-sm outline-none
    transition="colors duration-300 ease-in-out"
  >
    <slot />
  </Primitive>
</template>
