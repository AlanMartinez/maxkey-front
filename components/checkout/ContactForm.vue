<script setup lang="ts">
import { isValidEmail, isValidPhone } from '~/composables/useCheckout'

// The phone field only shows for bank transfers (`askPhone`), where it is required so we can reach the
// buyer while the transfer is validated. It uses `v-model:phone`, independent from the email model.
const props = withDefaults(
  defineProps<{ modelValue: string; disabled?: boolean; error?: string | null; askPhone?: boolean; phone?: string; phoneError?: string | null }>(),
  { disabled: false, error: null, askPhone: false, phone: '', phoneError: null },
)
const emit = defineEmits<{ 'update:modelValue': [value: string]; 'update:phone': [value: string] }>()

// Feedback (check or error) only starts after the first blur, so a half-typed address is never flagged either way.
const touched = ref(false)
const valid = computed(() => isValidEmail(props.modelValue))
const localError = computed(() => (touched.value && !valid.value ? 'Ingresá un email válido.' : null))
const shownError = computed(() => props.error ?? localError.value)
const confirmed = computed(() => touched.value && !shownError.value && valid.value)

// Same blur-first rule for the phone.
const phoneTouched = ref(false)
const phoneValid = computed(() => isValidPhone(props.phone))
const phoneLocalError = computed(() => (phoneTouched.value && !phoneValid.value ? 'Ingresá un teléfono válido, con código de área.' : null))
const shownPhoneError = computed(() => props.phoneError ?? phoneLocalError.value)
const phoneConfirmed = computed(() => phoneTouched.value && !shownPhoneError.value && phoneValid.value)

function onBlur() {
  touched.value = true
  const normalized = props.modelValue.trim().toLowerCase()
  if (normalized !== props.modelValue) emit('update:modelValue', normalized)
}

function onPhoneBlur() {
  phoneTouched.value = true
  const trimmed = props.phone.trim()
  if (trimmed !== props.phone) emit('update:phone', trimmed)
}
</script>

<template>
  <section class="glass flex flex-col gap-4 rounded-2xl p-6">
    <h2 class="text-lg font-semibold">Contacto</h2>
    <label class="flex flex-col gap-2 text-sm">
      <span class="text-white/70">Tu email</span>
      <span class="relative flex items-center">
        <input
          type="email"
          name="email"
          autocomplete="email"
          spellcheck="false"
          autocapitalize="off"
          required
          placeholder="vos@ejemplo.com"
          class="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 pr-11 text-base text-white outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
          :class="{ 'border-success/60': confirmed, 'border-red-400/60': shownError }"
          :value="modelValue"
          :disabled="disabled"
          :aria-invalid="shownError ? 'true' : 'false'"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          @blur="onBlur"
        />
        <svg v-if="confirmed" data-valid class="pointer-events-none absolute right-4 h-5 w-5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
      </span>
    </label>
    <p class="text-xs text-white/50">Acá te llega la key. Revisá que esté bien escrito.</p>
    <p v-if="shownError" role="alert" class="text-sm text-red-300">{{ shownError }}</p>

    <template v-if="askPhone">
      <label class="flex flex-col gap-2 text-sm">
        <span class="text-white/70">Tu teléfono</span>
        <span class="relative flex items-center">
          <input
            type="tel"
            name="phone"
            autocomplete="tel"
            inputmode="tel"
            required
            placeholder="11 2345 6789"
            class="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 pr-11 text-base text-white outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
            :class="{ 'border-success/60': phoneConfirmed, 'border-red-400/60': shownPhoneError }"
            :value="phone"
            :disabled="disabled"
            :aria-invalid="shownPhoneError ? 'true' : 'false'"
            @input="$emit('update:phone', ($event.target as HTMLInputElement).value)"
            @blur="onPhoneBlur"
          />
          <svg v-if="phoneConfirmed" data-phone-valid class="pointer-events-none absolute right-4 h-5 w-5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
        </span>
      </label>
      <p class="text-xs text-white/50">Lo usamos solo si necesitamos contactarte por tu transferencia.</p>
      <p v-if="shownPhoneError" role="alert" data-phone-error class="text-sm text-red-300">{{ shownPhoneError }}</p>
    </template>
  </section>
</template>
