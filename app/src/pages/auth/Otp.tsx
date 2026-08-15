import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, KeyRound, MessageSquare, RefreshCw, Smartphone } from 'lucide-react'
import { Screen, TopBar } from '@/components/layout/Screen'
import { Button, OtpInput, useToast } from '@/components/ui'
import { useCountdown } from '@/lib/hooks'
import { maskPhone } from '@/lib/format'
import { OTP_RESEND_SECONDS, useAuth } from '@/lib/auth'
import { awaitSmsCode, canAutofillSms } from '@/lib/sms'

/**
 * Verification step.
 *
 * The code is real: issued per request, single use, five minutes to live, five
 * attempts. Where it arrives depends on the build — a configured gateway texts
 * it, an unconfigured one shows it in the panel below and says so.
 *
 * On Android Chrome the browser can read the arriving SMS itself and fill the
 * boxes without the user leaving the app. That listener is attached whenever
 * the platform supports it and simply never fires where it does not.
 */
export default function Otp() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const toast = useToast()
  const { requestOtp, verifyOtp, pendingCode, attemptsLeft, delivery, smsEnabled } = useAuth()

  const phone = params.get('phone') ?? ''
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const { label, restart, done } = useCountdown(OTP_RESEND_SECONDS)

  const issued = pendingCode(phone)
  const left = attemptsLeft(phone)
  const autofill = canAutofillSms()

  // Deep-linking straight here (or reloading) leaves no live challenge, so
  // issue one rather than dead-ending on a code that can never be right.
  useEffect(() => {
    if (!phone) {
      navigate('/auth/login', { replace: true })
      return
    }
    if (!issued) requestOtp(phone)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* WebOTP: read the code straight out of the arriving SMS. Aborted on
     unmount so a backgrounded screen never holds the receiver open. */
  useEffect(() => {
    if (!autofill || verified) return
    const ctrl = new AbortController()
    awaitSmsCode(ctrl.signal).then((sms) => {
      if (!sms) return
      setCode(sms)
      verify(sms)
    })
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autofill, verified])

  const verify = (value: string) => {
    if (value.length < 6 || verifying) return
    setVerifying(true)
    setError(undefined)

    setTimeout(() => {
      setVerifying(false)
      const result = verifyOtp(phone, value)

      if (!result.ok) {
        setCode('')
        if (result.reason === 'expired') {
          setError('That code has expired. Request a new one.')
          toast.error('Code expired', 'Codes are valid for five minutes.')
          restart(0)
        } else if (result.reason === 'locked') {
          setError('Too many incorrect attempts. Request a new code.')
          toast.error('Locked', 'Five wrong attempts — request a fresh code.')
          restart(0)
        } else if (result.reason === 'no-challenge') {
          setError('No code is active for this number. Request a new one.')
          restart(0)
        } else {
          setError(
            `That code didn't match. ${result.attemptsLeft} attempt${
              result.attemptsLeft === 1 ? '' : 's'
            } left.`,
          )
        }
        return
      }

      setVerified(true)
      setTimeout(
        () =>
          navigate(
            result.isNewUser
              ? `/auth/signup?phone=${phone}${
                  params.get('email') ? `&email=${encodeURIComponent(params.get('email')!)}` : ''
                }`
              : '/auth/role',
            {
              replace: true,
            },
          ),
        780,
      )
    }, 700)
  }

  const resend = () => {
    const next = requestOtp(phone)
    restart(OTP_RESEND_SECONDS)
    setCode('')
    setError(undefined)
    toast.success(
      'New code issued',
      smsEnabled ? `Sent to ${maskPhone(phone)} — valid for 5 minutes.` : `Code ${next.code} — valid for 5 minutes.`,
    )
  }

  return (
    <Screen tone="white">
      <TopBar back />

      <div className="device-scroll flex-1 px-7">
        <div className="mb-6 grid size-14 place-items-center rounded-(--radius-lg) bg-brand-50 text-brand-600">
          <MessageSquare size={24} />
        </div>

        <h1 className="text-display text-[28px] leading-[1.14] font-extrabold text-ink-900">
          Verify your number
        </h1>
        <p className="mt-2.5 text-[14.5px] leading-[1.55] text-ink-500">
          {smsEnabled ? 'We texted a 6-digit code to' : 'Enter the 6-digit code issued for'}{' '}
          <span className="font-bold text-ink-800">{maskPhone(phone)}</span>
        </p>

        {autofill && !verified && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1.5 text-[11.5px] font-bold text-success-700">
            <Smartphone size={12} />
            We&apos;ll fill it in automatically when the SMS lands
          </p>
        )}

        <div className="mt-9">
          {verified ? (
            <div className="anim-pop flex flex-col items-center py-6">
              <div className="grid size-16 place-items-center rounded-full bg-success-50 text-success-600">
                <CheckCircle2 size={34} />
              </div>
              <p className="mt-4 text-[16px] font-bold text-ink-900">Number verified</p>
              <p className="mt-1 text-[13px] text-ink-500">Taking you in…</p>
            </div>
          ) : (
            <>
              <OtpInput
                value={code}
                onChange={setCode}
                onComplete={verify}
                error={Boolean(error)}
                length={6}
              />

              {error && (
                <p className="anim-fade-in -mt-1 mb-4 text-center text-[12.5px] font-semibold text-danger-600">
                  {error}
                </p>
              )}

              <Button
                block
                size="lg"
                className="mt-5"
                loading={verifying}
                disabled={code.length < 6}
                onClick={() => verify(code)}
              >
                {verifying ? 'Verifying…' : 'Verify & continue'}
              </Button>

              <div className="mt-5 text-center">
                {done ? (
                  <button
                    onClick={resend}
                    className="pressable-sm inline-flex items-center gap-2 text-[13.5px] font-bold text-brand-600"
                  >
                    <RefreshCw size={14} />
                    Send a new code
                  </button>
                ) : (
                  <p className="text-[13px] text-ink-400">
                    New code in <span className="tabular font-bold text-ink-700">{label}</span>
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {!verified && delivery?.sent && (
          <div className="anim-fade-in mt-8 rounded-(--radius-lg) border border-success-100 bg-success-50 p-4">
            <p className="flex items-center gap-2 text-[12.5px] font-bold text-success-800">
              <MessageSquare size={14} /> Sent via {delivery.provider}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-success-800/80">
              Valid for 5 minutes, {left} attempt{left === 1 ? '' : 's'} remaining. It stops working
              the moment it is used.
            </p>
          </div>
        )}

        {!verified && !delivery?.sent && (
          <div className="mt-8 rounded-(--radius-lg) border border-brand-100 bg-brand-50/70 p-4">
            <p className="flex items-center gap-2 text-[12px] font-bold tracking-wide text-brand-700 uppercase">
              <KeyRound size={13} /> Your code
            </p>
            <p className="tabular text-display mt-2 text-[30px] leading-none font-extrabold tracking-[0.14em] text-brand-800">
              {issued ?? '——————'}
            </p>
            <p className="mt-2.5 text-[12px] leading-relaxed text-brand-800/80">
              {delivery?.reason === 'failed'
                ? 'The SMS gateway rejected this send, so the code is shown here instead.'
                : 'Shown here because no SMS gateway is configured for this build.'}{' '}
              The code itself is real: generated for this request, valid for 5 minutes, {left}{' '}
              attempt{left === 1 ? '' : 's'} remaining, and it stops working once used.
            </p>
          </div>
        )}
      </div>
    </Screen>
  )
}
