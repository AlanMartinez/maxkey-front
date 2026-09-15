<script setup lang="ts">
import type { AdminCurrency, AdminVariant, UpdateProductVariantRequest } from '~/types/api'

const props = defineProps<{ variant: AdminVariant; saving: boolean }>()
const emit = defineEmits<{ save: [body: UpdateProductVariantRequest]; delete: [] }>()

const currencies: AdminCurrency[] = ['ARS', 'USD']

// Price/discount%/currency/isActive are editable here; the PUT still needs the full record, so
// region/edition/sortOrder travel through unchanged. oldPrice is backend-computed — never sent back.
const price = ref(props.variant.price)
const discountPercentage = ref(props.variant.discountPercentage)
const currency = ref<AdminCurrency>(props.variant.currency)
const isActive = ref(props.variant.isActive)

watch(() => props.variant, (variant) => {
  price.value = variant.price
  discountPercentage.value = variant.discountPercentage
  currency.value = variant.currency
  isActive.value = variant.isActive
})

function submit() {
  emit('save', {
    price: price.value,
    discountPercentage: discountPercentage.value || undefined,
    currency: currency.value,
    region: props.variant.region,
    edition: props.variant.edition,
    sortOrder: props.variant.sortOrder,
    isActive: isActive.value,
  })
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm" :class="{ 'opacity-50': !variant.isActive }">
    <span class="min-w-0 flex-1 truncate text-white/70">{{ [variant.region, variant.edition].filter(Boolean).join(' · ') || 'Variante' }}</span>

    <label class="flex items-center gap-2">
      <span class="sr-only">Precio</span>
      <input v-model.number="price" type="number" min="0" step="0.01" class="h-9 w-28 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
    </label>

    <label class="flex items-center gap-2">
      <span class="sr-only">Descuento %</span>
      <input
        v-model.number="discountPercentage"
        type="number"
        min="0"
        max="99"
        step="1"
        placeholder="% off"
        class="h-9 w-20 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent"
      />
    </label>
    <span v-if="variant.oldPrice" class="text-xs text-white/40 line-through">{{ formatMoney(variant.oldPrice, variant.currency) }}</span>

    <label class="flex items-center gap-2">
      <span class="sr-only">Moneda</span>
      <select v-model="currency" class="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent">
        <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
      </select>
    </label>

    <label class="flex items-center gap-2 text-xs text-white/70">
      <input v-model="isActive" type="checkbox" class="h-4 w-4 rounded border-white/20 bg-white/5" />
      Activa
    </label>

    <AppButton type="button" variant="ghost" size="sm" :loading="saving" @click="submit()">Guardar</AppButton>
    <AppButton type="button" variant="ghost" size="sm" class="text-red-300 hover:border-red-400/60 hover:text-red-300" :loading="saving" @click="emit('delete')">
      Eliminar
    </AppButton>
  </div>
</template>
