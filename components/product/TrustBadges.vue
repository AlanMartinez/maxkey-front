<script setup lang="ts">
import { DELIVERY, REFUND, SUPPORT } from '~/utils/promises'

// Reassurance lines of the purchase card in the Chekeys mock, sourced from utils/promises.ts.
// `compact` renders them as one row of three stacked icon+label cells (phone/tablet product page);
// the full layout adds the one-line honest detail under each label.
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

const badges = [
  { ...DELIVERY, icon: 'bolt' },
  { ...REFUND, icon: 'shield' },
  { ...SUPPORT, icon: 'clock' },
] as const
</script>

<template>
  <ul class="text-white/60" :class="compact ? 'grid grid-cols-3 gap-x-2 text-[11px] leading-tight' : 'flex flex-col gap-3 text-sm'">
    <li v-for="badge in badges" :key="badge.short" :title="compact ? badge.detail : undefined" class="flex" :class="compact ? 'flex-col items-center gap-1.5 text-center' : 'items-start gap-2.5'">
      <svg class="h-4 w-4 shrink-0 text-success" :class="compact ? '' : 'mt-0.5'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path v-if="badge.icon === 'bolt'" d="M13 3L4 14h6l-1 7 9-11h-6z" />
        <template v-else-if="badge.icon === 'shield'">
          <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z" />
          <path d="M9 12l2 2 4-4" />
        </template>
        <template v-else>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4l3 2" />
        </template>
      </svg>
      <span class="flex flex-col" :class="compact ? 'items-center' : 'gap-0.5'">
        <NuxtLink v-if="badge.href" :to="badge.href" class="transition hover:text-white hover:underline">{{ badge.short }}</NuxtLink>
        <span v-else>{{ badge.short }}</span>
        <span v-if="!compact" class="text-xs text-white/40">{{ badge.detail }}</span>
      </span>
    </li>
  </ul>
</template>
