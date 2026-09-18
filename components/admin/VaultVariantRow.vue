<script setup lang="ts">
import type { AdminVaultKey, AdminVaultVariant } from '~/types/api'
import { ApiError } from '~/composables/useApi'

const props = defineProps<{
  variant: AdminVaultVariant
  uploading: boolean
  uploadError: ApiError | null
  uploadSuccess: boolean
  fetchingKeys: boolean
  keysError: ApiError | null
  // undefined = never fetched yet, [] = fetched and empty — distinguishes the two for the toggle below.
  keys: AdminVaultKey[] | undefined
}>()
const emit = defineEmits<{ upload: [rawCodes: string]; viewKeys: [] }>()

// Collapsed by default, same reasoning as VaultProductRow: keeps the list scannable with many items.
const expanded = ref(false)

const keysVisible = ref(false)

function toggleKeys() {
  keysVisible.value = !keysVisible.value
  if (keysVisible.value && props.keys === undefined && !props.fetchingKeys) emit('viewKeys')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR')
}

const codesInput = ref('')
const emptyInputError = ref(false)

const parsedCount = computed(() => codesInput.value.split('\n').map((c) => c.trim()).filter(Boolean).length)

// Stock badge tone gives an at-a-glance read without comparing raw numbers across rows.
const stockTone = computed(() => {
  if (props.variant.availableCount === 0) return 'danger'
  if (props.variant.availableCount < 10) return 'discount'
  return 'success'
})

// Codes are write-only (no read-back endpoint) — clear the textarea once the upload lands so
// nothing lingers on screen that looks like it could still be edited or reviewed.
watch(() => props.uploadSuccess, (success) => {
  if (success) codesInput.value = ''
})

function submit() {
  if (!parsedCount.value) {
    emptyInputError.value = true
    return
  }
  emptyInputError.value = false
  emit('upload', codesInput.value)
}
</script>

<template>
  <div class="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
    <button type="button" class="flex flex-wrap items-center gap-2 text-left" @click="expanded = !expanded">
      <span class="text-white/70">{{ variant.region || variant.edition ? [variant.region, variant.edition].filter(Boolean).join(' · ') : 'Variante única' }}</span>
      <AppBadge :tone="stockTone">{{ variant.availableCount }} disponible(s)</AppBadge>
      <AppBadge tone="neutral">{{ variant.assignedCount }} asignada(s)</AppBadge>
      <span class="ml-auto shrink-0 text-white/50 transition" :class="{ 'rotate-180': expanded }">⌄</span>
    </button>

    <template v-if="expanded">
      <label class="flex flex-col gap-1.5">
        <span class="text-xs text-white/50">Pegar códigos (uno por línea)</span>
        <textarea
          v-model="codesInput"
          rows="3"
          placeholder="CODE-1&#10;CODE-2"
          class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white outline-none focus:border-accent"
        />
      </label>

      <div class="flex flex-wrap items-center gap-2">
        <AppButton type="button" size="sm" :loading="uploading" :disabled="!parsedCount" @click="submit()">
          Subir {{ parsedCount ? `(${parsedCount})` : '' }}
        </AppButton>
        <span v-if="emptyInputError" role="alert" class="text-xs text-red-300">Pegá al menos un código.</span>
        <span v-if="uploadSuccess" class="text-xs text-emerald-300">Códigos cargados ✓</span>
        <span v-if="uploadError" role="alert" class="text-xs text-red-300">{{ uploadError.detail ?? uploadError.title }}</span>
      </div>

      <!-- DEV-ONLY: unlike toggle/upload, GET /admin/vault/variants/{id}/keys has no real backend
           at all yet (not a fallback-on-failure case) — hidden in prod so it never implies "no keys
           loaded" when the truth is "not built yet". import.meta.dev is dead-code-eliminated in prod. -->
      <div v-if="import.meta.dev" class="flex flex-col gap-2 border-t border-white/10 pt-3">
        <AppButton type="button" size="sm" variant="ghost" class="self-start" :loading="fetchingKeys" @click="toggleKeys()">
          {{ keysVisible ? 'Ocultar keys cargadas' : 'Ver keys cargadas' }}
        </AppButton>

        <template v-if="keysVisible">
          <p v-if="fetchingKeys" class="text-xs text-white/50">Cargando keys…</p>
          <p v-else-if="keysError" role="alert" class="text-xs text-red-300">{{ keysError.detail ?? keysError.title }}</p>
          <p v-else-if="!keys?.length" class="text-xs text-white/50">Todavía no se cargaron keys para esta variante.</p>
          <ul v-else class="flex flex-col gap-1.5">
            <li v-for="key in keys" :key="key.id" class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs">
              <span class="font-mono text-white/40">{{ key.id.slice(0, 8) }}</span>
              <AppBadge :tone="key.status === 'Available' ? 'success' : 'neutral'">{{ key.status === 'Available' ? 'Disponible' : 'Asignada' }}</AppBadge>
              <span class="text-white/60">{{ key.loadedBy }}</span>
              <span class="text-white/40">Cargada: {{ formatDate(key.createdAt) }}</span>
              <span class="text-white/40">Asignada: {{ key.assignedAt ? formatDate(key.assignedAt) : '—' }}</span>
              <span class="ml-auto text-white/40">Orden: {{ key.orderItemId ?? '—' }}</span>
            </li>
          </ul>
        </template>
      </div>
    </template>
  </div>
</template>
