<script setup lang="ts">
import type { AdminCurrency, AdminVariant, UpdateProductVariantRequest } from '~/types/api'

const props = defineProps<{ variant: AdminVariant; saving: boolean }>()
const emit = defineEmits<{ save: [body: UpdateProductVariantRequest]; delete: [] }>()

const currencies: AdminCurrency[] = ['ARS', 'USD']

// Region/edition are the variant's "name" (no dedicated name field backend-side); editable here
// like every other field, so renaming a variant after creation doesn't need delete + recreate.
const region = ref(props.variant.region ?? '')
const edition = ref(props.variant.edition ?? '')
// The admin types the real/list price here (what shows struck-through to buyers). The backend's
// `price` field means something else — the already-discounted charge amount — so we compute that
// on submit; sending the typed value as-is was the bug (10% off 36000 saved literally as 36000,
// then the backend's own oldPrice math *inflated* it to 40000 instead of discounting it).
const basePrice = ref(props.variant.oldPrice ?? props.variant.price)
// Backend bug (confirmed against localhost:8080): the PUT/GET response never echoes
// `discountPercentage` back, even though it correctly used it to compute price/oldPrice — so the
// field always comes back undefined and this input would go blank right after saving. Rebuild it
// from the two prices we DO get back until the backend returns it directly.
function deriveDiscount(variant: AdminVariant) {
  if (variant.discountPercentage != null) return variant.discountPercentage
  if (variant.oldPrice && variant.oldPrice > variant.price) {
    return Math.round((1 - variant.price / variant.oldPrice) * 100)
  }
  return undefined
}
const discountPercentage = ref(deriveDiscount(props.variant))
const currency = ref<AdminCurrency>(props.variant.currency)
const isActive = ref(props.variant.isActive)
// Not a local form field: the checkbox saves immediately (radio-like per product, the backend
// clears the siblings), so it always reflects what the server last confirmed.
const isRecommended = computed(() => props.variant.isRecommended)

const finalPrice = computed(() => {
  if (!discountPercentage.value || !basePrice.value) return basePrice.value
  return Math.round(basePrice.value * (1 - discountPercentage.value / 100) * 100) / 100
})

watch(() => props.variant, (variant) => {
  region.value = variant.region ?? ''
  edition.value = variant.edition ?? ''
  basePrice.value = variant.oldPrice ?? variant.price
  discountPercentage.value = deriveDiscount(variant)
  currency.value = variant.currency
  isActive.value = variant.isActive
})

// PUT is a full-record update, so every save path must carry `isRecommended` — omitting it
// deserializes as false backend-side and would silently un-mark the variant on any edit.
function submit(recommended = isRecommended.value) {
  emit('save', {
    price: finalPrice.value,
    discountPercentage: discountPercentage.value || undefined,
    currency: currency.value,
    region: region.value || undefined,
    edition: edition.value || undefined,
    sortOrder: props.variant.sortOrder,
    isActive: isActive.value,
    isRecommended: recommended,
  })
}

function onRecommendedChange(event: Event) {
  submit((event.target as HTMLInputElement).checked)
}

// Hard delete now (useAdminCatalog.deleteVariant) — inline confirm instead of a browser confirm(),
// same pattern as BuyerCard's resend confirmation, since this can no longer be undone via isActive.
const confirming = ref(false)
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm" :class="{ 'opacity-50': !variant.isActive }">
    <label class="flex items-center gap-2 text-xs text-white/70">
      <input type="checkbox" :checked="isRecommended" :disabled="saving" class="h-4 w-4 rounded border-white/20 bg-white/5" @change="onRecommendedChange" />
      Recomendada
    </label>
    <label class="flex items-center gap-2">
      <span class="sr-only">Región</span>
      <input v-model="region" type="text" placeholder="Región" class="h-9 w-24 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
    </label>
    <label class="flex items-center gap-2">
      <span class="sr-only">Edición</span>
      <input v-model="edition" type="text" placeholder="Edición" class="h-9 w-28 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
    </label>

    <label class="flex items-center gap-2">
      <span class="sr-only">Precio real</span>
      <input v-model.number="basePrice" type="number" min="0" step="0.01" title="Precio real (sin descuento)" class="h-9 w-28 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
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
    <!-- Live preview: final = real price with the % applied, computed before hitting Guardar. -->
    <span v-if="discountPercentage" class="flex items-center gap-1.5 text-xs">
      <span class="text-white/40 line-through">{{ formatMoney(basePrice, currency) }}</span>
      <span class="font-semibold text-emerald-300">{{ formatMoney(finalPrice, currency) }}</span>
      <AppBadge tone="success">-{{ discountPercentage }}%</AppBadge>
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
