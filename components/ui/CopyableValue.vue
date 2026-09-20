<script setup lang="ts">
// Inline identifier (order id, MP payment id, key id) that truncates to its container instead of
// breaking the row layout. The full value stays available on hover (title) and — only while the text
// is actually clipped — through a copy-to-clipboard button. Clipping is measured, not assumed:
// scrollWidth > clientWidth, re-checked on resize so a wider viewport hides the button again. Same
// 1.5s "copied" feedback as KeyReveal.vue.
const props = defineProps<{ value: string }>()

const text = ref<HTMLElement | null>(null)
const truncated = ref(false)
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined
let observer: ResizeObserver | undefined

function measure() {
  const el = text.value
  truncated.value = !!el && el.scrollWidth > el.clientWidth
}

onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && text.value) {
    observer = new ResizeObserver(measure)
    observer.observe(text.value)
  } else {
    window.addEventListener('resize', measure)
  }
})
onUnmounted(() => {
  observer?.disconnect()
  window.removeEventListener('resize', measure)
  clearTimeout(copiedTimer)
})
watch(() => props.value, () => nextTick(measure))

async function copy() {
  await navigator.clipboard.writeText(props.value)
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <span class="inline-flex min-w-0 max-w-full items-center gap-1.5" data-copyable>
    <span ref="text" class="min-w-0 truncate font-mono" :title="value">{{ value }}</span>
    <button
      v-if="truncated"
      type="button"
      :aria-label="copied ? 'Copiado' : 'Copiar'"
      :title="copied ? 'Copiado' : 'Copiar'"
      class="shrink-0 rounded p-0.5 transition hover:bg-white/10 hover:text-white"
      :class="copied ? 'text-success' : 'text-white/50'"
      @click="copy"
    >
      <svg v-if="copied" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
      <svg v-else class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
    </button>
  </span>
</template>
