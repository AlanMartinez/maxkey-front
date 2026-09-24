<script setup lang="ts">
export interface LegalSection {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
  /** Related pages, rendered as a "Ver también" row under the section. */
  links?: { label: string; to: string }[]
}

defineProps<{ title: string; subtitle?: string; updatedAt: string; sections: LegalSection[] }>()
</script>

<template>
  <article class="flex flex-col gap-8">
    <header class="max-w-3xl">
      <p class="text-xs font-semibold uppercase tracking-wider text-accent">Legal</p>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">{{ title }}</h1>
      <p v-if="subtitle" class="mt-3 text-base leading-relaxed text-white/60">{{ subtitle }}</p>
      <p class="mt-4 text-xs text-white/40">Última actualización: {{ updatedAt }}</p>
    </header>

    <div class="grid gap-8 lg:grid-cols-[14rem_1fr]">
      <!-- Sticky index for long articles; phones get the sections in order without it. -->
      <nav class="hidden lg:block" aria-label="Índice">
        <ol class="sticky top-24 flex flex-col gap-2 border-l border-white/10 text-sm">
          <li v-for="(section, index) in sections" :key="section.id">
            <a :href="`#${section.id}`" class="-ml-px block border-l border-transparent pl-4 text-white/50 transition hover:border-accent hover:text-white">
              <span class="mr-2 tabular-nums text-white/30">{{ index + 1 }}.</span>{{ section.title }}
            </a>
          </li>
        </ol>
      </nav>

      <div class="glass max-w-3xl rounded-2xl px-6 py-8 sm:px-10 sm:py-10">
        <section v-for="(section, index) in sections" :id="section.id" :key="section.id" class="scroll-mt-24" :class="index > 0 ? 'mt-10 border-t border-white/10 pt-10' : ''">
          <h2 class="text-lg font-semibold text-white/90 sm:text-xl">
            <span class="mr-2 text-white/30">{{ index + 1 }}.</span>{{ section.title }}
          </h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph" class="mt-4 leading-relaxed text-white/70">{{ paragraph }}</p>
          <ul v-if="section.bullets?.length" class="mt-4 flex flex-col gap-2 pl-5 text-white/70">
            <li v-for="bullet in section.bullets" :key="bullet" class="list-disc leading-relaxed marker:text-accent">{{ bullet }}</li>
          </ul>
          <p v-if="section.links?.length" class="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <NuxtLink v-for="link in section.links" :key="link.to" :to="link.to" class="font-medium text-accent transition hover:text-accent-hover hover:underline">{{ link.label }}</NuxtLink>
          </p>
        </section>
        <!-- Pages that need more than prose (e.g. the withdrawal form) append it after the numbered sections. -->
        <slot />
      </div>
    </div>
  </article>
</template>
