<script setup lang="ts">
import type { ToastTone } from '~/composables/useToast'

// Single floating stack for `useToast()` notifications, mounted once in app.vue (like CartDrawer /
// LoginDialog). Bottom-right, newest at the bottom, each auto-dismissed by the composable. Same tone
// palette as AppBadge: error = red-300, warning = amber-300, success = the `success` token.
const { toasts, dismiss } = useToast()

const tones: Record<ToastTone, { border: string; icon: string; role: 'alert' | 'status' }> = {
  error: { border: 'border-l-red-400', icon: 'text-red-300', role: 'alert' },
  warning: { border: 'border-l-amber-400', icon: 'text-amber-300', role: 'status' },
  success: { border: 'border-l-success', icon: 'text-success', role: 'status' },
}
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div aria-live="polite" class="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2">
        <TransitionGroup
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-2 opacity-0"
          leave-active-class="transition duration-150 ease-in"
          leave-to-class="translate-y-2 opacity-0"
        >
          <div
            v-for="toast in toasts"
            :key="toast.id"
            :role="tones[toast.tone].role"
            data-testid="toast"
            :data-tone="toast.tone"
            class="glass pointer-events-auto flex items-start gap-3 rounded-xl border-l-4 py-3 pl-4 pr-3 text-sm shadow-lg"
            :class="tones[toast.tone].border"
          >
            <svg class="mt-0.5 h-4 w-4 shrink-0" :class="tones[toast.tone].icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path v-if="toast.tone === 'success'" d="M5 13l4 4L19 7" />
              <template v-else>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4M12 16h.01" />
              </template>
            </svg>
            <p class="min-w-0 flex-1 break-words text-white/90">{{ toast.message }}</p>
            <button type="button" aria-label="Cerrar" class="-m-1 shrink-0 rounded-lg p-1 text-white/50 transition hover:bg-white/5 hover:text-white" @click="dismiss(toast.id)">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </ClientOnly>
</template>
