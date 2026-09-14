<script setup lang="ts">
import type { CheckoutStatus } from '~/composables/useCheckout'

const props = defineProps<{ status: CheckoutStatus }>()
const busy = computed(() => props.status === 'submitting' || props.status === 'redirecting')
</script>

<template>
  <AppButton type="submit" size="lg" class="w-full" :loading="busy">
    <img v-if="!busy" src="/images/brands/mercado-pago.svg" alt="" aria-hidden="true" width="32" height="32" class="h-8 w-8 flex-none" />
    {{ status === 'redirecting' ? 'Redirigiendo a Mercado Pago…' : 'Pagar con Mercado Pago' }}
  </AppButton>
</template>
