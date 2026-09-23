<script setup lang="ts">
defineProps<{ title: string; id: string }>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <section :id="id" class="glass scroll-mt-24 rounded-2xl border border-white/10">
    <!-- Heading wraps the toggle so the section keeps its h2 for the outline/screen readers. -->
    <h2 class="text-xl font-semibold">
      <button type="button" :aria-expanded="open" :aria-controls="`${id}-content`" class="flex w-full items-center gap-2 p-6 text-left sm:p-8" @click="open = !open">
        <slot name="icon" />
        {{ title }}
        <svg class="ml-auto h-5 w-5 shrink-0 text-white/50 transition-transform" :class="{ 'rotate-180': open }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </h2>
    <!-- v-show keeps the body in the DOM so scroll targets and crawlers still find the content while collapsed. -->
    <div v-show="open" :id="`${id}-content`" class="px-6 pb-6 sm:px-8 sm:pb-8">
      <slot />
    </div>
  </section>
</template>
