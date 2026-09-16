<script setup lang="ts">
import { isValidEmail } from '~/composables/useCheckout'

useHead({ title: 'Checkout · CHEKEYS' })

const { lines, subtotal, isEmpty } = useCart()
const { status, error, errorMessage, paymentMethod, submit } = useCheckout()
// Prefills from the signed-in user's email but keeps it editable — an edited email still links the order
// to the account server-side via the bearer token, per auth spec.
const { email: authEmail } = useAuth()
const email = ref(authEmail.value ?? '')
const validation = ref<string | null>(null)
const busy = computed(() => status.value === 'submitting' || status.value === 'redirecting')
// 422 belongs to the email field; anything else is shown next to the pay button.
const fieldError = computed(() => validation.value ?? (error.value?.status === 422 ? errorMessage.value : null))
const generalError = computed(() => (error.value && error.value.status !== 422 ? errorMessage.value : null))

async function pay() {
  validation.value = isValidEmail(email.value) ? null : 'Ingresá un email válido.'
  if (!validation.value) await submit(email.value)
}
</script>

<template>
  <!-- The cart hydrates from localStorage after mount, so the page renders client-side only to avoid an empty-state flash. -->
  <ClientOnly>
    <template #fallback><Skeleton class="h-64 w-full" /></template>
    <EmptyState v-if="isEmpty" title="Tu carrito está vacío" description="Agregá productos para continuar con el pago.">
      <NuxtLink to="/"><AppButton variant="ghost">Volver al catálogo</AppButton></NuxtLink>
    </EmptyState>
    <form v-else class="grid items-start gap-6 lg:grid-cols-[1fr_380px]" novalidate @submit.prevent="pay()">
      <div class="flex flex-col gap-6">
        <h1 class="text-3xl font-bold">Checkout</h1>
        <ContactForm v-model="email" :disabled="busy" :error="fieldError" />
        <PaymentMethodSelector v-model="paymentMethod" :disabled="busy" />
      </div>
      <OrderSummary :lines="lines" :subtotal="subtotal">
        <PayWithMercadoPago :status="status" />
        <p v-if="generalError" role="alert" class="text-center text-sm text-red-300">{{ generalError }}</p>
      </OrderSummary>
    </form>
  </ClientOnly>
</template>
