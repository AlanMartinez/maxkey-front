export type ToastTone = 'error' | 'warning' | 'success'

export interface Toast {
  id: number
  tone: ToastTone
  message: string
}

export const TOAST_DEFAULT_DURATION = 5000
/** Oldest toasts are dropped past this so a burst of failures never covers the whole screen. */
export const TOAST_MAX = 5

// Module-level so the same timers are shared by every `useToast()` caller in the app instance.
// Only ever populated from `push`, which runs on the client (no timers at import time — SSR-safe).
const timers = new Map<number, ReturnType<typeof setTimeout>>()
let nextId = 1

/**
 * Global floating notifications rendered once by `AppToast` (mounted in app.vue) — same shared
 * `useState` pattern as `useCart`/`useAuth`, so any composable or page can push feedback without
 * owning a slot in the layout. Admin action results go through here instead of inline `role="alert"`
 * text so tables never widen/scroll because of a message.
 */
export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function dismiss(id: number) {
    const timer = timers.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      timers.delete(id)
    }
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function push(tone: ToastTone, message: string, options: { duration?: number } = {}) {
    const id = nextId++
    const duration = options.duration ?? TOAST_DEFAULT_DURATION
    const next = [...toasts.value, { id, tone, message }]
    // Drop the oldest, clearing their timers so they don't fire against an already-removed id.
    while (next.length > TOAST_MAX) {
      const dropped = next.shift()!
      const timer = timers.get(dropped.id)
      if (timer !== undefined) clearTimeout(timer)
      timers.delete(dropped.id)
    }
    toasts.value = next
    if (duration > 0) timers.set(id, setTimeout(() => dismiss(id), duration))
    return id
  }

  return {
    toasts: readonly(toasts),
    push,
    dismiss,
    error: (message: string) => push('error', message),
    warning: (message: string) => push('warning', message),
    success: (message: string) => push('success', message),
  }
}
