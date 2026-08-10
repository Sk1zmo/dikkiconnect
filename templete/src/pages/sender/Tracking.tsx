import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Share2, Package, MapPin } from 'lucide-react'
import { MapView } from '../../components/MapView'
import { Card, Badge, TopBar, Avatar, Stars } from '../../components/ui'

const STEPS = [
  { label: 'Booking Confirmed', sub: '12 Jan · 10:22 AM', done: true },
  { label: 'Dropped at Hub (Yaba)', sub: '12 Jan · 2:14 PM · Amaka', done: true },
  { label: 'Picked by Traveler', sub: '13 Jan · 8:05 AM · Emeka O.', done: true },
  { label: 'In Transit', sub: '13 Jan · 8:30 AM · En route to Abuja', done: true, active: true },
  { label: 'Arrived at Destination Hub', sub: 'Estimated: 14 Jan · 2PM', done: false },
  { label: 'Collected by Recipient', sub: 'Pending', done: false },
]

export default function Tracking() {
  const navigate = useNavigate()
  const [showMap, setShowMap] = useState(true)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} className="page-enter">
      <TopBar title="Track Parcel" back transparent />

      {/* Map */}
      <div style={{ position: 'relative' }}>
        <MapView height={220} showRoute />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          background: 'linear-gradient(to bottom, rgba(27,68,232,0.6), transparent)',
          height: 80, pointerEvents: 'none',
        }} />
      </div>

      {/* Summary card (floating over map) */}
      <div style={{ padding: '0 16px', marginTop: -32, position: 'relative', zIndex: 10 }}>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.02em' }}>PG-1043</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>Lagos → Abuja · Standard</div>
            </div>
            <Badge label="IN TRANSIT" />
          </div>

          <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>ESTIMATED ARRIVAL</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Tomorrow, 14 Jan · 2:00 PM</div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { icon: Phone, label: 'Call Driver' },
              { icon: Share2, label: 'Share Link' },
            ].map(a => (
              <button key={a.label} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px', borderRadius: 10, background: 'var(--blue-light)',
                border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: 'var(--blue)',
              }}>
                <a.icon size={15} color="var(--blue)" />
                {a.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Traveler info */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 12, letterSpacing: '0.04em' }}>TRAVELER</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar initials="EO" size={44} bg="var(--blue-light)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Emeka Okafor</div>
              <Stars n={5} />
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Toyota Camry · LOS 234 AA</div>
            </div>
            <button style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--blue)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Phone size={17} color="#fff" />
            </button>
          </div>
        </Card>

        {/* Timeline */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 16, letterSpacing: '0.04em' }}>TRACKING TIMELINE</div>
          <div>
            {STEPS.map((s, i) => (
              <div key={s.label} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                {/* Line */}
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: 'absolute', left: 10, top: 22, bottom: -12,
                    width: 2, background: s.done && !s.active ? 'var(--blue)' : 'var(--border)',
                    transition: 'background 0.3s',
                  }} />
                )}
                {/* Dot */}
                <div style={{ flexShrink: 0, zIndex: 1 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 11,
                    background: s.done ? 'var(--blue)' : 'var(--surface)',
                    border: `2px solid ${s.done ? 'var(--blue)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: s.active ? '0 0 0 4px rgba(27,68,232,0.15)' : 'none',
                  }}>
                    {s.done ? (
                      s.active
                        ? <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: 4, background: '#fff' }} />
                        : <span style={{ color: '#fff', fontSize: 11 }}>✓</span>
                    ) : (
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--border)' }} />
                    )}
                  </div>
                </div>
                {/* Content */}
                <div style={{ paddingBottom: i < STEPS.length - 1 ? 20 : 0 }}>
                  <div style={{ fontWeight: s.active ? 700 : s.done ? 600 : 400, fontSize: 14, color: s.done ? 'var(--text)' : 'var(--text-3)' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
