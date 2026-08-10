import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Package, CreditCard, CheckCircle, ChevronRight, X } from 'lucide-react'
import { Btn, Input, TopBar, Card } from '../../components/ui'

const STEPS = [
  { icon: MapPin, label: 'Cities' },
  { icon: Package, label: 'Parcel' },
  { icon: MapPin, label: 'Hub' },
  { icon: CreditCard, label: 'Pay' },
]

const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Benin City', 'Enugu', 'Kaduna']
const HUBS = [
  { name: 'Yaba Hub · ParcelPoint', dist: '0.8 km', slots: 12, hours: '8am–8pm' },
  { name: 'Ikeja Hub · ShopExpress', dist: '2.1 km', slots: 5, hours: '7am–9pm' },
  { name: 'Lekki Hub · SendCenter', dist: '4.3 km', slots: 22, hours: '9am–7pm' },
]

export default function BookParcel() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [weight, setWeight] = useState('')
  const [category, setCategory] = useState('')
  const [fragile, setFragile] = useState(false)
  const [selectedHub, setSelectedHub] = useState(-1)
  const [paying, setPaying] = useState(false)

  const canNext = [
    from && to,
    weight && category,
    selectedHub >= 0,
    true,
  ]

  const next = () => {
    if (step < 3) setStep(s => s + 1)
    else {
      setPaying(true)
      setTimeout(() => navigate('/sender/track'), 1800)
    }
  }

  const CATEGORIES = ['Documents', 'Electronics', 'Clothing', 'Food', 'Medicine', 'Other']

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }} className="page-enter">
      <TopBar title="Book a Parcel" back />

      {/* Stepper */}
      <div style={{
        padding: '0 20px 16px', display: 'flex', alignItems: 'center', gap: 0,
      }}>
        {STEPS.map((s, i) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 16, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i <= step ? 'var(--blue)' : 'var(--surface)',
              border: `2px solid ${i <= step ? 'var(--blue)' : 'var(--border)'}`,
              color: i <= step ? '#fff' : 'var(--text-3)',
              fontSize: 12, fontWeight: 700, transition: 'all 0.3s',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? 'var(--blue)' : 'var(--border)', transition: 'background 0.3s' }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: '0 16px 100px' }}>

        {/* Step 0: Cities */}
        {step === 0 && (
          <div className="page-enter">
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4, letterSpacing: '-0.01em' }}>Where to?</div>
            <div style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 20 }}>Select origin and destination cities</div>

            <Card style={{ padding: '4px 16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--blue)', flexShrink: 0 }} />
                <select
                  value={from} onChange={e => setFrom(e.target.value)}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, fontFamily: 'Inter', color: from ? 'var(--text)' : 'var(--text-3)', background: 'transparent', fontWeight: from ? 600 : 400 }}
                >
                  <option value="">From city</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0' }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--green)', flexShrink: 0 }} />
                <select
                  value={to} onChange={e => setTo(e.target.value)}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, fontFamily: 'Inter', color: to ? 'var(--text)' : 'var(--text-3)', background: 'transparent', fontWeight: to ? 600 : 400 }}
                >
                  <option value="">To city</option>
                  {CITIES.filter(c => c !== from).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </Card>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10, letterSpacing: '0.01em' }}>POPULAR ROUTES</div>
              {[['Lagos', 'Abuja'], ['Lagos', 'Port Harcourt'], ['Abuja', 'Kano']].map(([f, t]) => (
                <button key={`${f}-${t}`} onClick={() => { setFrom(f); setTo(t) }} style={{
                  width: '100%', background: 'var(--surface)', border: '1.5px solid var(--border-light)',
                  borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', cursor: 'pointer', marginBottom: 8,
                }}>
                  <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{f} → {t}</span>
                  <ChevronRight size={16} color="var(--text-3)" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Parcel Details */}
        {step === 1 && (
          <div className="page-enter">
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4, letterSpacing: '-0.01em' }}>Parcel Details</div>
            <div style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 20 }}>Tell us about what you're sending</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, letterSpacing: '0.01em' }}>CATEGORY</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)} style={{
                    padding: '10px 8px', borderRadius: 12, border: `1.5px solid ${category === c ? 'var(--blue)' : 'var(--border)'}`,
                    background: category === c ? 'var(--blue-light)' : 'var(--surface)',
                    color: category === c ? 'var(--blue)' : 'var(--text-2)',
                    fontWeight: category === c ? 700 : 400, fontSize: 12, cursor: 'pointer',
                  }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="WEIGHT (KG)" placeholder="e.g. 2.5" type="number" value={weight} onChange={e => setWeight(e.target.value)} />
              <Input label="VALUE (₦)" placeholder="e.g. 50,000" type="text" />
            </div>
            <Input label="RECIPIENT NAME" placeholder="John Doe" />
            <Input label="RECIPIENT PHONE" placeholder="080 000 0001" type="tel" />

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12,
              padding: '14px 16px', marginBottom: 16,
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Fragile Item</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Handle with extra care</div>
              </div>
              <button onClick={() => setFragile(f => !f)} style={{
                width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: fragile ? 'var(--blue)' : 'var(--border)', transition: 'all 0.2s', position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 3, left: fragile ? 22 : 3, width: 22, height: 22,
                  borderRadius: 11, background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Hub */}
        {step === 2 && (
          <div className="page-enter">
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4, letterSpacing: '-0.01em' }}>Drop-off Hub</div>
            <div style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 16 }}>Choose where to drop off your parcel</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {HUBS.map((h, i) => (
                <button key={h.name} onClick={() => setSelectedHub(i)} style={{
                  background: 'var(--surface)', border: `1.5px solid ${selectedHub === i ? 'var(--blue)' : 'var(--border-light)'}`,
                  borderRadius: 16, padding: '16px', textAlign: 'left', cursor: 'pointer',
                  boxShadow: selectedHub === i ? '0 0 0 3px rgba(27,68,232,0.12)' : 'var(--shadow-sm)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{h.name}</div>
                    {selectedHub === i && <CheckCircle size={18} color="var(--blue)" fill="rgba(27,68,232,0.1)" />}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>{h.dist} away · {h.hours}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ background: 'var(--green-bg)', color: 'var(--green)', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }}>
                      {h.slots} slots
                    </span>
                    <span style={{ background: 'var(--blue-light)', color: 'var(--blue)', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }}>
                      Verified
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="page-enter">
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 16, letterSpacing: '-0.01em' }}>Payment</div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12 }}>ORDER SUMMARY</div>
              {[
                ['Route', `${from} → ${to}`],
                ['Service', 'Standard · 2–3 days'],
                ['Weight', `${weight || '—'} kg`],
                ['Drop-off', selectedHub >= 0 ? HUBS[selectedHub].name.split(' ·')[0] : '—'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--blue)' }}>₦ 3,700</span>
              </div>
            </Card>

            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>PAYMENT METHOD</div>
            {[
              { label: 'Wallet Balance', sub: '₦ 12,400 available', active: true },
              { label: 'Card ···· 4521', sub: 'Visa · GTBank', active: false },
            ].map(m => (
              <Card key={m.label} style={{ marginBottom: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 10,
                    border: `2px solid ${m.active ? 'var(--blue)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {m.active && <div style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--blue)' }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{m.sub}</div>
                  </div>
                </div>
              </Card>
            ))}
            <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 8 }}>
              🔒 Secured by Paystack · Your data is protected
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div style={{
        position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, padding: '12px 16px', background: 'rgba(247,248,252,0.95)',
        backdropFilter: 'blur(12px)', borderTop: '1px solid var(--border)',
      }}>
        <Btn onClick={next} loading={paying} disabled={!canNext[step]}>
          {step === 3 ? `Pay ₦ 3,700` : 'Continue'}
        </Btn>
      </div>
    </div>
  )
}
