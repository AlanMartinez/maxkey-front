<script setup lang="ts">
import type { ProductDetail } from '~/types/api'
import { DELIVERY_INLINE } from '~/utils/promises'

const emptyDescription = `Elegí un producto, pagá con Mercado Pago y recibí tu key ${DELIVERY_INLINE}.`

const { isOpen, isEmpty, lines, subtotal, close, remove, setQuantity, updatePrices } = useCart()
const api = useApi()
let refreshVersion = 0

async function refreshPrices() {
  const version = ++refreshVersion
  const details = await Promise.all(
    [...new Set(lines.value.map((line) => line.productSlug))].map(async (slug) => {
      try {
        return await api<ProductDetail>(`/catalog/products/${slug}`)
      } catch {
        return null
      }
    }),
  )
  if (version !== refreshVersion) return
  updatePrices(details.flatMap((detail) => detail?.variants.map((variant) => ({
    variantId: variant.id,
    unitPrice: variant.price,
    currency: variant.currency,
  })) ?? []))
}

watch(isOpen, (open) => {
  if (open && !isEmpty.value) void refreshPrices()
}, { immediate: true })

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// /checkout is delivered in the checkout slice (PR16); the drawer only links to it.
function goToCheckout() {
  close()
  return navigateTo('/checkout')
}

function goToCatalog() {
  close()
  return navigateTo('/#catalogo')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-black/60" aria-hidden="true" @click="close()" />
      <aside role="dialog" aria-modal="true" aria-labelledby="cart-title" class="glass relative flex h-full w-full max-w-md flex-col border-y-0 border-r-0">
        <header class="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 id="cart-title" class="text-lg font-semibold">Tu carrito</h2>
          <button type="button" aria-label="Cerrar" class="rounded-xl p-2 text-white/70 transition hover:bg-white/5 hover:text-white" @click="close()">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>
        <div class="flex-1 overflow-y-auto px-6">
          <EmptyState v-if="isEmpty" class="my-6 border-0 bg-transparent" title="Tu carrito está vacío" :description="emptyDescription">
            <AppButton variant="ghost" @click="goToCatalog()">Ver ofertas</AppButton>
          </EmptyState>
          <ul v-else class="divide-y divide-white/10">
            <CartLine v-for="line in lines" :key="line.variantId" :line="line" @update:quantity="setQuantity(line.variantId, $event)" @remove="remove(line.variantId)" />
          </ul>
        </div>
        <footer v-if="!isEmpty" class="flex flex-col gap-4 border-t border-white/10 px-6 py-5">
          <p class="flex items-baseline justify-between text-sm">
            <span class="text-white/60">Subtotal</span>
            <span class="text-xl font-bold">{{ formatMoney(subtotal, lines[0]?.currency) }}</span>
          </p>
          <AppButton size="lg" @click="goToCheckout()">Ir a pagar</AppButton>
        </footer>
      </aside>
    </div>
  </Teleport>
</template>
