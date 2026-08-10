import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, ArrowLeft } from 'lucide-react'
import { Btn, Divider } from '../../components/ui'

export default function Login() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = () => {
    if (phone.length < 7) return
    setLoading(true)
    setTimeout(() => { setLoading(false); navigate('/otp') }, 1200)
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
          <Phone size={24} color="#fff" />
        </div>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Welcome Back</h1>
        <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14, margin: 0 }}>Sign in to your ParcelGo account</p>
      </div>

      {/* Form */}
      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, letterSpacing: '0.01em' }}>
            PHONE NUMBER
          </div>
          <div style={{
            display: 'flex', alignItems: 'center',
            border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
            overflow: 'hidden', background: 'var(--surface)',
          }}>
            <div style={{
              padding: '13px 14px', borderRight: '1.5px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            }}>
              <span>🇳🇬</span>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>+234</span>
              <span style={{ color: 'var(--text-3)', fontSize: 12 }}>▾</span>
            </div>
            <input
              type="tel"
              placeholder="080 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{
                flex: 1, border: 'none', outline: 'none', padding: '13px 14px',
                fontSize: 16, fontFamily: 'Inter, sans-serif', color: 'var(--text)',
                letterSpacing: '0.02em',
              }}
            />
          </div>
        </div>

        <Btn onClick={submit} loading={loading} disabled={phone.length < 7}>
          Send OTP
        </Btn>

        <Divider label="or continue with" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { icon: 'G', label: 'Google', bg: '#fff', border: 'var(--border)' },
            { icon: '🍎', label: 'Apple', bg: '#000', border: '#000' },
          ].map(b => (
            <button key={b.label} style={{
              padding: '12px', borderRadius: 'var(--radius)',
              background: b.bg, border: `1.5px solid ${b.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              color: b.bg === '#000' ? '#fff' : 'var(--text)',
            }}>
              <span style={{ fontSize: 16, fontWeight: 900 }}>{b.icon}</span>
              {b.label}
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 'auto' }}>
          <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Don't have an account? </span>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Sign up free
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 16, lineHeight: 1.5 }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
