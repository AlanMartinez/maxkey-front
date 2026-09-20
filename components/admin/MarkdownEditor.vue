<script setup lang="ts">
import { renderMarkdown } from '~/utils/markdown'

withDefaults(defineProps<{ rows?: number; label?: string }>(), { rows: 5, label: undefined })
const text = defineModel<string>({ required: true })

const input = ref<HTMLTextAreaElement | null>(null)
const showPreview = ref(false)
// Two editors can live in the same form, so the dialog's labelledby id must not collide.
const previewTitleId = `${useId()}-preview-title`

function onPreviewKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') showPreview.value = false
}
onMounted(() => window.addEventListener('keydown', onPreviewKeydown))
onUnmounted(() => window.removeEventListener('keydown', onPreviewKeydown))

// Wraps the current textarea selection in a Markdown marker (bold/italic); with nothing selected,
// inserts a placeholder word so the admin has something to type over. CommonMark won't treat a
// closing `**`/`*` as emphasis if it's preceded by whitespace, so leading/trailing spaces in the
// selection are kept OUTSIDE the markers instead of wrapping them (e.g. "word " → "**word** ").
function wrapSelection(marker: string) {
  const el = input.value
  if (!el) return
  const { selectionStart: start, selectionEnd: end } = el
  const value = text.value
  const rawSelected = value.slice(start, end)
  const trimmed = rawSelected.trim() || 'texto'
  const leadingWs = rawSelected.match(/^\s*/)?.[0] ?? ''
  const trailingWs = rawSelected.match(/\s*$/)?.[0] ?? ''
  text.value = value.slice(0, start) + leadingWs + marker + trimmed + marker + trailingWs + value.slice(end)
  const selStart = start + leadingWs.length
  nextTick(() => {
    el.focus()
    el.setSelectionRange(selStart + marker.length, selStart + marker.length + trimmed.length)
  })
}

// Prefixes every line touched by the selection with a Markdown bullet, so selecting several lines
// turns them all into one list instead of just the first.
function prefixLines(prefix: string) {
  const el = input.value
  if (!el) return
  const { selectionStart: start, selectionEnd: end } = el
  const value = text.value
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const lineEndIdx = value.indexOf('\n', end)
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx
  const block = value.slice(lineStart, lineEnd)
  const prefixed = block.split('\n').map((line) => (line ? `${prefix}${line}` : line)).join('\n')
  text.value = value.slice(0, lineStart) + prefixed + value.slice(lineEnd)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(lineStart, lineStart + prefixed.length)
  })
}
</script>

<template>
  <div class="flex flex-col gap-2 text-sm">
    <span v-if="label" class="text-white/70">{{ label }}</span>
    <div class="flex gap-1.5">
      <button type="button" title="Negrita" class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-bold text-white/70 hover:border-white/30 hover:text-white" @click="wrapSelection('**')">B</button>
      <button type="button" title="Cursiva" class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm italic text-white/70 hover:border-white/30 hover:text-white" @click="wrapSelection('*')">I</button>
      <button type="button" title="Lista con viñetas" class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-white/70 hover:border-white/30 hover:text-white" @click="prefixLines('- ')">•</button>
      <button
        type="button"
        :disabled="!text.trim()"
        class="ml-auto text-sm font-medium text-accent hover:text-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        @click="showPreview = true"
      >
        Vista previa
      </button>
    </div>
    <textarea ref="input" v-model="text" :rows="rows" class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-accent" />

    <Teleport to="body">
      <div v-if="showPreview" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" aria-hidden="true" @click="showPreview = false" />
        <div role="dialog" aria-modal="true" :aria-labelledby="previewTitleId" class="glass relative flex max-h-[80vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl p-6">
          <button type="button" aria-label="Cerrar" class="absolute right-3 top-3 rounded-xl p-2 text-white/70 transition hover:bg-white/5 hover:text-white" @click="showPreview = false">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <h2 :id="previewTitleId" class="text-lg font-semibold">Vista previa</h2>
          <div class="markdown-body text-white/70" v-html="renderMarkdown(text)" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
