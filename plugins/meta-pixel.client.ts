import { META_PIXEL_ID, trackPixel } from '~/utils/metaPixel'

/**
 * Meta Pixel base code adapted to Nuxt: the stub queues calls until fbevents.js loads, and a PageView is
 * sent on every client-side navigation (the initial load included), not just the first full page load.
 * Skipped in dev so local browsing never reaches the ads account; admin pages are not tracked.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.dev) return

  if (!window.fbq) {
    // Same shape as Meta's official snippet; fbevents.js replays `queue` and takes over through `callMethod`.
    const fbq = function (this: unknown) {
      // eslint-disable-next-line prefer-rest-params
      if (fbq.callMethod) fbq.callMethod.apply(this, arguments as unknown as unknown[])
      else fbq.queue.push(arguments)
    } as unknown as NonNullable<Window['fbq']>
    fbq.push = fbq
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.queue = []
    window.fbq = fbq
    window._fbq ??= fbq
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
  }

  window.fbq('init', META_PIXEL_ID)
  nuxtApp.hook('page:finish', () => {
    if (!useRoute().path.startsWith('/admin')) trackPixel('PageView')
  })
})
