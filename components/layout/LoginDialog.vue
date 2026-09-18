<script setup lang="ts">
const { isLoginOpen, closeLogin, signInWithGoogle } = useAuth()
const pending = ref(false)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeLogin()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

async function continueWithGoogle() {
  pending.value = true
  try {
    await signInWithGoogle()
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isLoginOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60" aria-hidden="true" @click="closeLogin()" />
      <div role="dialog" aria-modal="true" aria-labelledby="login-title" class="glass relative flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl p-6 text-center">
        <button type="button" aria-label="Cerrar" class="absolute right-3 top-3 rounded-xl p-2 text-white/70 transition hover:bg-white/5 hover:text-white" @click="closeLogin()">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <img id="login-title" src="/images/logo/logo.png" alt="Iniciar sesión en CHEKEYS" width="80" height="80" class="mt-2 h-20 w-20 object-contain" />
        <p class="text-sm text-white/60">Accedé para ver tu historial de compras y tus keys.</p>
        <AppButton variant="ghost" size="lg" class="w-full border-[#8E918F] bg-[#131314] text-[#E3E3E3]" :loading="pending" @click="continueWithGoogle()">
          <img v-if="!pending" src="/images/brands/google-g.png" alt="" aria-hidden="true" width="20" height="20" class="h-5 w-5 flex-none rounded-full bg-white" />
          Continuar con Google
        </AppButton>
        <p class="text-xs text-white/40">Puedes comprar sin cuenta; el email es suficiente.</p>
      </div>
    </div>
  </Teleport>
</template>
