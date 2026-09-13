<script setup lang="ts">
import type { ProductSummary } from '~/types/api'

withDefaults(defineProps<{ products: ProductSummary[]; pending?: boolean }>(), { pending: false })

const grid = 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'
</script>

<template>
  <div v-if="pending" :class="grid" aria-busy="true">
    <slot name="loading">
      <Skeleton v-for="n in 6" :key="n" class="h-72" />
    </slot>
  </div>
  <slot v-else-if="products.length === 0" name="empty" />
  <div v-else :class="grid">
    <ProductCard v-for="product in products" :key="product.id" :product="product" />
  </div>
</template>
