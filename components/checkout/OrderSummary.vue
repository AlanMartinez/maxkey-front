<script setup lang="ts">
import type { CartLine } from '~/composables/useCart'
import { PLACEHOLDER_IMAGE } from '~/utils/productImage'

defineProps<{ lines: CartLine[]; subtotal: number }>()
</script>

<template>
  <section class="glass flex flex-col gap-4 rounded-2xl p-6">
    <h2 class="text-lg font-semibold">Resumen</h2>
    <ul class="divide-y divide-white/10 text-sm">
      <li v-for="line in lines" :key="line.variantId" class="flex items-center gap-3 py-3">
        <img :src="line.imageUrl || PLACEHOLDER_IMAGE" :alt="line.productName" width="48" height="48" class="h-12 w-12 flex-none rounded-lg object-cover" />
        <span class="min-w-0 flex-1">
          <span class="block truncate font-medium">{{ line.productName }}</span>
          <span class="text-white/60">{{ line.variantName }} · {{ line.quantity }} × {{ formatMoney(line.unitPrice, line.currency) }}</span>
        </span>
        <span class="flex-none">{{ formatMoney(line.unitPrice * line.quantity, line.currency) }}</span>
      </li>
    </ul>
    <p class="flex items-baseline justify-between border-t border-white/10 pt-4 text-sm">
      <span class="text-white/60">Subtotal</span>
      <span class="text-xl font-bold">{{ formatMoney(subtotal, lines[0]?.currency) }}</span>
    </p>
    <p class="text-xs text-white/50">El total se confirma en Mercado Pago.</p>
    <slot />
  </section>
</template>
