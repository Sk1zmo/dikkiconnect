import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, MessageSquare, RefreshCw } from 'lucide-react'
import { Screen, TopBar } from '@/components/layout/Screen'
import { Button, Note, OtpInput, useToast } from '@/components/ui'
import { useCountdown } from '@/lib/hooks'
import { maskPhone } from '@/lib/format'
import { useApp } from '@/lib/store'

/** The demo accepts any 6 digits; 000000 forces the error state. */
const WRONG_CODE = '000000'

export default function Otp() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const toast = useToast()
  const { signIn } = useApp()

  const phone = params.get('phone') ?? '9845067890'
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const { label, restart, done } = useCountdown(30)

  const verify = (value: string) => {
    if (value.length < 6) return
    setVerifying(true)
    setError(false)

    setTimeout(() => {
      setVerifying(false)
      if (value === WRONG_CODE) {
        setError(true)
        setCode('')
        toast.error('Incorrect code', 'Check the SMS and try again.')
        return
      }
      setVerified(true)
      signIn(phone)
      setTimeout(() => navigate('/auth/role'), 780)
    }, 1100)
  }

  const resend = () => {
    restart(30)
    setCode('')
    setError(false)
    toast.success('Code resent', `A new code is on its way to ${maskPhone(phone)}`)
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
          Enter the 6-digit code sent to{' '}
          <span className="font-bold text-ink-800">{maskPhone(phone)}</span>
        </p>

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
                error={error}
                length={6}
              />

              {error && (
                <p className="anim-fade-in -mt-1 mb-4 text-center text-[12.5px] font-semibold text-danger-600">
                  That code didn&apos;t match. 2 attempts left.
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
                    Resend code
                  </button>
                ) : (
                  <p className="text-[13px] text-ink-400">
                    Resend code in <span className="tabular font-bold text-ink-700">{label}</span>
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {!verified && (
          <Note tone="brand" className="mt-8" title="Demo tip">
            Any 6 digits will pass. Enter <span className="font-mono font-bold">000000</span> to see
            the incorrect-code state.
          </Note>
        )}
      </div>
    </Screen>
  )
}
