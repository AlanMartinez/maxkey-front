<script setup lang="ts">
import type { OrderStatus } from '~/types/api'

const props = defineProps<{ status: OrderStatus }>()

type StepState = 'done' | 'active' | 'todo'

// Only `Delivered` means the buyer can actually see the key (key-delivery-gate: KeysAssigned is an
// internal step, an admin still has to confirm delivery). Marking it done earlier promised a key
// that was not there yet.
const steps = computed<{ label: string; state: StepState }[]>(() => {
  const delivered = props.status === 'Delivered'
  return [
    { label: 'Pago confirmado', state: 'done' },
    { label: 'Preparando tu key', state: delivered ? 'done' : 'active' },
    { label: 'Key entregada', state: delivered ? 'done' : 'todo' },
  ]
})

const marker: Record<StepState, string> = {
  done: 'border-success/60 bg-success/15 text-success',
  active: 'border-accent text-accent',
  todo: 'border-white/15 text-white/30',
}
</script>

<template>
  <ol aria-label="Estado del pedido" class="flex w-full max-w-xs flex-col gap-2.5 text-left text-sm">
    <li v-for="step in steps" :key="step.label" :data-state="step.state" class="flex items-center gap-3">
      <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border" :class="marker[step.state]">
        <svg v-if="step.state === 'done'" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
        <span v-else-if="step.state === 'active'" class="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden="true" />
      </span>
      <span :class="step.state === 'todo' ? 'text-white/40' : 'text-white/80'">{{ step.label }}</span>
    </li>
  </ol>
</template>
