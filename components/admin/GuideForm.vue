<script setup lang="ts">
import type { GuideDto, GuideRequest } from '~/types/api'

const props = defineProps<{ guide?: GuideDto; saving: boolean }>()
const emit = defineEmits<{ save: [body: GuideRequest]; cancel: [] }>()

const slug = ref(props.guide?.slug ?? '')
const title = ref(props.guide?.title ?? '')
const contentMarkdown = ref(props.guide?.contentMarkdown ?? '')

function submit() {
  if (!slug.value.trim() || !title.value.trim()) return
  emit('save', { slug: slug.value.trim(), title: title.value.trim(), contentMarkdown: contentMarkdown.value })
}
</script>

<template>
  <form class="glass flex flex-col gap-3 rounded-2xl p-4" @submit.prevent="submit">
    <label class="flex flex-col gap-1 text-sm">
      <span class="text-white/70">Slug (URL: /article/…)</span>
      <input v-model="slug" type="text" required pattern="[a-z0-9-]+" placeholder="microsoft-gift-card-activation" class="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-accent" />
    </label>
    <label class="flex flex-col gap-1 text-sm">
      <span class="text-white/70">Título</span>
      <input v-model="title" type="text" required class="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-white outline-none focus:border-accent" />
    </label>
    <MarkdownEditor v-model="contentMarkdown" label="Contenido (admite Markdown)" :rows="12" image-folder="/guides" />
    <div class="flex gap-2">
      <AppButton type="submit" size="sm" :loading="saving">{{ guide ? 'Guardar' : 'Agregar' }}</AppButton>
      <AppButton v-if="guide" type="button" variant="ghost" size="sm" @click="emit('cancel')">Cancelar</AppButton>
    </div>
  </form>
</template>
