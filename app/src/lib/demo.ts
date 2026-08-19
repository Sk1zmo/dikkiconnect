/* ═══════════════════════════════════════════════════════════════════════════
   Demo mode.

   A separate build that skips sign-in entirely, so the app can be shown to
   somebody without an inbox, a code, or a working mail provider on the other
   end. Every portal opens straight away against a seeded account.

   Two rules make this safe to ship alongside the real thing:

     · It is decided at BUILD time, not runtime. `import.meta.env` is inlined
       by Vite and then dead-code-eliminated, so the real bundle does not
       merely have this switched off — it does not contain the bypass at all.
       There is no flag to flip, no localStorage key to set, nothing to
       discover.
     · It announces itself. A demo build carries a permanent badge, because
       the failure mode worth designing against is not somebody breaking in —
       it is somebody being shown the demo and believing they were shown the
       product.
   ═══════════════════════════════════════════════════════════════════════════ */

export const DEMO = import.meta.env.VITE_DEMO_MODE === '1'

/** The account a demo build signs in as. Obviously a sample, deliberately. */
export const DEMO_ACCOUNT = {
  id: 'usr-demo',
  name: 'Demo User',
  email: 'demo@dikkiconnect.in',
  phone: '9800000000',
  roles: ['sender'] as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  kycTier: 'none' as const,
  avatarTone: 2,
}
