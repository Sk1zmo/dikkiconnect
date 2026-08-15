import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, MailCheck, RefreshCw, Smartphone } from 'lucide-react'
import { Screen, TopBar } from '@/components/layout/Screen'
import { Button, Note, OtpInput, useToast } from '@/components/ui'
import { useCountdown } from '@/lib/hooks'
import { OTP_RESEND_SECONDS, useAuth } from '@/lib/auth'
import { awaitSmsCode, canAutofillSms } from '@/lib/sms'

/**
 * Verification.
 *
 * Nothing on this screen reveals the code, because this app no longer knows
 * it. It is generated and checked on the server; the only copy sent anywhere
 * goes to the address shown below. A wrong entry costs one of five attempts
 * and the fifth destroys the challenge — both enforced server-side, where the
 * person entering codes cannot reach them.
 */
export default function Otp() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const toast = useToast()
  const { requestCode, verifyCode } = useAuth()

  const identifier = params.get('id') ?? ''
  const sentTo = params.get('to') ?? identifier

  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(5)
  const { label, restart, done } = useCountdown(OTP_RESEND_SECONDS)

  const autofill = canAutofillSms()

  useEffect(() => {
    if (!identifier) navigate('/auth/login', { replace: true })
  }, [identifier, navigate])

  const verify = async (value: string) => {
    if (value.length < 6 || verifying) return
    setVerifying(true)
    setError(undefined)

    const result = await verifyCode(identifier, value)
    setVerifying(false)

    if (!result.ok) {
      setCode('')
      setAttemptsLeft(result.attemptsLeft)
      if (result.reason === 'expired') {
        setError('That code has expired. Ask for a new one.')
        restart(0)
      } else if (result.reason === 'locked') {
        setError('Too many incorrect attempts. Ask for a new code.')
        restart(0)
      } else if (result.reason === 'no-challenge') {
        setError('No code is active for this address. Ask for a new one.')
        restart(0)
      } else if (result.reason === 'offline') {
        setError('Could not reach DikkiConnect. Check your connection.')
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
    setTimeout(() => {
      if (result.isNewUser) {
        const qs = new URLSearchParams({ ticket: result.ticket, id: identifier })
        navigate(`/auth/signup?${qs.toString()}`, { replace: true })
      } else {
        navigate('/auth/role', { replace: true })
      }
    }, 720)
  }

  /* WebOTP, for the day an SMS gateway is attached. Attached unconditionally
     because it simply never fires where the platform lacks it. */
  useEffect(() => {
    if (!autofill || verified) return
    const ctrl = new AbortController()
    awaitSmsCode(ctrl.signal).then((sms) => {
      if (!sms) return
      setCode(sms)
      void verify(sms)
    })
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autofill, verified])

  const resend = async () => {
    const result = await requestCode(identifier)
    if (!result.ok) {
      if (result.reason === 'too-soon') {
        toast.error('Too soon', `Wait ${result.retryInSeconds ?? 30}s before asking again.`)
        return
      }
      toast.error('Could not send', 'Check your connection and try again.')
      return
    }
    restart(OTP_RESEND_SECONDS)
    setCode('')
    setError(undefined)
    setAttemptsLeft(5)
    toast.success(
      result.delivered ? 'New code sent' : 'Could not deliver',
      result.delivered ? `Check ${sentTo}` : 'No mail provider is configured.',
    )
  }

  return (
    <Screen tone="white">
      <TopBar back backTo="/auth/login" />

      <div className="device-scroll flex-1 px-7">
        <div className="mb-6 grid size-14 place-items-center rounded-(--radius-lg) bg-brand-50 text-brand-600">
          <MailCheck size={24} />
        </div>

        <h1 className="text-display text-[28px] leading-[1.14] font-extrabold text-ink-900">
          Check your email
        </h1>
        <p className="mt-2.5 text-[14.5px] leading-[1.55] text-ink-500">
          We sent a 6-digit code to <span className="font-bold text-ink-800">{sentTo}</span>
        </p>

        {autofill && !verified && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1.5 text-[11.5px] font-bold text-success-700">
            <Smartphone size={12} />
            We&apos;ll fill it in automatically if it arrives by SMS
          </p>
        )}

        <div className="mt-9">
          {verified ? (
            <div className="anim-pop flex flex-col items-center py-6">
              <div className="grid size-16 place-items-center rounded-full bg-success-50 text-success-600">
                <CheckCircle2 size={34} />
              </div>
              <p className="mt-4 text-[16px] font-bold text-ink-900">Verified</p>
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

        {!verified && (
          <Note tone="neutral" className="mt-8" title="Not arrived?">
            Check spam, and that {sentTo} is right. The code is valid for 5 minutes, works once,
            and you have {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} left before it locks.
          </Note>
        )}
      </div>
    </Screen>
  )
}
