<script setup lang="ts">
import type { ProductVariantDto } from '~/types/api'

// `isActive` is not part of the §7 DTO (the API only returns active variants); accepted locally so callers can disable options.
type SelectableVariant = ProductVariantDto & { isActive?: boolean }

const props = defineProps<{ variants: SelectableVariant[]; modelValue: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [id: string]; select: [variant: SelectableVariant] }>()

/** Variants grouped by region, preserving API order; variants without region share the '' group. */
const groups = computed(() => {
  const byRegion = new Map<string, SelectableVariant[]>()
  for (const variant of props.variants) {
    const key = variant.region ?? ''
    byRegion.set(key, [...(byRegion.get(key) ?? []), variant])
  }
  return [...byRegion.entries()]
})

function choose(variant: SelectableVariant) {
  if (variant.isActive === false) return
  emit('update:modelValue', variant.id)
  emit('select', variant)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <fieldset v-for="[region, items] in groups" :key="region" class="flex flex-col gap-2">
      <legend v-if="region" class="mb-2 text-xs font-medium uppercase tracking-wide text-white/50">{{ region }}</legend>
      <button
        v-for="variant in items"
        :key="variant.id"
        type="button"
        :disabled="variant.isActive === false"
        :aria-pressed="variant.id === modelValue"
        class="flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40"
        :class="variant.id === modelValue ? 'border-accent bg-accent/10' : 'border-white/10 hover:border-white/30'"
        @click="choose(variant)"
      >
        <span class="font-medium">{{ variant.name }}<span v-if="variant.edition" class="text-white/60"> · {{ variant.edition }}</span></span>
        <span class="ml-auto flex items-baseline gap-2">
          <span class="font-semibold">{{ formatMoney(variant.price, variant.currency) }}</span>
          <span v-if="variant.oldPrice" class="text-xs text-white/40 line-through">{{ formatMoney(variant.oldPrice, variant.currency) }}</span>
        </span>
      </button>
    </fieldset>
  </div>
</template>
