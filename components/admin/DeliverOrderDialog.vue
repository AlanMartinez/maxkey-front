<script setup lang="ts">
import type { AdminBuyerOrder } from '~/types/api'
import { ApiError } from '~/composables/useApi'

// Confirmation modal for "Entregar". Delivery is the one irreversible step in the buyers flow (it
// emails the keys and flips the order to Delivered), so it's the only action that asks first.
// Assign/resend stay one-click. Same Teleport + glass dialog pattern as VaultVariantRow.vue.
const props = defineProps<{
  email: string
  order: AdminBuyerOrder
  loading: boolean
  error: ApiError | null
}>()
const emit = defineEmits<{ confirm: [orderId: string]; close: [] }>()

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !props.loading) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

const keysToDeliver = computed(() => props.order.items.reduce((sum, i) => sum + (i.assignedKeys ?? 0), 0))
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60" aria-hidden="true" @click="!loading && emit('close')" />
      <div role="dialog" aria-modal="true" aria-labelledby="deliver-order-title" class="glass relative flex w-full max-w-md flex-col gap-5 rounded-2xl p-6">
        <button
          type="button"
          aria-label="Cerrar"
          class="absolute right-3 top-3 rounded-xl p-2 text-white/70 transition hover:bg-white/5 hover:text-white"
          :disabled="loading"
          @click="emit('close')"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <div class="flex flex-col gap-1 pr-8">
          <h2 id="deliver-order-title" class="text-lg font-semibold">Confirmar entrega</h2>
          <p class="text-sm text-white/60">Se enviarán las keys por email al comprador y el pedido pasará a <strong class="text-white">Entregado</strong>.</p>
        </div>

        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
          <dt class="text-white/50">Comprador</dt>
          <dd class="truncate">{{ email }}</dd>
          <dt class="text-white/50">Pedido</dt>
          <dd class="font-mono text-xs text-white/70">{{ order.id.slice(0, 8) }}</dd>
          <dt class="text-white/50">Keys</dt>
          <dd>{{ keysToDeliver }} asignada(s)</dd>
          <dt class="text-white/50">Items</dt>
          <dd>
            <ul class="flex flex-col gap-0.5">
              <li v-for="(item, i) in order.items" :key="i" class="text-white/80">
                {{ item.productName }} <span class="text-white/50">— {{ item.variantName }} × {{ item.quantity }}</span>
              </li>
            </ul>
          </dd>
        </dl>

        <p v-if="error" role="alert" class="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{{ error.friendlyMessage() }}</p>

        <div class="flex justify-end gap-2">
          <AppButton type="button" variant="ghost" :disabled="loading" @click="emit('close')">Cancelar</AppButton>
          <AppButton type="button" variant="success" :loading="loading" @click="emit('confirm', order.id)">Entregar</AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
