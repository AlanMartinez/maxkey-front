<script setup lang="ts">
import type { ProductVariantDto } from '~/types/api'

// `isActive` is not part of the §7 DTO (the API only returns active variants); accepted locally so callers can disable options.
type SelectableVariant = ProductVariantDto & { isActive?: boolean }

const props = withDefaults(defineProps<{ variants: SelectableVariant[]; modelValue: string | null; recommendedId?: string | null }>(), { recommendedId: null })
const emit = defineEmits<{ 'update:modelValue': [id: string]; select: [variant: SelectableVariant] }>()

function choose(variant: SelectableVariant) {
  if (variant.isActive === false) return
  emit('update:modelValue', variant.id)
  emit('select', variant)
}
</script>

<template>
  <fieldset class="flex flex-col gap-2.5">
    <legend class="mb-2.5 text-sm font-semibold text-white/60">Elegí el monto</legend>
    <div class="flex flex-col gap-2.5" role="group" aria-label="Elegí el monto">
      <button
        v-for="variant in variants"
        :key="variant.id"
        type="button"
        :disabled="variant.isActive === false"
        :aria-pressed="variant.id === modelValue"
        class="flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40"
        :class="variant.id === modelValue ? 'border-accent bg-accent/15' : 'border-white/10 bg-surface hover:border-white/30'"
        @click="choose(variant)"
      >
        <span class="flex flex-col">
          <span class="font-semibold">{{ variant.name }}<span v-if="variant.edition" class="font-normal text-white/60"> · {{ variant.edition }}</span></span>
          <span v-if="variant.id === recommendedId" class="mt-0.5 text-[11px] font-medium text-accent">Más elegido</span>
        </span>
        <span class="flex flex-col items-end">
          <span class="font-display font-bold">{{ formatMoney(variant.price, variant.currency) }}</span>
          <span v-if="variant.oldPrice" class="text-xs text-white/40 line-through">{{ formatMoney(variant.oldPrice, variant.currency) }}</span>
        </span>
      </button>
    </div>
  </fieldset>
</template>
