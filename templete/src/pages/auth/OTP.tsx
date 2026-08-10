import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { OTPInput, Btn } from '../../components/ui'

export default function OTP() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(45)
  const [error, setError] = useState('')

  useEffect(() => {
    if (timer <= 0) return
    const t = setInterval(() => setTimer(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [timer])

  useEffect(() => {
    if (code.length === 6) verify()
  }, [code])

  const verify = () => {
    setError('')
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      // Accept any 6-digit code
      navigate('/role')
    }, 1000)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column' }} className="page-enter">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #1B44E8 0%, #0F2AA6 100%)',
        padding: '52px 24px 40px',
        borderRadius: '0 0 32px 32px',
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 36, height: 36, borderRadius: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <ArrowLeft size={18} color="#fff" />
        </button>
        <div style={{
          width: 52, height: 52, background: 'rgba(255,255,255,0.15)', borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}>
          <MessageSquare size={24} color="#fff" />
        </div>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Verify Your Number</h1>
        <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14, margin: 0 }}>
          We sent a 6-digit code to <strong style={{ color: '#fff' }}>+234 080 000 0000</strong>
        </p>
      </div>

      {/* OTP */}
      <div style={{ flex: 1, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ textAlign: 'center', marginBottom: 8, fontSize: 14, color: 'var(--text-2)', fontWeight: 500 }}>
            Enter verification code
          </div>

          <OTPInput digits={6} value={code} onChange={setCode} />

          {error && (
            <div className="scale-in" style={{
              background: 'var(--red-bg)', borderRadius: 12, padding: '12px 16px',
              color: 'var(--red)', fontSize: 13, fontWeight: 500, textAlign: 'center', marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <Btn onClick={verify} loading={loading} disabled={code.length < 6}>
            Verify Code
          </Btn>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            {timer > 0 ? (
              <span style={{ color: 'var(--text-3)', fontSize: 14 }}>
                Resend code in <strong style={{ color: 'var(--text-2)' }}>00:{String(timer).padStart(2, '0')}</strong>
              </span>
            ) : (
              <button
                onClick={() => { setTimer(45); setCode('') }}
                style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                Resend OTP
              </button>
            )}
          </div>

          <div style={{ marginTop: 32, background: 'var(--blue-lighter)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
              💡 <strong>Demo tip:</strong> Enter any 6 digits to continue.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
