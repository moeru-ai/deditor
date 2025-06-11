<script setup lang="ts">
import type { DatasourceDriver } from '@/stores'

import { DatasourceDriverEnum } from '@/libs/datasources'

defineProps<{
  driver?: DatasourceDriver
}>()
</script>

<template>
  <div v-if="driver === DatasourceDriverEnum.Postgres" i-drizzle-orm-icons:postgresql />
  <div v-else-if="driver === DatasourceDriverEnum.MySQL" i-drizzle-orm-icons:mysql />
  <div v-else-if="driver === DatasourceDriverEnum.PGLite" i-drizzle-orm-icons:pglite />
  <div v-else i-ph:question />
</template>
