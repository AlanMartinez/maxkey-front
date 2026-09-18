<script setup lang="ts">
import type { AdminVaultVariant } from '~/types/api'
import { ApiError } from '~/composables/useApi'

const props = defineProps<{
  variant: AdminVaultVariant
  uploading: boolean
  uploadError: ApiError | null
  uploadSuccess: boolean
}>()
const emit = defineEmits<{ upload: [rawCodes: string] }>()

// Collapsed by default, same reasoning as VaultProductRow: keeps the list scannable with many items.
const expanded = ref(false)

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
    </template>
  </div>
</template>
