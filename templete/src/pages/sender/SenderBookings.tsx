import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar, Badge, Card, Sk, TabPills, SkCard } from '../../components/ui'

const ALL_BOOKINGS = [
  { id: 'PG-1043', route: 'Lagos → Abuja', date: '12 Jan', status: 'IN TRANSIT', amount: '₦3,700' },
  { id: 'PG-1038', route: 'Lagos → Port Harcourt', date: '10 Jan', status: 'AT HUB', amount: '₦2,200' },
  { id: 'PG-1030', route: 'Lagos → Kano', date: '4 Jan', status: 'DELIVERED', amount: '₦4,100' },
  { id: 'PG-1018', route: 'Lagos → Abuja', date: '28 Dec', status: 'DELIVERED', amount: '₦3,200' },
  { id: 'PG-1009', route: 'Lagos → Ibadan', date: '15 Dec', status: 'DELIVERED', amount: '₦900' },
]

export default function SenderBookings() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { setTimeout(() => setLoading(false), 1200) }, [])

  const TABS = ['All', 'Active', 'Delivered', 'Cancelled']
  const filtered = tab === 0 ? ALL_BOOKINGS
    : tab === 1 ? ALL_BOOKINGS.filter(b => ['IN TRANSIT', 'AT HUB'].includes(b.status))
    : tab === 2 ? ALL_BOOKINGS.filter(b => b.status === 'DELIVERED')
    : []

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} className="page-enter">
      <TopBar title="My Bookings" back="/sender" />
      <div style={{ padding: '0 16px' }}>
        <TabPills tabs={TABS} active={tab} onChange={setTab} />

        {loading ? (
          <div className="stagger">
            {[1, 2, 3].map(i => <SkCard key={i} rows={3} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="stagger">
            {filtered.map(b => (
              <Card key={b.id} onClick={() => navigate('/sender/track')} className="scale-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.01em' }}>{b.id}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{b.route}</div>
                  </div>
                  <Badge label={b.status} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{b.date}</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--blue)' }}>{b.amount}</span>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>No bookings found</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Your bookings will appear here</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
