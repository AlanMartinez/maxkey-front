<script setup lang="ts">
import { findPlatform } from '~/utils/platforms'

const props = withDefaults(defineProps<{ platform: string; size?: 'sm' | 'md' }>(), { size: 'sm' })

const entry = computed(() => findPlatform(props.platform))
const badgeSizes = { sm: 'h-5 w-5', md: 'h-8 w-8 lg:h-9 lg:w-9' }
const glyphSizes = { sm: 'h-3 w-3', md: 'h-4.5 w-4.5' }
</script>

<template>
  <!-- Known platforms render a circular badge: the real app icon when we have one, otherwise the
       brand's official color behind the flat monochrome mark. Legacy free-text values keep the old
       text badge so nothing goes blank. -->
  <span
    v-if="entry"
    class="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10"
    :class="badgeSizes[size]"
    :style="{ backgroundColor: entry.colorLogo ? undefined : entry.color ?? 'rgba(255,255,255,0.05)' }"
  >
    <img
      :src="entry.colorLogo ?? entry.logo"
      :alt="entry.value"
      :title="entry.value"
      :class="entry.colorLogo ? 'h-full w-full object-contain' : [glyphSizes[size], 'object-contain']"
    />
  </span>
  <AppBadge v-else tone="accent">{{ platform }}</AppBadge>
</template>
