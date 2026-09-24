<script setup lang="ts">
// Small confirmation modal for irreversible buyer actions (e.g. revealing a key). Same Teleport +
// glass + role="dialog" pattern as LoginDialog.vue / DeliverOrderDialog.vue. The parent controls
// mounting with v-if; Escape and the backdrop emit `cancel`, the primary button emits `confirm`.
const props = withDefaults(defineProps<{
  title: string
  body: string
  confirmLabel?: string
  cancelLabel?: string
  link?: { label: string; to: string }
  loading?: boolean
}>(), { confirmLabel: 'Confirmar', cancelLabel: 'Cancelar', link: undefined, loading: false })
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const titleId = `confirm-dialog-${Math.random().toString(36).slice(2, 8)}`
const primary = ref<{ $el: HTMLElement } | null>(null)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !props.loading) emit('cancel')
}
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  // Focus lands on the primary action so keyboard users can confirm or Tab to cancel right away.
  primary.value?.$el?.focus()
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60" aria-hidden="true" @click="!loading && emit('cancel')" />
      <div role="dialog" aria-modal="true" :aria-labelledby="titleId" class="glass relative flex w-full max-w-md flex-col gap-5 rounded-2xl p-6">
        <button
          type="button"
          aria-label="Cerrar"
          class="absolute right-3 top-3 rounded-xl p-2 text-white/70 transition hover:bg-white/5 hover:text-white"
          :disabled="loading"
          @click="emit('cancel')"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <div class="flex flex-col gap-2 pr-8">
          <h2 :id="titleId" class="text-lg font-semibold">{{ title }}</h2>
          <p class="text-sm leading-relaxed text-white/60">{{ body }}</p>
          <NuxtLink v-if="link" :to="link.to" class="self-start text-sm font-medium text-accent transition hover:text-accent-hover hover:underline">{{ link.label }}</NuxtLink>
        </div>

        <div class="flex justify-end gap-2">
          <AppButton type="button" variant="ghost" :disabled="loading" @click="emit('cancel')">{{ cancelLabel }}</AppButton>
          <AppButton ref="primary" type="button" :loading="loading" @click="emit('confirm')">{{ confirmLabel }}</AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
