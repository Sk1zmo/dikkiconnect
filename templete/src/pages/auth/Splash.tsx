import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeroMap } from '../../components/MapView'

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => navigate('/onboarding'), 2800)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div style={{
      height: '100dvh',
      background: 'linear-gradient(160deg, #1B44E8 0%, #0F2AA6 55%, #081B7A 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Status bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px 0', opacity: 0.8 }}>
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>9:41</span>
        <span style={{ color: '#fff', fontSize: 13 }}>▲▲▲ 100%</span>
      </div>

      {/* Logo + brand */}
      <div className="fade-in" style={{ padding: '40px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          {/* Logo mark */}
          <div style={{
            width: 44, height: 44, background: 'rgba(255,255,255,0.15)',
            borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M3 20 L13 4 L23 20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 20 L13 12 L18 20" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>ParcelGo</span>
        </div>

        <div className="page-enter" style={{ animationDelay: '0.2s' }}>
          <h1 style={{
            color: '#fff', fontSize: 34, fontWeight: 900,
            lineHeight: 1.15, letterSpacing: '-0.03em', margin: 0,
          }}>
            Deliver Anything,<br />Anywhere.
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.7)', fontSize: 16, marginTop: 12,
            lineHeight: 1.55, fontWeight: 400,
          }}>
            Connect parcels with intercity travelers. Fast, safe, and affordable.
          </p>
        </div>
      </div>

      {/* Hero illustration area */}
      <div className="fade-in" style={{ flex: 1, animationDelay: '0.4s' }}>
        <HeroMap height={280} />
      </div>

      {/* Bottom CTAs */}
      <div className="sheet-enter" style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        borderRadius: '28px 28px 0 0',
        padding: '28px 24px 40px',
        border: '1px solid rgba(255,255,255,0.12)',
        borderBottom: 'none',
      }}>
        <button
          onClick={() => navigate('/onboarding')}
          style={{
            width: '100%', padding: '16px', borderRadius: 16,
            background: '#fff', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 16, color: '#1B44E8',
            marginBottom: 16, letterSpacing: '-0.01em',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          Get Started
        </button>
        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%', padding: '14px', background: 'none',
            border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 16,
            color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer',
          }}
        >
          Login / Register
        </button>
      </div>
    </div>
  )
}
