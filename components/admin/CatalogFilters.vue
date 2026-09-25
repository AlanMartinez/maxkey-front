<script setup lang="ts">
import type { CatalogFilters } from '~/utils/adminCatalogFilter'

defineProps<{
  platforms: { value: string; count: number }[]
  shown: number
  total: number
  active: boolean
}>()
defineEmits<{ clear: [] }>()

const filters = defineModel<CatalogFilters>({ required: true })

function update<K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) {
  filters.value = { ...filters.value, [key]: value }
}

const selectClass = 'h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-accent'
</script>

<template>
  <div class="glass flex flex-col gap-3 rounded-2xl p-4">
    <input
      :value="filters.search"
      type="search"
      placeholder="Buscar por nombre, plataforma o slug…"
      aria-label="Buscar productos"
      class="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-accent"
      @input="update('search', ($event.target as HTMLInputElement).value)"
    />
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <label class="flex flex-col gap-1 text-xs text-white/60">
        Plataforma
        <select data-testid="filter-platform" :value="filters.platform" :class="selectClass" @change="update('platform', ($event.target as HTMLSelectElement).value)">
          <option value="all">Todas</option>
          <option v-for="platform in platforms" :key="platform.value" :value="platform.value">{{ platform.value }} ({{ platform.count }})</option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-xs text-white/60">
        Estado
        <select
          data-testid="filter-status"
          :value="filters.status"
          :class="selectClass"
          @change="update('status', ($event.target as HTMLSelectElement).value as CatalogFilters['status'])"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-xs text-white/60">
        Revisar
        <select
          data-testid="filter-review"
          :value="filters.review"
          :class="selectClass"
          @change="update('review', ($event.target as HTMLSelectElement).value as CatalogFilters['review'])"
        >
          <option value="all">Todo</option>
          <option value="no-variants">Sin variantes activas</option>
          <option value="no-image">Sin imagen</option>
          <option value="no-guide">Sin guía de activación</option>
          <option value="discounted">Con descuento</option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-xs text-white/60">
        Ordenar
        <select
          data-testid="filter-sort"
          :value="filters.sort"
          :class="selectClass"
          @change="update('sort', ($event.target as HTMLSelectElement).value as CatalogFilters['sort'])"
        >
          <option value="default">Orden de carga</option>
          <option value="name">Nombre (A-Z)</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
        </select>
      </label>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-white/50">
      <span data-testid="filter-count" aria-live="polite">{{ shown }} de {{ total }} productos</span>
      <AppButton v-if="active" type="button" variant="ghost" size="sm" @click="$emit('clear')">Limpiar filtros</AppButton>
    </div>
  </div>
</template>
