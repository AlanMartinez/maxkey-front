import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { clearNuxtState } from '#app'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppToast from '~/components/ui/AppToast.vue'
import { useToast } from '~/composables/useToast'

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

beforeEach(() => clearNuxtState())
// Teleported content lives in document.body; unmount so a stale stack never leaks into the next test.
afterEach(() => wrapper?.unmount())

function renderedToasts() {
  return Array.from(document.body.querySelectorAll<HTMLElement>('[data-testid="toast"]'))
}

describe('AppToast', () => {
  it('renders nothing until a toast is pushed', async () => {
    wrapper = await mountSuspended(AppToast)

    expect(renderedToasts()).toHaveLength(0)
  })

  it('renders each toast with its message and tone-driven role', async () => {
    wrapper = await mountSuspended(AppToast)
    const toast = useToast()

    toast.error('No tenés permisos para esta acción.')
    toast.warning('Sin stock suficiente: 1 de 3 clave(s) asignada(s).')
    await nextTick()

    const [error, warning] = renderedToasts()
    expect(error?.textContent).toContain('No tenés permisos para esta acción.')
    expect(error?.getAttribute('role')).toBe('alert')
    expect(error?.dataset.tone).toBe('error')
    expect(warning?.textContent).toContain('Sin stock suficiente')
    expect(warning?.getAttribute('role')).toBe('status')
  })

  it('the close button dismisses that toast only', async () => {
    wrapper = await mountSuspended(AppToast)
    const toast = useToast()
    toast.error('first')
    toast.error('second')
    await nextTick()

    renderedToasts()[0]?.querySelector<HTMLButtonElement>('button[aria-label="Cerrar"]')?.click()
    await nextTick()

    expect(toast.toasts.value.map((t) => t.message)).toEqual(['second'])
  })
})
