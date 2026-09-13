<script setup lang="ts">
const props = defineProps<{ images: string[]; alt: string }>()

const activeIndex = ref(0)
const active = computed(() => props.images[activeIndex.value] ?? props.images[0])
watch(() => props.images, () => (activeIndex.value = 0))
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="glass aspect-[4/3] overflow-hidden rounded-2xl bg-white/5">
      <img v-if="active" :src="active" :alt="alt" class="h-full w-full object-cover" />
    </div>
    <!-- Thumbnails only make sense with a real gallery; a single image renders no empty tiles. -->
    <div v-if="images.length > 1" class="grid grid-cols-4 gap-3" role="tablist" aria-label="Vistas del producto">
      <button
        v-for="(image, i) in images"
        :key="`${i}-${image}`"
        type="button"
        role="tab"
        :aria-selected="i === activeIndex"
        :aria-label="`Vista ${i + 1}`"
        class="glass aspect-square overflow-hidden rounded-xl bg-white/5 transition"
        :class="i === activeIndex ? 'border-accent ring-1 ring-accent/60' : 'hover:border-white/30'"
        @click="activeIndex = i"
      >
        <img :src="image" :alt="`${alt} — vista ${i + 1}`" loading="lazy" class="h-full w-full object-cover" />
      </button>
    </div>
  </div>
</template>
