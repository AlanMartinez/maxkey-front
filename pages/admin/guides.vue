<script setup lang="ts">
import type { GuideRequest } from '~/types/api'

definePageMeta({ middleware: ['auth', 'admin'] })
useHead({ title: 'Guías de activación · Admin · Chekeys' })

const { guides, status, error, refresh, saving, createGuide, updateGuide, deleteGuide } = await useAdminGuides()

const editingId = ref<string | null>(null)

async function onUpdate(id: string, body: GuideRequest) {
  if (await updateGuide(id, body)) editingId.value = null
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold">Guías de activación</h1>

    <GuideForm :saving="saving" @save="(body: GuideRequest) => createGuide(body)" />

    <div v-if="status === 'pending'" class="grid gap-3">
      <Skeleton v-for="n in 3" :key="n" class="h-16 w-full" />
    </div>
    <ErrorState v-else-if="error">
      <template #retry><AppButton variant="ghost" @click="refresh()">Reintentar</AppButton></template>
    </ErrorState>
    <EmptyState v-else-if="!guides.length" title="Todavía no hay guías" />
    <div v-else class="flex flex-col gap-3">
      <template v-for="guide in guides" :key="guide.id">
        <GuideForm
          v-if="editingId === guide.id"
          :guide="guide"
          :saving="saving"
          @save="(body: GuideRequest) => onUpdate(guide.id, body)"
          @cancel="editingId = null"
        />
        <div v-else class="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
          <span class="min-w-0 flex-1 truncate">{{ guide.title }} · {{ guide.slug }}</span>
          <AppButton type="button" variant="ghost" size="sm" @click="editingId = guide.id">Editar</AppButton>
          <AppButton type="button" variant="ghost" size="sm" @click="deleteGuide(guide.id)">Eliminar</AppButton>
        </div>
      </template>
    </div>
  </section>
</template>
