/* ═══════════════════════════════════════════════════════════════════════════
   UPI payments.

   What this does, honestly:

   A `upi://pay?...` intent is a real, NPCI-specified deep link. Tapping one on
   Android hands the payment to whichever UPI app the user has installed —
   Google Pay, PhonePe, Paytm, BHIM — with the payee, amount and reference
   pre-filled. The user authorises it with their own UPI PIN inside their own
   bank-grade app. Money genuinely moves. This is how a very large number of
   Indian merchants collect, and it needs no gateway account.

   What it cannot do, and why:

   The intent is fire-and-forget. Android does not reliably hand back a
   verified result, and a client cannot be trusted to report its own payment
   anyway — anyone can edit JavaScript. Confirming that a payment actually
   settled needs a PSP (Razorpay, Cashfree, PhonePe Business) sending a signed
   webhook to a server you control. Until that exists, this module opens the
   payment and then asks the user to confirm, and the confirmation is a claim
   rather than proof. Every call site says so.

   Swapping in a PSP later replaces `buildUpiUrl` with an order-creation call
   and `confirmPayment` with a poll of your own backend. The flow around it —
   choose app, hand off, come back, reconcile — does not change.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface UpiPayee {
  /** Virtual Payment Address, e.g. dikkiconnect@okhdfcbank */
  vpa: string
  /** Registered name shown inside the UPI app. */
  name: string
}

/**
 * The collecting account. Replace with the business VPA once the entity is
 * registered — nothing else in the flow needs to change.
 */
export const DIKKI_PAYEE: UpiPayee = {
  vpa: import.meta.env.VITE_UPI_VPA ?? 'dikkiconnect@okaxis',
  name: import.meta.env.VITE_UPI_NAME ?? 'DikkiConnect',
}

export type UpiApp = 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'any'

/**
 * Android package-scoped schemes. Targeting the package opens that specific
 * app instead of the system chooser, which is what makes a "Pay with GPay"
 * button actually mean GPay.
 */
const APP_SCHEME: Record<Exclude<UpiApp, 'any'>, string> = {
  gpay: 'tez://upi/pay',
  phonepe: 'phonepe://pay',
  paytm: 'paytmmp://pay',
  bhim: 'bhim://pay',
}

export const UPI_APPS: Array<{ id: Exclude<UpiApp, 'any'>; label: string; hint: string }> = [
  { id: 'gpay', label: 'Google Pay', hint: 'tez://' },
  { id: 'phonepe', label: 'PhonePe', hint: 'phonepe://' },
  { id: 'paytm', label: 'Paytm', hint: 'paytmmp://' },
  { id: 'bhim', label: 'BHIM', hint: 'bhim://' },
]

export interface UpiRequest {
  amount: number
  /** Shown in the UPI app's note field, and our reconciliation key. */
  reference: string
  note: string
  payee?: UpiPayee
}

/** Builds a spec-compliant UPI intent URL. */
export function buildUpiUrl(req: UpiRequest, app: UpiApp = 'any') {
  const payee = req.payee ?? DIKKI_PAYEE
  const params = new URLSearchParams({
    pa: payee.vpa,
    pn: payee.name,
    // Two decimals: some apps reject a bare integer amount.
    am: req.amount.toFixed(2),
    cu: 'INR',
    tn: req.note.slice(0, 50),
    tr: req.reference,
  })
  const base = app === 'any' ? 'upi://pay' : APP_SCHEME[app]
  return `${base}?${params.toString()}`
}

/** Is a UPI app reachable from here at all? */
export function canPayByUpi() {
  if (typeof navigator === 'undefined') return false
  return /android/i.test(navigator.userAgent)
}

export type UpiLaunch = 'launched' | 'no-handler' | 'unsupported'

/**
 * Hands the payment to a UPI app.
 *
 * Android fires no event when no app can handle the scheme, so the only way to
 * tell is to watch whether the page loses visibility: an app that opened takes
 * focus, one that never existed leaves us exactly where we were.
 */
export function launchUpi(req: UpiRequest, app: UpiApp = 'any'): Promise<UpiLaunch> {
  const url = buildUpiUrl(req, app)

  if (!canPayByUpi()) {
    // Desktop and iOS browsers cannot resolve upi://; opening it would strand
    // the user on an error page rather than telling them what happened.
    return Promise.resolve('unsupported')
  }

  return new Promise((resolve) => {
    let settled = false
    const onHide = () => {
      if (document.visibilityState === 'hidden' && !settled) {
        settled = true
        cleanup()
        resolve('launched')
      }
    }
    const cleanup = () => {
      document.removeEventListener('visibilitychange', onHide)
      clearTimeout(timer)
    }
    document.addEventListener('visibilitychange', onHide)

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      cleanup()
      resolve('no-handler')
    }, 2200)

    window.location.href = url
  })
}

/** Reconciliation reference for a booking — what you'd match a webhook on. */
export const upiReference = (kind: 'parcel' | 'ride', id: string) =>
  `DKC${kind === 'parcel' ? 'P' : 'R'}${id.replace(/\D/g, '')}${Date.now().toString().slice(-5)}`
