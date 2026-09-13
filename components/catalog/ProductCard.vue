<script setup lang="ts">
import type { ProductSummary } from '~/types/api'

const props = defineProps<{ product: ProductSummary }>()

const discount = computed(() =>
  props.product.oldPrice ? Math.round((1 - props.product.fromPrice / props.product.oldPrice) * 100) : 0,
)
</script>

<template>
  <NuxtLink :to="`/product/${product.slug}`" class="glass group flex flex-col overflow-hidden rounded-2xl transition hover:border-accent/50">
    <div class="relative aspect-[4/3] overflow-hidden bg-white/5">
      <img :src="product.imageUrl" :alt="product.name" loading="lazy" class="h-full w-full object-cover transition group-hover:scale-105" />
      <AppBadge v-if="discount > 0" tone="success" class="absolute left-3 top-3">-{{ discount }}%</AppBadge>
    </div>
    <div class="flex flex-1 flex-col gap-2 p-4">
      <AppBadge tone="accent" class="self-start">{{ product.platform }}</AppBadge>
      <h3 class="font-semibold leading-tight">{{ product.name }}</h3>
      <p class="mt-auto flex items-baseline gap-2 text-sm">
        <span class="text-white/50">Desde</span>
        <span class="text-lg font-semibold">{{ formatMoney(product.fromPrice) }}</span>
        <span v-if="product.oldPrice" class="text-white/40 line-through">{{ formatMoney(product.oldPrice) }}</span>
      </p>
    </div>
  </NuxtLink>
</template>
