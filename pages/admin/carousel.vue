<script setup lang="ts">
import type { CarouselSlideRequest } from '~/types/api'

definePageMeta({ middleware: ['auth', 'admin'] })
useHead({ title: 'Carrusel · Admin · CHEKEYS' })

const { slides, products, status, error, refresh, saving, saveError, createSlide, updateSlide, deleteSlide } = await useAdminCarousel()

const editingId = ref<string | null>(null)

async function onUpdate(id: string, body: CarouselSlideRequest) {
  if (await updateSlide(id, body)) editingId.value = null
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Carrusel</h1>
    <p v-if="saveError" role="alert" class="text-sm text-red-300">{{ saveError.detail ?? saveError.title }}</p>

    <SlideForm :products="products" :saving="saving" @save="(body: CarouselSlideRequest) => createSlide(body)" />

    <div v-if="status === 'pending'" class="grid gap-3">
      <Skeleton v-for="n in 3" :key="n" class="h-16 w-full" />
    </div>
    <ErrorState v-else-if="error">
      <template #retry><AppButton variant="ghost" @click="refresh()">Reintentar</AppButton></template>
    </ErrorState>
    <EmptyState v-else-if="!slides.length" title="Todavía no hay diapositivas" />
    <div v-else class="flex flex-col gap-3">
      <template v-for="slide in slides" :key="slide.id">
        <SlideForm
          v-if="editingId === slide.id"
          :slide="slide"
          :products="products"
          :saving="saving"
          @save="(body: CarouselSlideRequest) => onUpdate(slide.id, body)"
          @cancel="editingId = null"
        />
        <div v-else class="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
          <span class="min-w-0 flex-1 truncate">{{ slide.title ?? slide.productName }} · {{ slide.productSlug }}</span>
          <AppBadge :tone="slide.isActive ? 'success' : 'neutral'">{{ slide.isActive ? 'Activa' : 'Inactiva' }}</AppBadge>
          <span class="text-white/50">#{{ slide.sortOrder }}</span>
          <AppButton type="button" variant="ghost" size="sm" @click="editingId = slide.id">Editar</AppButton>
          <AppButton type="button" variant="ghost" size="sm" @click="deleteSlide(slide.id)">Eliminar</AppButton>
        </div>
      </template>
    </div>
  </section>
</template>
