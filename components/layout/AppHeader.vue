<script setup lang="ts">
// Shared with pages/index.vue, which debounces it into the catalog query.
const search = useState('catalog-search', () => '')
const { count, toggle } = useCart()
const { isAuthenticated, isAdmin, displayName, openLogin, signOut } = useAuth()
const { items: notifications, unreadCount, load: loadNotifications, markRead } = useNotifications()
const isAccountMenuOpen = ref(false)
const isNotificationsOpen = ref(false)
// Phones have no room for an inline search box; a toggle reveals it as a second row under the bar.
const isMobileSearchOpen = ref(false)
const mobileSearchInput = ref<HTMLInputElement | null>(null)

// Account indicator shows initials only (no Google photo) — e.g. "Alan Martinez" -> "AM".
const initials = computed(() => {
  const parts = (displayName.value ?? '').trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || '?'
})

function closeAccountMenu() {
  isAccountMenuOpen.value = false
}

async function handleSignOut() {
  closeAccountMenu()
  await signOut()
}

async function openNotification(notificationId: string) {
  isNotificationsOpen.value = false
  await markRead(notificationId)
}

onMounted(() => {
  if (isAuthenticated.value) loadNotifications()
})

watch(isAuthenticated, (authenticated) => {
  if (authenticated) loadNotifications()
  else {
    notifications.value = []
    isNotificationsOpen.value = false
  }
})

async function toggleMobileSearch() {
  isMobileSearchOpen.value = !isMobileSearchOpen.value
  if (!isMobileSearchOpen.value) return
  await nextTick()
  mobileSearchInput.value?.focus()
}

const iconButton = 'relative rounded-xl p-2 text-white/80 transition hover:bg-white/5 hover:text-white'
</script>

<template>
  <header class="glass sticky top-0 z-40 border-x-0 border-t-0">
    <div class="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:h-16 sm:gap-6">
      <NuxtLink to="/" class="flex items-center" aria-label="CHEKEYS">
        <img src="/images/logo/logo_letras.png" alt="CHEKEYS" class="h-10 w-auto sm:h-12" />
      </NuxtLink>
      <!-- `ml-auto` sits on the actions group, not on the search box: the box is hidden on phones,
           so anchoring the margin there left the cart and account floating mid-bar. -->
      <div class="ml-auto flex items-center gap-1 sm:gap-2">
        <label class="relative mr-2 hidden w-64 sm:block md:w-80 lg:mr-4">
          <span class="sr-only">Buscar</span>
          <input v-model="search" type="search" placeholder="Buscar juegos, tarjetas..." class="w-full rounded-xl border border-white/10 bg-bg/60 px-4 py-2 text-sm placeholder:text-white/40 focus:border-accent focus:outline-none" />
        </label>
        <button type="button" aria-label="Buscar" :aria-expanded="isMobileSearchOpen" :class="iconButton" class="sm:hidden" @click="toggleMobileSearch()">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
        <button type="button" aria-label="Carrito" :class="iconButton" @click="toggle()">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6.2" />
            <circle cx="10" cy="20" r="1" /><circle cx="17" cy="20" r="1" />
          </svg>
          <span v-if="count > 0" class="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-accent px-1.5 text-center text-xs font-semibold leading-5 text-white" data-testid="cart-count">{{ count }}</span>
        </button>
        <slot name="account">
          <template v-if="!isAuthenticated">
            <button type="button" aria-label="Iniciar sesión" :class="iconButton" class="sm:hidden" @click="openLogin()">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
              </svg>
            </button>
            <div class="hidden sm:block">
              <AppButton variant="ghost" size="sm" @click="openLogin()">Iniciar sesión</AppButton>
            </div>
          </template>
          <template v-else>
            <div class="relative">
              <button type="button" aria-label="Notificaciones" :aria-expanded="isNotificationsOpen" :class="iconButton" @click="isNotificationsOpen = !isNotificationsOpen">
                <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                </svg>
                <span v-if="unreadCount" class="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-accent px-1.5 text-center text-xs font-semibold leading-5 text-white">{{ unreadCount }}</span>
              </button>
              <div v-if="isNotificationsOpen" class="glass absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-white/10 p-1.5 text-sm">
                <p v-if="!notifications.length" class="px-3 py-2 text-white/60">No tenés notificaciones pendientes.</p>
                <NuxtLink
                  v-for="notification in notifications"
                  :key="notification.id"
                  :to="`/account/orders/${notification.orderId}`"
                  class="block rounded-lg px-3 py-2 text-white/80 transition hover:bg-white/5 hover:text-white"
                  @click="openNotification(notification.id)"
                >
                  <span class="block font-medium">Tus keys están listas</span>
                  <span class="block text-xs text-white/50">Pedido #{{ notification.orderId.slice(0, 8) }}</span>
                </NuxtLink>
              </div>
            </div>
            <div class="relative">
            <button
              type="button"
              class="flex items-center gap-2 rounded-xl p-1.5 text-sm text-white/80 transition hover:bg-white/5 hover:text-white sm:pr-3"
              :aria-expanded="isAccountMenuOpen"
              @click="isAccountMenuOpen = !isAccountMenuOpen"
            >
              <span
                class="flex h-7 w-7 items-center justify-center rounded-full bg-accent/30 text-xs font-semibold"
                :class="isAdmin ? 'ring-2 ring-yellow-300 shadow-[0_0_14px_4px_rgba(250,204,21,0.85)] animate-pulse' : ''"
                aria-hidden="true"
              >
                {{ initials }}
              </span>
              <span class="hidden max-w-[10ch] truncate sm:inline">{{ displayName }}</span>
            </button>
            <div v-if="isAccountMenuOpen" class="glass absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-white/10 p-1.5 text-sm">
              <NuxtLink to="/account/orders" class="block rounded-lg px-3 py-2 text-white/80 transition hover:bg-white/5 hover:text-white" @click="closeAccountMenu()">Mis compras</NuxtLink>
              <NuxtLink v-if="isAdmin" to="/admin" class="block rounded-lg px-3 py-2 text-white/80 transition hover:bg-white/5 hover:text-white" @click="closeAccountMenu()">Panel admin</NuxtLink>
              <button type="button" class="block w-full rounded-lg px-3 py-2 text-left text-white/80 transition hover:bg-white/5 hover:text-white" @click="handleSignOut()">Cerrar sesión</button>
            </div>
            </div>
          </template>
        </slot>
      </div>
    </div>
    <div v-if="isMobileSearchOpen" class="border-t border-white/10 px-4 py-2 sm:hidden">
      <label class="block">
        <span class="sr-only">Buscar</span>
        <input ref="mobileSearchInput" v-model="search" type="search" placeholder="Buscar juegos, tarjetas..." class="w-full rounded-xl border border-white/10 bg-bg/60 px-4 py-2 text-sm placeholder:text-white/40 focus:border-accent focus:outline-none" />
      </label>
    </div>
  </header>
</template>
