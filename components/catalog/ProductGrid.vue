<script setup lang="ts">
import type { ProductSummary } from '~/types/api'

withDefaults(defineProps<{ products: ProductSummary[]; pending?: boolean }>(), { pending: false })

// Three per row from phones up (cards go compact below `sm`), five on desktop.
const grid = 'grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-5'
</script>

<template>
  <div v-if="pending" :class="grid" aria-busy="true">
    <slot name="loading">
      <Skeleton v-for="n in 10" :key="n" class="h-52 sm:h-64" />
    </slot>
  </div>
  <slot v-else-if="products.length === 0" name="empty" />
  <div v-else :class="grid">
    <ProductCard v-for="product in products" :key="product.id" :product="product" />
  </div>
</template>
