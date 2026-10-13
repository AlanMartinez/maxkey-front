<script setup lang="ts">
import { isValidEmail, isValidPhone, PAYMENT_METHODS } from '~/composables/useCheckout'

useHead({ title: 'Checkout · Chekeys' })

const { lines, subtotal, isEmpty } = useCart()
// The cart may have been saved a while ago: drop anything no longer on sale before the buyer pays for it.
const { sync, removed } = useCartSync()
onMounted(() => void sync())
const { status, error, errorMessage, paymentMethod, transferDetails, loadTransferDetails, submit } = useCheckout()
// Prefills from the signed-in user's email but keeps it editable — an edited email still links the order
// to the account server-side via the bearer token, per auth spec.
const { email: authEmail } = useAuth()
const email = ref(authEmail.value ?? '')
const phone = ref('')
const validation = ref<string | null>(null)
const phoneValidation = ref<string | null>(null)
const busy = computed(() => status.value === 'submitting' || status.value === 'redirecting')
const isTransfer = computed(() => paymentMethod.value === 'bank-transfer')
const currency = computed(() => lines.value[0]?.currency)

// Bank transfer is only offered while the backend exposes a destination account (200; 404 = disabled).
onMounted(loadTransferDetails)
const availableMethods = computed(() => PAYMENT_METHODS.filter((m) => m.id !== 'bank-transfer' || transferDetails.value))

// 422 belongs to a field: `errors.phone` to the phone, `errors.paymentMethod` (no input of its own) next to
// the pay button, anything else to the email. Other failures are shown next to the pay button too.
const serverFieldErrors = computed(() => (error.value?.status === 422 ? error.value.problem.errors ?? {} : null))
const phoneFieldError = computed(() => phoneValidation.value ?? serverFieldErrors.value?.phone?.[0] ?? null)
const fieldError = computed(() => {
  if (validation.value) return validation.value
  const errors = serverFieldErrors.value
  if (!errors) return null
  return errors.email?.[0] ?? (errors.phone || errors.paymentMethod ? null : errorMessage.value)
})
const generalError = computed(() => {
  if (!error.value) return null
  if (error.value.status !== 422) return errorMessage.value
  return serverFieldErrors.value?.paymentMethod?.[0] ?? null
})

// Transfers are confirmed in a modal first: the buyer states the money is already sent, which we can't undo.
const confirmingTransfer = ref(false)
const transferConfirmBody = computed(() => {
  const amount = formatMoney(subtotal.value, currency.value)
  return `Confirmá que transferiste ${amount} al alias ${transferDetails.value?.alias ?? ''}. Vamos a validar la transferencia y, cuando la confirmemos, te enviamos la key por email.`
})

// Whitespace and capitalisation are forgiven: the address is normalised once here, before validation and submit.
async function pay() {
  const normalized = email.value.trim().toLowerCase()
  validation.value = isValidEmail(normalized) ? null : 'Ingresá un email válido.'
  phoneValidation.value = isTransfer.value && !isValidPhone(phone.value) ? 'Ingresá un teléfono válido, con código de área.' : null
  if (validation.value || phoneValidation.value) return
  email.value = normalized
  if (isTransfer.value) {
    confirmingTransfer.value = true
    return
  }
  await submit(normalized)
}

async function confirmTransfer() {
  const ok = await submit(email.value, phone.value)
  // On failure the modal closes so the field/general error next to the form is visible.
  if (!ok) confirmingTransfer.value = false
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
        <CheckoutSteps :current="1" />
        <h1 class="text-3xl font-bold">Checkout</h1>
        <p v-if="removed" role="status" class="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-300">
          Quitamos {{ removed === 1 ? 'un producto que ya no está disponible' : `${removed} productos que ya no están disponibles` }} de tu carrito.
        </p>
        <ContactForm
          v-model="email"
          v-model:phone="phone"
          :disabled="busy"
          :error="fieldError"
          :ask-phone="isTransfer"
          :phone-error="phoneFieldError"
        />
        <PaymentMethodSelector v-model="paymentMethod" :methods="availableMethods" :disabled="busy" />
        <BankTransferPanel v-if="isTransfer && transferDetails" :details="transferDetails" :amount="subtotal" :currency="currency" />
      </div>
      <OrderSummary :lines="lines" :subtotal="subtotal">
        <AppButton v-if="isTransfer" type="submit" size="lg" class="w-full" :loading="busy">Ya transferí</AppButton>
        <PayWithMercadoPago v-else :status="status" />
        <!-- The note is about Mercado Pago card handling, which does not apply to a transfer. -->
        <SecureCheckoutNote v-if="!isTransfer" />
        <p v-if="generalError" role="alert" class="text-center text-sm text-red-300">{{ generalError }}</p>
      </OrderSummary>
    </form>
    <ConfirmDialog
      v-if="confirmingTransfer"
      title="¿Ya hiciste la transferencia?"
      :body="transferConfirmBody"
      confirm-label="Sí, ya transferí"
      cancel-label="Volver"
      :loading="busy"
      @confirm="confirmTransfer"
      @cancel="confirmingTransfer = false"
    />
  </ClientOnly>
</template>
