import { useState } from 'react'
import { Building2, IndianRupee, Plus, ShieldCheck, Trash2, Users } from 'lucide-react'
import { AdminCard, AdminPill, PageHeader } from './components'
import {
  Button,
  Counter,
  Field,
  Note,
  Switch,
  Tabs,
  useToast,
} from '@/components/ui'
import { DECLARED_VALUE_CAP, HUBS, HUB_HANDLING_FEE, PROHIBITED_ITEMS } from '@/lib/data'
import { inr } from '@/lib/format'

type Tab = 'pricing' | 'hubs' | 'policy' | 'team'

const TEAM = [
  { name: 'Ops Team', email: 'ops@dikkiconnect.in', role: 'Super admin' },
  { name: 'Nisha Raghavan', email: 'nisha@dikkiconnect.in', role: 'Disputes' },
  { name: 'Manoj Kumar', email: 'manoj@dikkiconnect.in', role: 'Hub operations' },
  { name: 'Fatima Sheikh', email: 'fatima@dikkiconnect.in', role: 'Read only' },
]

export default function AdminSettings() {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('pricing')

  const [smallBase, setSmallBase] = useState(79)
  const [mediumBase, setMediumBase] = useState(139)
  const [largeBase, setLargeBase] = useState(249)
  const [perKm, setPerKm] = useState(0.34)
  const [commission, setCommission] = useState(15)
  const [hubFee, setHubFee] = useState(HUB_HANDLING_FEE)
  const [valueCap, setValueCap] = useState(DECLARED_VALUE_CAP)

  const [passengerPooling, setPassengerPooling] = useState(true)
  const [p2pMode, setP2pMode] = useState(false)
  const [cod, setCod] = useState(false)
  const [insurance, setInsurance] = useState(true)

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Pricing, hub network, policy and team access"
        actions={
          <button
            onClick={() => toast.success('Settings saved', 'Changes take effect on the next booking.')}
            className="pressable-sm rounded-(--radius-sm) bg-action px-3.5 py-2 text-[13px] font-bold text-white shadow-(--shadow-action) hover:bg-action-hover"
          >
            Save changes
          </button>
        }
      />

      <div className="mb-6">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'pricing', label: 'Pricing & fees' },
            { value: 'hubs', label: 'Hub network' },
            { value: 'policy', label: 'Policy & scope' },
            { value: 'team', label: 'Team access' },
          ]}
        />
      </div>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      {tab === 'pricing' && (
        <div className="anim-fade-up grid grid-cols-2 gap-4">
          <AdminCard>
            <h2 className="mb-1 text-[15px] font-bold text-ink-900">Base fares</h2>
            <p className="mb-5 text-[12px] text-ink-500">Starting price before distance and weight</p>
            <div className="flex flex-col gap-4">
              {[
                { label: 'Small · up to 3 kg', value: smallBase, set: setSmallBase },
                { label: 'Medium · up to 10 kg', value: mediumBase, set: setMediumBase },
                { label: 'Large · up to 20 kg', value: largeBase, set: setLargeBase },
              ].map((f) => (
                <div key={f.label}>
                  <p className="mb-2 text-[12.5px] font-semibold text-ink-700">{f.label}</p>
                  <Counter value={f.value} onChange={f.set} min={0} max={1000} step={10} suffix="₹" />
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="mb-1 text-[15px] font-bold text-ink-900">Take rates</h2>
            <p className="mb-5 text-[12px] text-ink-500">How revenue splits across the network</p>
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-2 text-[12.5px] font-semibold text-ink-700">Distance rate (₹ per km)</p>
                <Counter value={perKm} onChange={setPerKm} min={0.1} max={2} step={0.02} decimals={2} suffix="₹/km" />
              </div>
              <div>
                <p className="mb-2 text-[12.5px] font-semibold text-ink-700">Platform commission</p>
                <Counter value={commission} onChange={setCommission} min={0} max={40} step={1} suffix="%" />
              </div>
              <div>
                <p className="mb-2 text-[12.5px] font-semibold text-ink-700">Hub handling fee per parcel</p>
                <Counter value={hubFee} onChange={setHubFee} min={5} max={50} step={1} suffix="₹" />
              </div>
            </div>

            <Note tone="brand" className="mt-5" title="Why flat, not percentage">
              A flat {inr(hubFee)} keeps hub income independent of declared value — shopkeepers
              cannot verify what is inside a box, so a percentage fee would just invite disputes.
            </Note>
          </AdminCard>

          <AdminCard className="col-span-2">
            <h2 className="mb-1 text-[15px] font-bold text-ink-900">Example quote</h2>
            <p className="mb-5 text-[12px] text-ink-500">Medium parcel · Bangalore → Mysore · 145 km</p>
            <div className="grid grid-cols-6 gap-4">
              {[
                { label: 'Base', value: inr(mediumBase) },
                { label: 'Distance', value: inr(Math.round(145 * perKm)) },
                { label: 'GST 18%', value: inr(Math.round((mediumBase + 145 * perKm) * 0.18)) },
                {
                  label: 'Customer pays',
                  value: inr(Math.round((mediumBase + 145 * perKm) * 1.18)),
                  strong: true,
                },
                { label: 'Driver gets', value: inr(Math.round((mediumBase + 145 * perKm) * 0.62)) },
                { label: 'Hubs get', value: inr(hubFee * 2) },
              ].map((m) => (
                <div key={m.label} className="rounded-(--radius-sm) border border-ink-100 p-4">
                  <p className="text-[11.5px] font-semibold text-ink-500">{m.label}</p>
                  <p
                    className={`tabular mt-1.5 font-extrabold ${
                      m.strong ? 'text-[22px] text-brand-700' : 'text-[19px] text-ink-900'
                    }`}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      )}

      {/* ── Hubs ──────────────────────────────────────────────────────────── */}
      {tab === 'hubs' && (
        <div className="anim-fade-up">
          <AdminCard className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-ink-900">Hub network</h2>
                <p className="mt-0.5 text-[12px] text-ink-500">
                  {HUBS.length} live partners · hubs are vetted manually, not self-signup
                </p>
              </div>
              <Button size="sm" icon={<Plus size={15} />} onClick={() => toast.info('Add hub', 'Opens the partner onboarding form.')}>
                Add a hub
              </Button>
            </div>
          </AdminCard>

          <div className="grid grid-cols-3 gap-4">
            {HUBS.map((h) => {
              const load = Math.round((h.held / h.capacity) * 100)
              return (
                <AdminCard key={h.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[14.5px] font-bold text-ink-900">
                        {h.name.split('·').pop()?.trim()}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-ink-500">{h.address}</p>
                    </div>
                    <span className="grid size-9 shrink-0 place-items-center rounded-(--radius-xs) bg-brand-50 text-brand-600">
                      <Building2 size={17} />
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <AdminPill tone={load > 70 ? 'warning' : 'good'}>
                      {load}% full · {h.held}/{h.capacity}
                    </AdminPill>
                    <AdminPill tone="neutral">★ {h.rating}</AdminPill>
                  </div>

                  <div className="mt-4 border-t border-ink-100 pt-3.5 text-[12px] text-ink-500">
                    <p className="flex justify-between">
                      <span>Manager</span>
                      <span className="font-semibold text-ink-800">{h.manager}</span>
                    </p>
                    <p className="mt-1.5 flex justify-between">
                      <span>Hours</span>
                      <span className="tabular font-semibold text-ink-800">
                        {h.openFrom} – {h.openTo}
                      </span>
                    </p>
                  </div>
                </AdminCard>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Policy ────────────────────────────────────────────────────────── */}
      {tab === 'policy' && (
        <div className="anim-fade-up grid grid-cols-2 gap-4">
          <AdminCard>
            <h2 className="mb-1 text-[15px] font-bold text-ink-900">Feature scope</h2>
            <p className="mb-5 text-[12px] text-ink-500">What is live in the pilot</p>
            <div className="flex flex-col gap-4">
              <Switch
                checked
                onChange={() => {}}
                label="Hub-to-hub parcels"
                description="The MVP model — always on"
              />
              <div className="h-px bg-ink-100" />
              <Switch
                checked={passengerPooling}
                onChange={setPassengerPooling}
                label="Passenger pooling"
                description="Cost-sharing rides, gated behind tier-2 driver KYC"
              />
              <div className="h-px bg-ink-100" />
              <Switch
                checked={p2pMode}
                onChange={setP2pMode}
                label="P2P direct (door to door)"
                description="Out of scope for MVP — enable once hub density is proven"
              />
              <div className="h-px bg-ink-100" />
              <Switch
                checked={cod}
                onChange={setCod}
                label="Cash on delivery"
                description="Needs the hub reconciliation module first"
              />
              <div className="h-px bg-ink-100" />
              <Switch
                checked={insurance}
                onChange={setInsurance}
                label="DikkiConnect Protect"
                description="₹25 add-on, capped at the declared-value limit"
              />
            </div>
          </AdminCard>

          <div className="flex flex-col gap-4">
            <AdminCard>
              <h2 className="mb-1 text-[15px] font-bold text-ink-900">Liability limits</h2>
              <p className="mb-4 text-[12px] text-ink-500">Caps exposure while trust is being built</p>
              <p className="mb-2 text-[12.5px] font-semibold text-ink-700">
                Maximum declared value per parcel
              </p>
              <Counter value={valueCap} onChange={setValueCap} min={1000} max={50000} step={500} suffix="₹" />
              <Note tone="warn" className="mt-4" title="Legal review needed">
                The declared-value cap and the sender terms both need a lawyer pass before launch.
                Raising this above {inr(5000)} materially changes your insurance requirement.
              </Note>
            </AdminCard>

            <AdminCard>
              <h2 className="mb-1 text-[15px] font-bold text-ink-900">Prohibited items</h2>
              <p className="mb-4 text-[12px] text-ink-500">
                Senders must accept this declaration before every booking
              </p>
              <ul className="flex flex-col gap-2">
                {PROHIBITED_ITEMS.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2.5 rounded-(--radius-xs) bg-danger-50 px-3 py-2 text-[12.5px] font-medium text-danger-800"
                  >
                    <ShieldCheck size={14} className="shrink-0 text-danger-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </AdminCard>
          </div>

          <AdminCard className="col-span-2">
            <h2 className="mb-1 text-[15px] font-bold text-ink-900">Compliance notes</h2>
            <p className="mb-5 text-[12px] text-ink-500">Flagged for legal review before scale</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  title: 'Passenger pooling',
                  body: 'Karnataka has treated app-based pooling as unlicensed aggregation. Fares must stay structured as fuel + toll cost-sharing, not a commercial fare.',
                },
                {
                  title: 'Aadhaar handling',
                  body: 'We are not a licensed AUA/KUA and must never store raw Aadhaar numbers. All verification routes through a licensed vendor; we keep only a masked token.',
                },
                {
                  title: 'Courier classification',
                  body: 'Interstate parcel movement for consideration may attract courier-service classification. GST treatment and any logistics registration need confirming before we leave Karnataka.',
                },
              ].map((c) => (
                <div key={c.title} className="rounded-(--radius-sm) border border-warn-100 bg-warn-50 p-4">
                  <p className="text-[13px] font-bold text-warn-800">{c.title}</p>
                  <p className="mt-1.5 text-[12px] leading-[1.6] text-warn-700/90">{c.body}</p>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      )}

      {/* ── Team ──────────────────────────────────────────────────────────── */}
      {tab === 'team' && (
        <div className="anim-fade-up">
          <AdminCard padded={false}>
            <div className="flex items-center justify-between border-b border-ink-200 p-5">
              <div>
                <h2 className="text-[15px] font-bold text-ink-900">Team access</h2>
                <p className="mt-0.5 text-[12px] text-ink-500">
                  {TEAM.length} people can sign in to this console
                </p>
              </div>
              <Button size="sm" icon={<Plus size={15} />} onClick={() => toast.info('Invite sent', 'They will receive a magic link.')}>
                Invite a teammate
              </Button>
            </div>

            <ul>
              {TEAM.map((m, i) => (
                <li
                  key={m.email}
                  className={`flex items-center gap-4 p-5 ${i > 0 ? 'border-t border-ink-100' : ''}`}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-(--radius-sm) bg-brand-50 text-brand-600">
                    <Users size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-ink-900">{m.name}</p>
                    <p className="truncate text-[12px] text-ink-500">{m.email}</p>
                  </div>
                  <AdminPill tone={m.role === 'Super admin' ? 'info' : 'neutral'}>{m.role}</AdminPill>
                  {m.role !== 'Super admin' && (
                    <button
                      onClick={() => toast.warn('Access revoked', m.name)}
                      aria-label={`Remove ${m.name}`}
                      className="pressable-sm grid size-9 shrink-0 place-items-center rounded-full text-ink-400 hover:bg-danger-50 hover:text-danger-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </AdminCard>

          <AdminCard className="mt-4">
            <h2 className="mb-1 text-[15px] font-bold text-ink-900">Corridor configuration</h2>
            <p className="mb-5 text-[12px] text-ink-500">Where DikkiConnect currently operates</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Live corridors" value="Bangalore ↔ Mysore, Bangalore ↔ Chennai" readOnly />
              <Field
                label="Ops contact"
                value="+91 80 4718 9000"
                readOnly
                prefix={<IndianRupee size={15} className="opacity-0" />}
              />
            </div>
          </AdminCard>
        </div>
      )}
    </>
  )
}
