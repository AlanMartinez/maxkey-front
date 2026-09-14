<script setup lang="ts">
import type { ProductVariantDto } from '~/types/api'

withDefaults(defineProps<{ variant?: ProductVariantDto; busy?: boolean; addedLabel?: boolean; error?: string | null }>(), {
  variant: undefined,
  busy: false,
  addedLabel: false,
  error: null,
})
defineEmits<{ buy: []; add: [] }>()
</script>

<template>
  <section class="glass flex flex-col gap-3 rounded-2xl p-6" aria-label="Comprar">
    <p v-if="variant" class="mb-2 flex items-baseline gap-2.5">
      <span class="font-display text-3xl font-bold">{{ formatMoney(variant.price, variant.currency) }}</span>
      <span v-if="variant.oldPrice" class="text-white/40 line-through">{{ formatMoney(variant.oldPrice, variant.currency) }}</span>
    </p>
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
