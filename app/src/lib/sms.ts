/* ═══════════════════════════════════════════════════════════════════════════
   SMS autofill.

   This file used to contain a sender. It does not any more: delivery moved to
   the server, where the API key can live without being readable by everyone
   who opens the app. What is left is the one genuinely client-side part of
   SMS verification — letting the browser read an arriving message so the user
   never has to leave the app to copy a code.

   Chrome on Android only, and only for a message ending in the WebOTP binding
   line (`@your-domain.com #123456`). Everywhere else it resolves null, which
   is why callers can attach it unconditionally.
   ═══════════════════════════════════════════════════════════════════════════ */

interface OtpCredentialRequest extends CredentialRequestOptions {
  otp: { transport: string[] }
}

/** Waits for an SMS to arrive and returns the code inside it. */
export function awaitSmsCode(signal?: AbortSignal): Promise<string | null> {
  if (typeof window === 'undefined' || !('OTPCredential' in window)) {
    return Promise.resolve(null)
  }
  return navigator.credentials
    .get({ otp: { transport: ['sms'] }, signal } as OtpCredentialRequest)
    .then((cred) => (cred as (Credential & { code?: string }) | null)?.code ?? null)
    .catch(() => null)
}

/** Does this browser support reading an incoming SMS? */
export const canAutofillSms = () => typeof window !== 'undefined' && 'OTPCredential' in window
