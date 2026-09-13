<script setup lang="ts">
withDefaults(defineProps<{ modelValue: string; disabled?: boolean; error?: string | null }>(), { disabled: false, error: null })
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <section class="glass flex flex-col gap-4 rounded-2xl p-6">
    <h2 class="text-lg font-semibold">Contacto</h2>
    <label class="flex flex-col gap-2 text-sm">
      <span class="text-white/70">Tu email</span>
      <input
        type="email"
        name="email"
        autocomplete="email"
        placeholder="vos@ejemplo.com"
        class="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
        :value="modelValue"
        :disabled="disabled"
        :aria-invalid="!!error"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </label>
    <p class="text-xs text-white/50">Te enviamos las keys a este correo.</p>
    <p v-if="error" role="alert" class="text-sm text-red-300">{{ error }}</p>
  </section>
</template>
