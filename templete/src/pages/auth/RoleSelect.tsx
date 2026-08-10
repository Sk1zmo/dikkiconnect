import { useNavigate } from 'react-router-dom'

const ROLES = [
  {
    icon: '📦', label: 'Sender', sub: 'Send packages between cities', path: '/sender',
    gradient: 'linear-gradient(135deg, #1B44E8 0%, #3B6EF8 100%)',
    stats: '42K+ deliveries',
  },
  {
    icon: '🚗', label: 'Traveler', sub: 'Carry parcels & earn rewards', path: '/traveler',
    gradient: 'linear-gradient(135deg, #0F2AA6 0%, #1B44E8 100%)',
    stats: '3.2K+ drivers',
  },
  {
    icon: '🎟️', label: 'Passenger', sub: 'Book intercity rides', path: '/passenger',
    gradient: 'linear-gradient(135deg, #1434C8 0%, #2563EB 100%)',
    stats: '18K+ trips',
  },
  {
    icon: '🏢', label: 'Hub Manager', sub: 'Manage collection points', path: '/hub',
    gradient: 'linear-gradient(135deg, #081B7A 0%, #0F2AA6 100%)',
    stats: '120+ hubs',
  },
]

export default function RoleSelect() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 32 }} className="page-enter">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #1B44E8 0%, #0F2AA6 100%)',
        padding: '56px 24px 40px',
        borderRadius: '0 0 32px 32px',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, background: 'rgba(255,255,255,0.15)', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>🎭</div>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: 13, letterSpacing: '0.04em' }}>CHOOSE YOUR ROLE</span>
        </div>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          How will you use ParcelGo?
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: 0 }}>
          You can switch roles anytime from your profile
        </p>
      </div>

      {/* Role cards */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }} className="stagger">
        {ROLES.map(role => (
          <button
            key={role.label}
            onClick={() => navigate(role.path)}
            className="scale-in"
            style={{
              background: '#fff', border: '1.5px solid var(--border-light)',
              borderRadius: 20, padding: '18px 20px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
              boxShadow: 'var(--shadow-sm)', transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.borderColor = '#1B44E8' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border-light)' }}
          >
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: role.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
            }}>
              {role.icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 3 }}>
                {role.label}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>{role.sub}</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'var(--blue-light)', borderRadius: 8, padding: '3px 8px',
              }}>
                <span style={{ width: 4, height: 4, borderRadius: 2, background: 'var(--blue)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)' }}>{role.stats}</span>
              </div>
            </div>

            <div style={{ color: 'var(--text-3)', fontSize: 20 }}>›</div>
          </button>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', padding: '20px 24px 0' }}>
        Multiple roles available · Switch anytime in Profile settings
      </p>
    </div>
  )
}
