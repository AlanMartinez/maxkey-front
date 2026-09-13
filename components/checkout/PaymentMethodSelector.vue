<script setup lang="ts">
import type { PaymentMethod } from '~/composables/useCheckout'
import { PAYMENT_METHODS } from '~/composables/useCheckout'

withDefaults(defineProps<{ modelValue: PaymentMethod | null; disabled?: boolean }>(), { disabled: false })
defineEmits<{ 'update:modelValue': [value: PaymentMethod] }>()
</script>

<template>
  <section class="glass flex flex-col gap-4 rounded-2xl p-6">
    <h2 id="payment-method-heading" class="text-lg font-semibold">Método de pago</h2>
    <div class="flex flex-col gap-2.5" role="radiogroup" aria-labelledby="payment-method-heading">
      <label
        v-for="method in PAYMENT_METHODS"
        :key="method.id"
        class="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 transition has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
        :class="method.id === modelValue ? 'border-accent bg-accent/15' : 'border-white/15 bg-surface hover:border-white/30'"
      >
        <span class="flex items-center gap-3">
          <input
            type="radio"
            name="payment-method"
            class="peer sr-only"
            :value="method.id"
            :checked="method.id === modelValue"
            :disabled="disabled"
            required
            @change="$emit('update:modelValue', method.id)"
          />
          <span
            class="h-4 w-4 shrink-0 rounded-full border-2 transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
            :class="method.id === modelValue ? 'border-accent bg-accent shadow-[inset_0_0_0_3px_#12121A]' : 'border-white/30'"
            aria-hidden="true"
          />
          <span class="flex flex-col">
            <span class="text-sm font-semibold">{{ method.name }}</span>
            <span class="text-xs text-white/50">{{ method.description }}</span>
          </span>
        </span>
        <AppBadge v-if="method.id === 'mercadopago'" tone="accent">Recomendado</AppBadge>
      </label>
    </div>
  </section>
</template>
