<script setup lang="ts">
import type { ProductVariantDto } from '~/types/api'

const props = withDefaults(defineProps<{ variant?: ProductVariantDto; busy?: boolean; addedLabel?: boolean; error?: string | null }>(), {
  variant: undefined,
  busy: false,
  addedLabel: false,
  error: null,
})
defineEmits<{ buy: []; add: [] }>()

const discount = computed(() =>
  props.variant?.oldPrice ? Math.round((1 - props.variant.price / props.variant.oldPrice) * 100) : 0,
)
</script>

<template>
  <section class="glass flex flex-col gap-3 rounded-2xl p-6" aria-label="Comprar">
    <div v-if="variant" class="mb-2 flex flex-col gap-1">
      <p class="flex flex-wrap items-baseline gap-2.5">
        <span class="font-display text-3xl font-bold">{{ formatMoney(variant.price, variant.currency) }}</span>
        <AppBadge v-if="discount > 0" :tone="discount > 50 ? 'warning' : 'discount'">-{{ discount }}%</AppBadge>
      </p>
      <p v-if="variant.oldPrice" class="text-white/40 line-through">{{ formatMoney(variant.oldPrice, variant.currency) }}</p>
    </div>
    <AppButton size="lg" class="w-full" :disabled="!variant" :loading="busy" @click="$emit('buy')">Comprar ahora</AppButton>
    <AppButton variant="ghost" size="lg" class="w-full" :disabled="!variant || busy" @click="$emit('add')">
      <CartIcon />
      {{ addedLabel ? 'Agregado ✓' : 'Agregar al carrito' }}
    </AppButton>
    <p v-if="error" class="text-sm text-red-300" role="alert">{{ error }}</p>
    <div class="mt-3 border-t border-white/10 pt-5">
      <TrustBadges />
    </div>
  </section>
</template>
