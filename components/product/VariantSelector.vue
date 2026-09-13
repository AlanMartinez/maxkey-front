<script setup lang="ts">
import type { ProductVariantDto } from '~/types/api'

// `isActive` is not part of the §7 DTO (the API only returns active variants); accepted locally so callers can disable options.
type SelectableVariant = ProductVariantDto & { isActive?: boolean }

const props = withDefaults(defineProps<{ variants: SelectableVariant[]; modelValue: string | null; recommendedId?: string | null }>(), { recommendedId: null })
const emit = defineEmits<{ 'update:modelValue': [id: string]; select: [variant: SelectableVariant] }>()

/** Distinct regions in API order; empty when no variant exposes one (then the chip row is omitted). */
const regions = computed(() => [...new Set(props.variants.map((v) => v.region).filter((r): r is string => !!r))])

const selected = computed(() => props.variants.find((v) => v.id === props.modelValue))
const region = ref<string | null>(selected.value?.region ?? regions.value[0] ?? null)
// Follows an external selection change (e.g. the parent resets the model) so chips and rows never disagree.
watch(() => selected.value?.region, (value) => { if (value) region.value = value })

/** Rows shown under "Elegí el monto": the variants of the active region, or every variant when regions are absent. */
const rows = computed(() => (region.value ? props.variants.filter((v) => v.region === region.value) : props.variants))

function choose(variant: SelectableVariant) {
  if (variant.isActive === false) return
  emit('update:modelValue', variant.id)
  emit('select', variant)
}

// Switching region keeps the selection valid by moving it to the first selectable row of that region.
function chooseRegion(value: string) {
  region.value = value
  if (selected.value?.region === value) return
  const first = props.variants.find((v) => v.region === value && v.isActive !== false)
  if (first) choose(first)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <fieldset v-if="regions.length" class="flex flex-col gap-2.5">
      <legend class="mb-2.5 text-sm font-semibold text-white/60">Elegí tu región</legend>
      <div class="flex flex-wrap gap-2" role="group" aria-label="Elegí tu región">
        <button
          v-for="value in regions"
          :key="value"
          type="button"
          :aria-pressed="value === region"
          class="rounded-lg border px-3.5 py-2 text-sm transition"
          :class="value === region ? 'border-accent bg-accent/15 font-semibold text-white' : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white'"
          @click="chooseRegion(value)"
        >
          {{ value }}
        </button>
      </div>
    </fieldset>

    <fieldset class="flex flex-col gap-2.5">
      <legend class="mb-2.5 text-sm font-semibold text-white/60">Elegí el monto</legend>
      <div class="flex flex-col gap-2.5" role="group" aria-label="Elegí el monto">
        <button
          v-for="variant in rows"
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
  </div>
</template>
