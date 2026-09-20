import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearNuxtState } from '#app'
import { TOAST_DEFAULT_DURATION, TOAST_MAX, useToast } from '~/composables/useToast'

beforeEach(() => {
  vi.useFakeTimers()
  // Drops the shared `useState` entries so each test gets a fresh toast list.
  clearNuxtState()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToast', () => {
  it('push adds a toast with its tone and message, shared across callers', () => {
    const toast = useToast()

    const id = toast.error('Ocurrió un error inesperado.')

    expect(toast.toasts.value).toEqual([{ id, tone: 'error', message: 'Ocurrió un error inesperado.' }])
    expect(useToast().toasts.value).toHaveLength(1)
  })

  it('exposes tone helpers for warning and success', () => {
    const toast = useToast()

    toast.warning('Sin stock suficiente')
    toast.success('Guardado')

    expect(toast.toasts.value.map((t) => t.tone)).toEqual(['warning', 'success'])
  })

  it('auto-dismisses after the default duration', () => {
    const toast = useToast()

    toast.error('boom')
    vi.advanceTimersByTime(TOAST_DEFAULT_DURATION - 1)
    expect(toast.toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(1)
    expect(toast.toasts.value).toHaveLength(0)
  })

  it('honours a custom duration on push', () => {
    const toast = useToast()

    toast.push('success', 'quick', { duration: 100 })
    vi.advanceTimersByTime(100)

    expect(toast.toasts.value).toHaveLength(0)
  })

  it('dismiss(id) removes the toast immediately and clears its timer', () => {
    const toast = useToast()
    const keep = toast.error('keep')
    const gone = toast.error('gone')

    toast.dismiss(gone)

    expect(toast.toasts.value.map((t) => t.id)).toEqual([keep])
    expect(vi.getTimerCount()).toBe(1)
  })

  it('caps the queue, dropping the oldest toasts first', () => {
    const toast = useToast()

    for (let i = 1; i <= TOAST_MAX + 2; i++) toast.error(`toast ${i}`)

    expect(toast.toasts.value).toHaveLength(TOAST_MAX)
    expect(toast.toasts.value[0]?.message).toBe('toast 3')
    expect(toast.toasts.value.at(-1)?.message).toBe(`toast ${TOAST_MAX + 2}`)
    // Dropped toasts had their timers cleared — only the surviving ones are still scheduled.
    expect(vi.getTimerCount()).toBe(TOAST_MAX)
  })
})
