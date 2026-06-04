'use client'

declare global {
  interface Window {
    createLemonSqueezy?: () => void
    LemonSqueezy?: {
      Setup: (options: { eventHandler: (event: { event: string }) => void }) => void
      Url: {
        Open: (url: string) => void
        Close: () => void
      }
    }
  }
}

function loadScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.LemonSqueezy) { resolve(); return }
    const existing = document.querySelector('script[src*="lemon.js"]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      return
    }
    const script = document.createElement('script')
    script.src = 'https://app.lemonsqueezy.com/js/lemon.js'
    script.defer = true
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

export async function openOverlayCheckout(
  url: string,
  onSuccess: () => void,
) {
  await loadScript()
  window.createLemonSqueezy?.()
  window.LemonSqueezy!.Setup({
    eventHandler: (event) => {
      if (event.event === 'Checkout.Success') {
        window.LemonSqueezy!.Url.Close()
        onSuccess()
      }
    },
  })
  window.LemonSqueezy!.Url.Open(url)
}
