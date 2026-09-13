<script setup lang="ts">
import type { CheckoutStatus } from '~/composables/useCheckout'

const props = defineProps<{ status: CheckoutStatus }>()
const busy = computed(() => props.status === 'submitting' || props.status === 'redirecting')
</script>

<template>
  <AppButton type="submit" size="lg" class="w-full" :loading="busy">
    <span v-if="!busy" class="rounded bg-[#009EE3] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white" aria-hidden="true">MP</span>
    {{ status === 'redirecting' ? 'Redirigiendo a Mercado Pago…' : 'Pagar con Mercado Pago' }}
  </AppButton>
</template>
