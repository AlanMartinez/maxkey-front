import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue'

const props = {
  title: 'Antes de revelar tu key',
  body: 'Al revelar la key ya no podés pedir reembolso.',
  confirmLabel: 'Revelar key',
  cancelLabel: 'Cancelar',
  link: { label: 'Ver política de reembolsos', to: '/reembolsos' },
}

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | undefined

function dialog() {
  return document.body.querySelector<HTMLElement>('[role="dialog"]')
}
function button(label: string) {
  return Array.from(dialog()?.querySelectorAll<HTMLButtonElement>('button') ?? []).find((b) => b.textContent?.trim() === label)
}

// Teleported into document.body; unmount so a stale dialog never reacts to the next test.
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('ConfirmDialog', () => {
  it('renders an accessible dialog labelled by its title, with the link and both actions, focusing the primary button', async () => {
    wrapper = await mountSuspended(ConfirmDialog, { props })
    await nextTick()

    const node = dialog()!
    expect(node.getAttribute('aria-modal')).toBe('true')
    const labelledBy = node.getAttribute('aria-labelledby')!
    expect(document.getElementById(labelledBy)?.textContent).toBe('Antes de revelar tu key')
    expect(node.textContent).toContain('Al revelar la key ya no podés pedir reembolso.')
    expect(node.querySelector('a[href="/reembolsos"]')?.textContent).toBe('Ver política de reembolsos')
    expect(document.activeElement).toBe(button('Revelar key'))
  })

  it('emits confirm from the primary button and cancel from the secondary one', async () => {
    wrapper = await mountSuspended(ConfirmDialog, { props })

    button('Revelar key')!.click()
    button('Cancelar')!.click()
    await nextTick()

    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('emits cancel on Escape and on the backdrop', async () => {
    wrapper = await mountSuspended(ConfirmDialog, { props })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    document.body.querySelector<HTMLElement>('[aria-hidden="true"].absolute')?.click()
    await nextTick()

    expect(wrapper.emitted('cancel')).toHaveLength(2)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })
})
