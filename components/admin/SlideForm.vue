<script setup lang="ts">
import type { AdminCarouselSlideDto, AdminProduct, CarouselSlideRequest } from '~/types/api'

const props = defineProps<{ slide?: AdminCarouselSlideDto; products: AdminProduct[]; saving: boolean }>()
const emit = defineEmits<{ save: [body: CarouselSlideRequest]; cancel: [] }>()

const productId = ref(props.slide?.productId ?? props.products[0]?.id ?? '')
const sortOrder = ref(props.slide?.sortOrder ?? 0)
const isActive = ref(props.slide?.isActive ?? true)
const title = ref(props.slide?.title ?? '')
const caption = ref(props.slide?.caption ?? '')
const imageKey = ref(props.slide?.imageKey ?? '')

function submit() {
  if (!productId.value) return
  emit('save', {
    productId: productId.value,
    sortOrder: sortOrder.value,
    isActive: isActive.value,
    title: title.value || undefined,
    caption: caption.value || undefined,
    imageKey: imageKey.value || undefined,
  })
}
</script>

<template>
  <form class="glass flex flex-wrap items-end gap-3 rounded-2xl p-4" @submit.prevent="submit">
    <label class="flex flex-col gap-1 text-sm">
      <span class="text-white/70">Producto</span>
      <select v-model="productId" required class="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-accent">
        <option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }}</option>
      </select>
    </label>
    <label class="flex flex-col gap-1 text-sm">
      <span class="text-white/70">Orden</span>
      <input v-model.number="sortOrder" type="number" min="0" class="h-10 w-20 rounded-lg border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-accent" />
    </label>
    <label class="flex flex-col gap-1 text-sm">
      <span class="text-white/70">Título</span>
      <input v-model="title" type="text" placeholder="Usa el nombre del producto" class="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-accent" />
    </label>
    <label class="flex flex-col gap-1 text-sm">
      <span class="text-white/70">Bajada</span>
      <input v-model="caption" type="text" class="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-accent" />
    </label>
    <label class="flex flex-col gap-1 text-sm">
      <span class="text-white/70">Clave de imagen (R2)</span>
      <input v-model="imageKey" type="text" placeholder="Usa la del producto" class="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-accent" />
    </label>
    <label class="flex items-center gap-2 text-sm text-white/70">
      <input v-model="isActive" type="checkbox" class="h-4 w-4 rounded border-white/20 bg-white/5" />
      Activa
    </label>
    <div class="flex gap-2">
      <AppButton type="submit" size="sm" :loading="saving">{{ slide ? 'Guardar' : 'Agregar' }}</AppButton>
      <AppButton v-if="slide" type="button" variant="ghost" size="sm" @click="emit('cancel')">Cancelar</AppButton>
    </div>
  </form>
</template>
