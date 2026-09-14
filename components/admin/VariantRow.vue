<script setup lang="ts">
import type { AdminVariant, UpdateProductVariantRequest } from '~/types/api'

const props = defineProps<{ variant: AdminVariant; saving: boolean }>()
const emit = defineEmits<{ save: [body: UpdateProductVariantRequest] }>()

// Only price and isActive are editable here (design D3 contract table keeps the rest); the PUT
// still needs the full record, so the untouched fields travel through unchanged.
const price = ref(props.variant.price)
const isActive = ref(props.variant.isActive)

watch(() => props.variant, (variant) => {
  price.value = variant.price
  isActive.value = variant.isActive
})

function submit() {
  emit('save', {
    price: price.value,
    oldPrice: props.variant.oldPrice,
    currency: props.variant.currency,
    region: props.variant.region,
    edition: props.variant.edition,
    sortOrder: props.variant.sortOrder,
    isActive: isActive.value,
  })
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
    <span class="min-w-0 flex-1 truncate text-white/70">{{ [variant.region, variant.edition].filter(Boolean).join(' · ') || 'Variante' }}</span>
    <label class="flex items-center gap-2">
      <span class="sr-only">Precio</span>
      <input v-model.number="price" type="number" min="0" step="0.01" class="h-9 w-28 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
    </label>
    <label class="flex items-center gap-2 text-xs text-white/70">
      <input v-model="isActive" type="checkbox" class="h-4 w-4 rounded border-white/20 bg-white/5" />
      Activa
    </label>
    <AppButton type="button" variant="ghost" size="sm" :loading="saving" @click="submit()">Guardar</AppButton>
  </div>
</template>
