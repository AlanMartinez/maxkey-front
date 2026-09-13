<script setup lang="ts">
// design.md §9 "States": KeyReveal renders masked keys with reveal/copy, only when Delivered.
// Callers gate rendering on `order.status === 'Delivered'`; this component renders nothing without a `code`.
const props = defineProps<{ code?: string }>()

const revealed = ref(false)
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  if (!props.code) return
  await navigator.clipboard.writeText(props.code)
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div v-if="code" class="key-reveal flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm">
    <span class="flex-1 truncate">{{ revealed ? code : '••••••••••••' }}</span>
    <button type="button" class="text-xs text-accent transition hover:text-accent-hover" @click="revealed = !revealed">
      {{ revealed ? 'Ocultar' : 'Mostrar key' }}
    </button>
    <button type="button" class="text-xs text-white/60 transition hover:text-white" @click="copy">
      {{ copied ? 'Copiado' : 'Copiar' }}
    </button>
  </div>
</template>
