<script setup lang="ts">
import { findPlatform } from '~/utils/platforms'

const props = withDefaults(defineProps<{ platform: string; size?: 'sm' | 'md' }>(), { size: 'sm' })

const entry = computed(() => findPlatform(props.platform))
const sizes = { sm: 'h-5 w-5', md: 'h-7 w-7' }
</script>

<template>
  <!-- Known platforms render their mark; legacy free-text values keep the old text badge so nothing goes blank. -->
  <img v-if="entry" :src="entry.logo" :alt="entry.value" :title="entry.value" :class="sizes[size]" class="flex-none object-contain opacity-80" />
  <AppBadge v-else tone="accent">{{ platform }}</AppBadge>
</template>
