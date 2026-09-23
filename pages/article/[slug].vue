<script setup lang="ts">
import type { GuideDto } from '~/types/api'
import type { ApiError } from '~/composables/useApi'
import { renderMarkdown } from '~/utils/markdown'

const slug = useRoute().params.slug as string
const api = useApi()

// activation-guides spec: unknown slug → 404, same pattern as pages/product/[slug].vue.
const { data: guide, status, error, refresh } = await useAsyncData(`guide-${slug}`, () => api<GuideDto>(`/guides/${slug}`))

const httpStatus = error.value?.statusCode ?? (error.value?.cause as ApiError | undefined)?.status
if (httpStatus === 404) throw createError({ statusCode: 404, statusMessage: 'Guía no encontrada', fatal: true })

useHead({ title: () => (guide.value ? `${guide.value.title} · CHEKEYS` : 'CHEKEYS') })

const contentHtml = computed(() => (guide.value ? renderMarkdown(guide.value.contentMarkdown) : ''))
</script>

<template>
  <Skeleton v-if="status === 'pending'" class="mx-auto h-96 w-full max-w-2xl" />
  <ErrorState v-else-if="!guide">
    <template #retry><AppButton variant="ghost" @click="refresh()">Reintentar</AppButton></template>
  </ErrorState>
  <section v-else class="mx-auto flex max-w-2xl flex-col gap-6">
    <header>
      <p class="text-xs font-semibold uppercase tracking-wider text-accent">Guía de activación</p>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ guide.title }}</h1>
    </header>
    <div class="markdown-body text-base leading-relaxed text-white/70" v-html="contentHtml" />
  </section>
</template>
