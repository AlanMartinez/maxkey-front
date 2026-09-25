<script setup lang="ts">
import type { ProductVariantDto } from '~/types/api'

const props = withDefaults(
  defineProps<{
    productName: string
    variants?: ProductVariantDto[]
    modelValue?: string | null
    recommendedId?: string | null
    variant?: ProductVariantDto
    busy?: boolean
    addedLabel?: boolean
    error?: string | null
  }>(),
  { variants: () => [], modelValue: null, recommendedId: null, variant: undefined, busy: false, addedLabel: false, error: null },
)
defineEmits<{ 'update:modelValue': [id: string]; buy: []; add: [] }>()

const discount = computed(() =>
  props.variant?.oldPrice ? Math.round((1 - props.variant.price / props.variant.oldPrice) * 100) : 0,
)
</script>

<template>
  <!-- Phone/tablet counterpart of PurchasePanel (G2A pattern): sticks to the bottom edge while the
       page scrolls so amount, price and CTA are always one tap away. Rendered as the LAST child of
       the product article so `sticky` releases it once the footer comes into view — no reserved
       padding, nothing hidden behind it. Negative margins bleed it over the layout gutter. -->
  <section
    class="glass sticky bottom-0 z-30 -mx-4 -mb-6 border-x-0 border-b-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:-mb-8 lg:hidden"
    aria-label="Comprar"
  >
    <!-- Same choice as VariantSelector, as a horizontally scrollable chip row; edge padding keeps the
         first/last chip aligned with the price row while the scroll area itself stays edge-to-edge. -->
    <div
      v-if="variants.length > 1"
      role="group"
      aria-label="Elegí el monto"
      class="mb-3 flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <button
        v-for="option in variants"
        :key="option.id"
        type="button"
        :aria-pressed="option.id === modelValue"
        class="flex shrink-0 flex-col items-start rounded-xl border px-3 py-1.5 text-left text-xs transition"
        :class="option.id === modelValue ? 'border-accent bg-accent/15' : 'border-white/10 bg-surface hover:border-white/30'"
        @click="$emit('update:modelValue', option.id)"
      >
        <span class="font-semibold">{{ option.name }}</span>
        <span class="text-white/60">{{ formatMoney(option.price, option.currency) }}</span>
        <span v-if="option.id === recommendedId" class="text-[10px] font-medium text-accent">Más elegido</span>
      </button>
    </div>

    <div class="flex items-center gap-3 px-4">
      <div class="flex min-w-0 flex-1 flex-col">
        <span class="truncate text-xs text-white/60">{{ productName }}</span>
        <span class="flex flex-wrap items-baseline gap-x-2">
          <span class="font-display text-xl font-bold">{{ variant ? formatMoney(variant.price, variant.currency) : '—' }}</span>
          <AppBadge v-if="discount > 0" :tone="discount > 50 ? 'warning' : 'discount'">-{{ discount }}%</AppBadge>
        </span>
        <span v-if="variant?.oldPrice" class="text-xs text-white/40 line-through">{{ formatMoney(variant.oldPrice, variant.currency) }}</span>
      </div>
      <button
        type="button"
        :aria-label="addedLabel ? 'Agregado' : 'Agregar al carrito'"
        :disabled="!variant || busy"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-white/80 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        :class="addedLabel ? 'border-success/60 text-success' : 'border-white/10'"
        @click="$emit('add')"
      >
        <svg v-if="addedLabel" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
        <CartIcon v-else />
      </button>
      <AppButton class="shrink-0" :disabled="!variant" :loading="busy" @click="$emit('buy')">Comprar ahora</AppButton>
    </div>
    <p v-if="error" class="mt-2 px-4 text-xs text-red-300" role="alert">{{ error }}</p>
  </section>
</template>
