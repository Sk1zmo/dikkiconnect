import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, Package, MapPin, ChevronRight, Clock, Star } from 'lucide-react'
import { MapView } from '../../components/MapView'
import { Card, Sk, Badge, SectionLabel, Avatar, Stars } from '../../components/ui'

const ACTIVE_PARCELS = [
  { id: 'PG-1043', route: 'Lagos → Abuja', status: 'IN TRANSIT', eta: 'Tomorrow, 2PM', driver: 'Emeka O.', rating: 5 },
  { id: 'PG-1038', route: 'Lagos → Port Harcourt', status: 'AT HUB', eta: 'Today, 6PM', driver: 'Ngozi K.', rating: 4 },
]

const RECENT = [
  { id: 'PG-1030', route: 'Lagos → Kano', date: '4 Jan', status: 'DELIVERED', amount: '₦4,100' },
  { id: 'PG-1018', route: 'Lagos → Abuja', date: '28 Dec', status: 'DELIVERED', amount: '₦3,200' },
]

export default function SenderHome() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => { setTimeout(() => setLoading(false), 1400) }, [])

  return (
    <div className="page-enter">
      {/* Blue header */}
      <div style={{
        background: 'linear-gradient(145deg, #1B44E8 0%, #0F2AA6 100%)',
        padding: '52px 20px 20px',
        borderRadius: '0 0 32px 32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 2 }}>Good morning 👋</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 20, letterSpacing: '-0.01em' }}>Amaka Okafor</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button style={{
              width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.15)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative',
            }}>
              <Bell size={18} color="#fff" />
              <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, background: '#F59E0B', borderRadius: 4, border: '2px solid #0F2AA6' }} />
            </button>
            <Avatar initials="AO" size={40} bg="rgba(255,255,255,0.2)" color="#fff" />
          </div>
        </div>

        {/* Search bar */}
        <button
          onClick={() => navigate('/sender/book')}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)',
            borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Search size={16} color="rgba(255,255,255,0.6)" />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Where to send your parcel?</span>
        </button>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
          {[
            { icon: Package, label: 'Book Parcel', path: '/sender/book', bg: '#fff', fg: '#1B44E8' },
            { icon: MapPin, label: 'Track Parcel', path: '/sender/track', bg: 'rgba(255,255,255,0.15)', fg: '#fff' },
          ].map(a => (
            <button key={a.label} onClick={() => navigate(a.path)} style={{
              background: a.bg, border: 'none', borderRadius: 14, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              boxShadow: a.bg === '#fff' ? '0 4px 16px rgba(0,0,0,0.15)' : 'none',
            }}>
              <a.icon size={20} color={a.fg} />
              <span style={{ fontWeight: 600, fontSize: 14, color: a.fg }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        {/* Map */}
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
          <MapView height={160} />
          <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>3 Hubs Near You</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Yaba, Ikeja, Lekki</div>
            </div>
            <button onClick={() => navigate('/sender/book')} style={{
              background: 'var(--blue-light)', border: 'none', borderRadius: 10,
              padding: '8px 14px', color: 'var(--blue)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>
              View All
            </button>
          </div>
        </Card>

        {/* Active deliveries */}
        <SectionLabel title="Active Deliveries" action="See all" onAction={() => navigate('/sender/bookings')} />

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Sk h={96} r={12} />
            <Sk h={96} r={12} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="stagger">
            {ACTIVE_PARCELS.map(p => (
              <Card key={p.id} onClick={() => navigate(`/sender/track`)} className="scale-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', letterSpacing: '-0.01em' }}>{p.id}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{p.route}</div>
                  </div>
                  <Badge label={p.status} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={13} color="var(--text-3)" />
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>ETA: {p.eta}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar initials={p.driver.slice(0, 2)} size={22} />
                    <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{p.driver}</span>
                    <Stars n={p.rating} size={11} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Recent orders */}
        <div style={{ marginTop: 24 }}>
          <SectionLabel title="Recent Orders" action="View all" onAction={() => navigate('/sender/bookings')} />
          <Card>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2].map(i => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ flex: 1 }}><Sk h={12} w="50%" r={6} className="mb-2" /><Sk h={10} w="35%" r={5} /></div>
                    <Sk w={60} h={24} r={12} />
                  </div>
                ))}
              </div>
            ) : (
              RECENT.map((r, i) => (
                <div key={r.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: i < RECENT.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{r.id} · {r.route}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{r.date} · {r.amount}</div>
                  </div>
                  <Badge label={r.status} />
                </div>
              ))
            )}
          </Card>
        </div>

        {/* Promo banner */}
        <div style={{
          marginTop: 20, borderRadius: 16, padding: '20px',
          background: 'linear-gradient(135deg, #1B44E8 0%, #3B6EF8 100%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>20% off your next booking</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>Use code: PARCEL20</div>
          </div>
          <div style={{ fontSize: 32 }}>🎁</div>
        </div>
      </div>
    </div>
  )
}
