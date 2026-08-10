import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SLIDES = [
  {
    bg: 'linear-gradient(160deg, #1B44E8 0%, #0F2AA6 100%)',
    emoji: '📦',
    title: 'Send Parcels Across Cities',
    body: 'Connect with verified intercity travelers to deliver your packages safely and affordably.',
    tag: 'For Senders',
  },
  {
    bg: 'linear-gradient(160deg, #0F2AA6 0%, #081B7A 100%)',
    emoji: '🚗',
    title: 'Earn While You Travel',
    body: 'Carry parcels on your intercity route and earn real money with zero extra effort.',
    tag: 'For Travelers',
  },
  {
    bg: 'linear-gradient(160deg, #1434C8 0%, #0A1F80 100%)',
    emoji: '🗺️',
    title: 'Book Intercity Rides',
    body: 'Find affordable seats with verified drivers. Real-time tracking and secure payments.',
    tag: 'For Passengers',
  },
]

export default function Onboarding() {
  const [slide, setSlide] = useState(0)
  const navigate = useNavigate()
  const current = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  const next = () => {
    if (isLast) navigate('/login')
    else setSlide(s => s + 1)
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: current.bg, transition: 'background 0.4s ease' }}>
      {/* Skip */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '52px 20px 0' }}>
        <button
          onClick={() => navigate('/login')}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 20, fontWeight: 500, fontSize: 13, cursor: 'pointer' }}
        >
          Skip
        </button>
      </div>

      {/* Illustration */}
      <div className="bounce-in" key={slide} style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 160, height: 160,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 72, backdropFilter: 'blur(8px)',
        }}>
          {current.emoji}
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.15)', borderRadius: 20,
          padding: '6px 14px', color: 'rgba(255,255,255,0.9)',
          fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
        }}>
          {current.tag}
        </div>
      </div>

      {/* Text + dots + button */}
      <div style={{
        background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
        borderRadius: '28px 28px 0 0', padding: '32px 24px 48px',
        border: '1px solid rgba(255,255,255,0.12)', borderBottom: 'none',
      }}>
        {/* Dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => setSlide(i)} style={{
              height: 4, width: i === slide ? 24 : 8, borderRadius: 2,
              background: i === slide ? '#fff' : 'rgba(255,255,255,0.3)',
              transition: 'all 0.28s ease', cursor: 'pointer',
            }} />
          ))}
        </div>

        <div className="page-enter" key={`text-${slide}`}>
          <h2 style={{
            color: '#fff', fontSize: 26, fontWeight: 800,
            margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.25,
          }}>
            {current.title}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 15, lineHeight: 1.6, margin: '0 0 28px' }}>
            {current.body}
          </p>
        </div>

        <button
          onClick={next}
          style={{
            width: '100%', padding: 16, background: '#fff', border: 'none',
            borderRadius: 16, fontWeight: 700, fontSize: 16, color: '#1B44E8',
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          {isLast ? 'Get Started' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
