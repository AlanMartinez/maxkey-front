<script setup lang="ts">
import type { AdminVaultKey, AdminVaultProduct } from '~/types/api'
import { ApiError } from '~/composables/useApi'

const props = defineProps<{
  product: AdminVaultProduct
  toggling: boolean
  uploading: Record<string, boolean>
  uploadSuccess: Record<string, boolean>
  fetchingKeys: Record<string, boolean>
  keysError: Record<string, ApiError | null>
  variantKeys: Record<string, AdminVaultKey[]>
  initiallyExpanded?: boolean
}>()
const emit = defineEmits<{ toggle: [enabled: boolean]; upload: [variantId: string, rawCodes: string]; viewKeys: [variantId: string] }>()

// Collapsed by default, same reasoning as ProductEditor: keeps the list scannable with many products.
// initiallyExpanded lets /admin/vault?product=<id> (coming from the "Ver en Vault" catalog link) open pre-expanded.
const expanded = ref(props.initiallyExpanded ?? false)

const totalAvailable = computed(() => props.product.variants.reduce((sum, v) => sum + v.availableCount, 0))

function onToggle(event: Event) {
  emit('toggle', (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <div :id="`vault-product-${product.id}`" class="glass flex flex-col gap-4 rounded-2xl p-6">
    <div class="flex items-center justify-between gap-3">
      <button type="button" class="flex min-w-0 flex-1 items-center gap-3 text-left" @click="expanded = !expanded">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-semibold">{{ product.name }}</h2>
          <p class="truncate text-xs text-white/50">{{ product.variants.length }} variante(s) · {{ totalAvailable }} clave(s) disponible(s) en total</p>
        </div>
      </button>
      <NuxtLink :to="`/admin/catalog?product=${product.id}`" class="shrink-0 text-sm text-accent hover:text-accent-hover">Ver en Catálogo →</NuxtLink>
      <button type="button" class="shrink-0 text-white/50 transition" :class="{ 'rotate-180': expanded }" @click="expanded = !expanded">⌄</button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <AppBadge :tone="product.vaultEnabled ? 'success' : 'neutral'">{{ product.vaultEnabled ? 'Vault activo' : 'Vault inactivo' }}</AppBadge>
      <label class="ml-auto flex items-center gap-2 text-sm text-white/70">
        <span>Auto-entrega (aplica a todas las variantes)</span>
        <input type="checkbox" :checked="product.vaultEnabled" :disabled="toggling" class="h-4 w-4 rounded border-white/20 bg-white/5" @change="onToggle" />
      </label>
    </div>

    <div v-if="expanded" class="flex flex-col gap-3 border-t border-white/10 pt-4">
      <VaultVariantRow
        v-for="variant in product.variants"
        :key="variant.id"
        :variant="variant"
        :uploading="!!uploading[variant.id]"
        :upload-success="!!uploadSuccess[variant.id]"
        :fetching-keys="!!fetchingKeys[variant.id]"
        :keys-failed="!!keysError[variant.id]"
        :keys="variantKeys[variant.id]"
        @upload="(rawCodes) => emit('upload', variant.id, rawCodes)"
        @view-keys="emit('viewKeys', variant.id)"
      />
    </div>
  </div>
</template>
