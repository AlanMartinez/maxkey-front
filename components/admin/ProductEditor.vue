<script setup lang="ts">
import type { AdminCurrency, AdminProduct, CreateProductVariantRequest, UpdateProductRequest, UpdateProductVariantRequest } from '~/types/api'

const props = defineProps<{ product: AdminProduct; saving: boolean }>()
const emit = defineEmits<{
  save: [body: UpdateProductRequest]
  saveVariant: [variantId: string, body: UpdateProductVariantRequest]
  deleteProduct: []
  deleteVariant: [variantId: string]
  createVariant: [body: CreateProductVariantRequest]
}>()

// Name/description/imageKey/isActive are the editable fields (design D3 UI scope); platform and
// slug travel through unchanged since PUT takes the full record.
const name = ref(props.product.name)
const description = ref(props.product.description)
const imageKey = ref(props.product.imageKey ?? '')
const detailImageKey = ref(props.product.detailImageKey ?? '')
const isActive = ref(props.product.isActive)

watch(() => props.product, (product) => {
  name.value = product.name
  description.value = product.description
  imageKey.value = product.imageKey ?? ''
  detailImageKey.value = product.detailImageKey ?? ''
  isActive.value = product.isActive
})

function submit() {
  emit('save', {
    name: name.value,
    platform: props.product.platform,
    description: description.value,
    imageKey: imageKey.value || undefined,
    detailImageKey: detailImageKey.value || undefined,
    isActive: isActive.value,
  })
}

const currencies: AdminCurrency[] = ['ARS', 'USD']
const showNewVariant = ref(false)
const newVariant = ref({ region: '', edition: '', price: 0, discountPercentage: undefined as number | undefined, currency: 'ARS' as AdminCurrency })

function submitNewVariant() {
  emit('createVariant', {
    region: newVariant.value.region || undefined,
    edition: newVariant.value.edition || undefined,
    price: newVariant.value.price,
    discountPercentage: newVariant.value.discountPercentage || undefined,
    currency: newVariant.value.currency,
    sortOrder: props.product.variants.length,
    isActive: true,
  })
  newVariant.value = { region: '', edition: '', price: 0, discountPercentage: undefined, currency: 'ARS' }
  showNewVariant.value = false
}
</script>

<template>
  <form class="glass flex flex-col gap-4 rounded-2xl p-6" :class="{ 'opacity-50': !product.isActive }" @submit.prevent="submit">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">{{ product.name }}</h2>
        <p class="text-xs text-white/50">{{ product.slug }} · {{ product.platform }}</p>
      </div>
      <AppBadge :tone="isActive ? 'success' : 'neutral'">{{ isActive ? 'Activo' : 'Inactivo' }}</AppBadge>
    </div>

    <label class="flex flex-col gap-2 text-sm">
      <span class="text-white/70">Nombre</span>
      <input v-model="name" type="text" required class="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent" />
    </label>

    <label class="flex flex-col gap-2 text-sm">
      <span class="text-white/70">Descripción</span>
      <textarea v-model="description" rows="2" class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-accent" />
    </label>

    <label class="flex flex-col gap-2 text-sm">
      <span class="text-white/70">Clave de imagen — catálogo (R2, 3:4)</span>
      <input v-model="imageKey" type="text" placeholder="products/slug.png" class="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent" />
    </label>

    <label class="flex flex-col gap-2 text-sm">
      <span class="text-white/70">Clave de imagen — vista de producto (R2)</span>
      <input v-model="detailImageKey" type="text" placeholder="products/slug-detail.png" class="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent" />
    </label>

    <label class="flex items-center gap-2 text-sm text-white/70">
      <input v-model="isActive" type="checkbox" class="h-4 w-4 rounded border-white/20 bg-white/5" />
      Producto activo
    </label>

    <div class="flex gap-2">
      <AppButton type="submit" size="sm" :loading="saving" class="self-start">Guardar producto</AppButton>
      <AppButton
        type="button"
        variant="ghost"
        size="sm"
        class="self-start text-red-300 hover:border-red-400/60 hover:text-red-300"
        :loading="saving"
        @click="emit('deleteProduct')"
      >
        Eliminar producto
      </AppButton>
    </div>

    <div class="flex flex-col gap-2 border-t border-white/10 pt-4">
      <VariantRow
        v-for="variant in product.variants"
        :key="variant.id"
        :variant="variant"
        :saving="saving"
        @save="(body) => emit('saveVariant', variant.id, body)"
        @delete="emit('deleteVariant', variant.id)"
      />

      <button
        v-if="!showNewVariant"
        type="button"
        class="self-start text-sm text-accent hover:text-accent-hover"
        @click="showNewVariant = true"
      >
        + Agregar variante
      </button>

      <div v-else class="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/5 p-3 text-sm">
        <input v-model="newVariant.region" type="text" placeholder="Región" class="h-9 w-24 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
        <input v-model="newVariant.edition" type="text" placeholder="Edición" class="h-9 w-24 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
        <input v-model.number="newVariant.price" type="number" min="0" step="0.01" placeholder="Precio" class="h-9 w-24 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
        <input v-model.number="newVariant.discountPercentage" type="number" min="0" max="99" step="1" placeholder="% off" class="h-9 w-20 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent" />
        <select v-model="newVariant.currency" class="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-white outline-none focus:border-accent">
          <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
        </select>
        <AppButton type="button" size="sm" :loading="saving" @click="submitNewVariant()">Crear</AppButton>
        <AppButton type="button" variant="ghost" size="sm" @click="showNewVariant = false">Cancelar</AppButton>
      </div>
    </div>
  </form>
</template>
