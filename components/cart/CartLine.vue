<script setup lang="ts">
import { MAX_QUANTITY, MIN_QUANTITY, type CartLine } from '~/composables/useCart'

const props = defineProps<{ line: CartLine }>()
const emit = defineEmits<{ 'update:quantity': [quantity: number]; remove: [] }>()

const stepClass = 'h-8 w-8 rounded-lg border border-white/10 text-lg leading-none transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40'
</script>

<template>
  <li class="flex gap-3 py-4">
    <img v-if="line.imageUrl" :src="line.imageUrl" :alt="line.productName" class="h-16 w-16 flex-none rounded-xl object-cover" />
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <NuxtLink :to="`/product/${line.productSlug}`" class="truncate text-sm font-semibold hover:text-accent">{{ line.productName }}</NuxtLink>
      <p class="truncate text-xs text-white/60">{{ line.variantName }}</p>
      <p class="text-sm text-white/80">{{ formatMoney(line.unitPrice, line.currency) }}</p>
      <div class="mt-1 flex items-center gap-2" role="group" aria-label="Cantidad">
        <button type="button" :class="stepClass" aria-label="Restar" :disabled="line.quantity <= MIN_QUANTITY" @click="emit('update:quantity', props.line.quantity - 1)">−</button>
        <span class="w-6 text-center text-sm font-medium" aria-live="polite">{{ line.quantity }}</span>
        <button type="button" :class="stepClass" aria-label="Sumar" :disabled="line.quantity >= MAX_QUANTITY" @click="emit('update:quantity', props.line.quantity + 1)">+</button>
        <button type="button" class="ml-auto text-xs text-white/50 transition hover:text-red-300" @click="emit('remove')">Quitar</button>
      </div>
    </div>
  </li>
</template>
