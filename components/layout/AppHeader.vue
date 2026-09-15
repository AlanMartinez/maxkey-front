<script setup lang="ts">
// Shared with pages/index.vue, which debounces it into the catalog query.
const search = useState('catalog-search', () => '')
const { count, toggle } = useCart()
const { isAuthenticated, displayName, avatarUrl, openLogin, signOut } = useAuth()
const isAccountMenuOpen = ref(false)

function closeAccountMenu() {
  isAccountMenuOpen.value = false
}

async function handleSignOut() {
  closeAccountMenu()
  await signOut()
}
</script>

<template>
  <header class="glass sticky top-0 z-40 border-x-0 border-t-0">
    <div class="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4">
      <NuxtLink to="/" class="font-display text-xl font-bold tracking-tight text-accent">Chekeys</NuxtLink>
      <label class="relative ml-auto hidden w-full max-w-xs sm:block">
        <span class="sr-only">Buscar</span>
        <input v-model="search" type="search" placeholder="Buscar juegos, tarjetas..." class="w-full rounded-xl border border-white/10 bg-bg/60 px-4 py-2 text-sm placeholder:text-white/40 focus:border-accent focus:outline-none" />
      </label>
      <button type="button" aria-label="Carrito" class="relative rounded-xl p-2 text-white/80 transition hover:bg-white/5 hover:text-white" @click="toggle()">
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6.2" />
          <circle cx="10" cy="20" r="1" /><circle cx="17" cy="20" r="1" />
        </svg>
        <span v-if="count > 0" class="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-accent px-1.5 text-center text-xs font-semibold leading-5 text-white" data-testid="cart-count">{{ count }}</span>
      </button>
      <slot name="account">
        <AppButton v-if="!isAuthenticated" variant="ghost" size="sm" @click="openLogin()">Iniciar sesión</AppButton>
        <div v-else class="relative">
          <button
            type="button"
            class="flex items-center gap-2 rounded-xl p-1.5 pr-3 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
            :aria-expanded="isAccountMenuOpen"
            @click="isAccountMenuOpen = !isAccountMenuOpen"
          >
            <img v-if="avatarUrl" :src="avatarUrl" :alt="displayName ?? ''" class="h-7 w-7 rounded-full object-cover" />
            <span v-else class="flex h-7 w-7 items-center justify-center rounded-full bg-accent/30 text-xs font-semibold" aria-hidden="true">
              {{ (displayName ?? '?').charAt(0).toUpperCase() }}
            </span>
            <span class="hidden max-w-[10ch] truncate sm:inline">{{ displayName }}</span>
          </button>
          <div v-if="isAccountMenuOpen" class="glass absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-white/10 p-1.5 text-sm">
            <NuxtLink to="/account/orders" class="block rounded-lg px-3 py-2 text-white/80 transition hover:bg-white/5 hover:text-white" @click="closeAccountMenu()">Mis compras</NuxtLink>
            <button type="button" class="block w-full rounded-lg px-3 py-2 text-left text-white/80 transition hover:bg-white/5 hover:text-white" @click="handleSignOut()">Cerrar sesión</button>
          </div>
        </div>
      </slot>
    </div>
  </header>
</template>
