<script setup lang="ts">
import type { AdminProduct, UpdateProductRequest, UpdateProductVariantRequest } from '~/types/api'

const props = defineProps<{ product: AdminProduct; saving: boolean }>()
const emit = defineEmits<{ save: [body: UpdateProductRequest]; saveVariant: [variantId: string, body: UpdateProductVariantRequest] }>()

// Name/description/imageKey/isActive are the editable fields (design D3 UI scope); platform and
// slug travel through unchanged since PUT takes the full record.
const name = ref(props.product.name)
const description = ref(props.product.description)
const imageKey = ref(props.product.imageKey ?? '')
const isActive = ref(props.product.isActive)

watch(() => props.product, (product) => {
  name.value = product.name
  description.value = product.description
  imageKey.value = product.imageKey ?? ''
  isActive.value = product.isActive
})

function submit() {
  emit('save', {
    name: name.value,
    platform: props.product.platform,
    description: description.value,
    imageKey: imageKey.value || undefined,
    isActive: isActive.value,
  })
}
</script>

<template>
  <form class="glass flex flex-col gap-4 rounded-2xl p-6" @submit.prevent="submit">
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
      <span class="text-white/70">Clave de imagen (R2)</span>
      <input v-model="imageKey" type="text" placeholder="products/slug.png" class="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent" />
    </label>

    <label class="flex items-center gap-2 text-sm text-white/70">
      <input v-model="isActive" type="checkbox" class="h-4 w-4 rounded border-white/20 bg-white/5" />
      Producto activo
    </label>

    <AppButton type="submit" size="sm" :loading="saving" class="self-start">Guardar producto</AppButton>

    <div class="flex flex-col gap-2 border-t border-white/10 pt-4">
      <VariantRow
        v-for="variant in product.variants"
        :key="variant.id"
        :variant="variant"
        :saving="saving"
        @save="(body) => emit('saveVariant', variant.id, body)"
      />
    </div>
  </form>
</template>
