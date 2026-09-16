<script setup lang="ts">
import type { AdminCurrency, AdminVariant, UpdateProductVariantRequest } from '~/types/api'

const props = defineProps<{ variant: AdminVariant; saving: boolean }>()
const emit = defineEmits<{ save: [body: UpdateProductVariantRequest]; delete: [] }>()

const currencies: AdminCurrency[] = ['ARS', 'USD']

// Region/edition are the variant's "name" (no dedicated name field backend-side); editable here
// like every other field, so renaming a variant after creation doesn't need delete + recreate.
const region = ref(props.variant.region ?? '')
const edition = ref(props.variant.edition ?? '')
const price = ref(props.variant.price)
const discountPercentage = ref(props.variant.discountPercentage)
const currency = ref<AdminCurrency>(props.variant.currency)
const isActive = ref(props.variant.isActive)

watch(() => props.variant, (variant) => {
  region.value = variant.region ?? ''
  edition.value = variant.edition ?? ''
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
    region: region.value || undefined,
    edition: edition.value || undefined,
    sortOrder: props.variant.sortOrder,
    isActive: isActive.value,
  })
}

// Hard delete now (useAdminCatalog.deleteVariant) — inline confirm instead of a browser confirm(),
// same pattern as BuyerCard's resend confirmation, since this can no longer be undone via isActive.
const confirming = ref(false)
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm" :class="{ 'opacity-50': !variant.isActive }">
    <label class="flex items-center gap-2">
      <span class="sr-only">Región</span>
      <input v-model="region" type="text" placeholder="Región" class="h-9 w-24 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
    </label>
    <label class="flex items-center gap-2">
      <span class="sr-only">Edición</span>
      <input v-model="edition" type="text" placeholder="Edición" class="h-9 w-28 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
    </label>

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
    <!-- Only shown when a discount is actually applied (oldPrice is backend-computed from discountPercentage, null otherwise). -->
    <span v-if="variant.oldPrice && variant.discountPercentage" class="flex items-center gap-1.5 text-xs">
      <span class="text-white/40 line-through">{{ formatMoney(variant.oldPrice, variant.currency) }}</span>
      <AppBadge tone="success">-{{ variant.discountPercentage }}%</AppBadge>
    </span>

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

    <template v-if="confirming">
      <span class="text-xs text-red-300">¿Eliminar definitivamente?</span>
      <AppButton type="button" size="sm" class="bg-red-500 hover:bg-red-400" :loading="saving" @click="confirming = false; emit('delete')">Sí, eliminar</AppButton>
      <AppButton type="button" variant="ghost" size="sm" @click="confirming = false">Cancelar</AppButton>
    </template>
    <AppButton v-else type="button" variant="ghost" size="sm" class="text-red-300 hover:border-red-400/60 hover:text-red-300" @click="confirming = true">
      Eliminar
    </AppButton>
  </div>
</template>
