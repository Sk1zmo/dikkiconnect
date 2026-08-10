import type { ReactNode, CSSProperties } from 'react'

// ── Shared wireframe constants ────────────────────────────────────────────────

export const SENDER_TABS = ['Home', 'Bookings', 'Track', 'Wallet', 'Profile']
export const TRAVELER_TABS = ['Dashboard', 'Trips', 'Scanner', 'Wallet', 'Profile']
export const PASSENGER_TABS = ['Search', 'Bookings', 'Messages', 'Wallet', 'Profile']
export const HUB_TABS = ['Dashboard', 'Inventory', 'Scanner', 'History', 'Profile']

const QR_ROWS = [
  [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,1,0,1,1,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1],
  [1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,1,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1],
  [1,0,0,0,0,0,1,0,0,0,0,1,1,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
  [1,1,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0],
  [0,1,0,0,1,0,0,1,1,0,0,1,0,0,1,1,1],
  [1,0,1,0,1,1,1,0,0,0,1,0,1,1,0,0,1],
  [0,1,0,1,0,0,0,1,1,0,1,1,0,0,1,0,1],
  [1,1,1,0,0,1,1,0,0,1,0,0,0,1,1,0,0],
  [0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,1,1],
  [1,1,1,1,1,1,1,0,0,1,0,0,1,0,1,0,1],
  [1,0,0,0,0,0,1,0,1,0,0,1,0,1,1,0,1],
  [1,0,1,1,1,0,1,0,0,0,1,1,0,0,1,1,0],
]

// ── Primitives ────────────────────────────────────────────────────────────────

export function StatusBar() {
  return (
    <div className="flex justify-between items-center px-4 py-1 border-b border-gray-300 bg-white shrink-0" style={{ fontSize: 9 }}>
      <span className="font-mono text-gray-500">9:41</span>
      <span className="font-mono text-gray-400 tracking-widest">▲▲▲ WiFi ◼</span>
      <span className="font-mono text-gray-500">100%</span>
    </div>
  )
}

export function NavBar({ title, back, actions }: { title: string; back?: boolean; actions?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-300 bg-white shrink-0">
      <span className="font-mono text-gray-400" style={{ fontSize: 10 }}>{back ? '← Back' : ''}</span>
      <span className="font-mono font-bold tracking-widest text-gray-800" style={{ fontSize: 10 }}>{title}</span>
      <span className="font-mono text-gray-400" style={{ fontSize: 10 }}>{actions ?? ''}</span>
    </div>
  )
}

export function BottomNav({ tabs, active }: { tabs: string[]; active: number }) {
  return (
    <div className="border-t border-gray-300 bg-white flex shrink-0">
      {tabs.map((tab, i) => (
        <div
          key={tab}
          className="flex-1 py-2 text-center font-mono"
          style={{
            fontSize: 8,
            borderTop: i === active ? '2px solid #1f2937' : '2px solid transparent',
            color: i === active ? '#1f2937' : '#9ca3af',
          }}
        >
          {tab}
        </div>
      ))}
    </div>
  )
}

export function Screen({
  title, back, children, tabs, active, actions, id,
}: {
  title: string; back?: boolean; children: ReactNode
  tabs?: string[]; active?: number; actions?: string; id?: string
}) {
  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <StatusBar />
      <NavBar title={title} back={back} actions={actions} />
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {id && <div className="font-mono text-gray-300 mb-1" style={{ fontSize: 7 }}>#{id}</div>}
        {children}
      </div>
      {tabs && <BottomNav tabs={tabs} active={active ?? 0} />}
    </div>
  )
}

export function Input({ label, placeholder, value }: { label: string; placeholder?: string; value?: string }) {
  return (
    <div className="mb-2">
      <div className="font-mono text-gray-500 mb-0.5" style={{ fontSize: 8 }}>{label}</div>
      <div className="border border-gray-400 px-2 py-1.5 font-mono text-gray-600" style={{ fontSize: 10 }}>
        {value || placeholder || '________________________________'}
      </div>
    </div>
  )
}

export function Btn({ label, variant = 'primary', full = true }: { label: string; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; full?: boolean }) {
  const cls: Record<string, string> = {
    primary: 'bg-gray-900 text-white border border-gray-900',
    secondary: 'bg-white text-gray-800 border border-gray-700',
    danger: 'bg-white text-gray-500 border border-dashed border-gray-400',
    ghost: 'bg-transparent text-gray-500 border border-transparent underline',
  }
  return (
    <div
      className={`font-mono font-bold tracking-widest text-center py-2 mb-2 ${cls[variant]} ${full ? 'w-full' : 'inline-block px-3'}`}
      style={{ fontSize: 9 }}
    >
      [ {label} ]
    </div>
  )
}

export function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 my-2">
      <div className="flex-1 border-t border-gray-300" />
      {label && <span className="font-mono text-gray-400" style={{ fontSize: 8 }}>{label}</span>}
      {label && <div className="flex-1 border-t border-gray-300" />}
    </div>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border border-gray-300 p-2 mb-2 ${className ?? ''}`}>
      {children}
    </div>
  )
}

export function MapArea({ height = 120, label = 'MAP AREA' }: { height?: number; label?: string }) {
  const grid: CSSProperties = {
    height,
    backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
    backgroundSize: '18px 18px',
  }
  return (
    <div className="border border-dashed border-gray-400 flex items-center justify-center mb-2 bg-gray-50 relative" style={grid}>
      <span className="font-mono text-gray-400 bg-white px-2 py-0.5 border border-gray-200 z-10" style={{ fontSize: 9 }}>{label}</span>
      <div className="absolute top-1 left-1 font-mono text-gray-300" style={{ fontSize: 7 }}>• HUB A  • HUB B  • HUB C</div>
    </div>
  )
}

export function SL({ title }: { title: string }) {
  return (
    <div className="font-mono font-bold text-gray-500 tracking-widest uppercase mt-2 mb-1 border-b border-gray-200 pb-0.5" style={{ fontSize: 8 }}>
      {title}
    </div>
  )
}

export function Chip({ label, filled }: { label: string; filled?: boolean }) {
  return (
    <span
      className={`font-mono px-1.5 py-0.5 mr-1 mb-1 inline-block border ${filled ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-400 text-gray-600'}`}
      style={{ fontSize: 8 }}
    >
      {label}
    </span>
  )
}

export function Avatar({ size = 32, label = 'USR' }: { size?: number; label?: string }) {
  return (
    <div
      className="border-2 border-dashed border-gray-400 flex items-center justify-center font-mono text-gray-400 shrink-0"
      style={{ width: size, height: size, borderRadius: size / 2, fontSize: 7 }}
    >
      {label}
    </div>
  )
}

export function ImgBox({ width, height = 80, label = 'IMAGE' }: { width?: number | string; height?: number; label?: string }) {
  return (
    <div
      className="border border-dashed border-gray-400 flex items-center justify-center mb-2 bg-gray-50"
      style={{ width: width ?? '100%', height }}
    >
      <span className="font-mono text-gray-400" style={{ fontSize: 9 }}>[{label}]</span>
    </div>
  )
}

export function OTPInput({ digits = 6 }: { digits?: number }) {
  return (
    <div className="flex gap-2 justify-center my-3">
      {Array.from({ length: digits }).map((_, i) => (
        <div
          key={i}
          className="border-2 border-gray-500 flex items-center justify-center font-mono font-bold bg-white"
          style={{ width: 36, height: 44, fontSize: 14 }}
        >
          {i === 0 ? '█' : ''}
        </div>
      ))}
    </div>
  )
}

export function QRBox({ size = 96 }: { size?: number }) {
  const cell = Math.floor(size / QR_ROWS.length)
  return (
    <div className="mx-auto mb-2 border-2 border-gray-700 p-1 bg-white" style={{ width: size + 10, height: size + 10 }}>
      {QR_ROWS.map((row, ri) => (
        <div key={ri} className="flex">
          {row.map((col, ci) => (
            <div key={ci} style={{ width: cell, height: cell, background: col ? '#1f2937' : '#fff' }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center mb-3">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1">
          <div
            className="font-mono flex items-center justify-center border"
            style={{
              width: 20, height: 20, fontSize: 8,
              background: i <= current ? '#1f2937' : '#fff',
              borderColor: i <= current ? '#1f2937' : '#9ca3af',
              color: i <= current ? '#fff' : '#9ca3af',
            }}
          >
            {i < current ? '✓' : i + 1}
          </div>
          <div className="font-mono text-gray-500 mx-1 flex-1" style={{ fontSize: 7 }}>{step}</div>
          {i < steps.length - 1 && <div className="h-px flex-1" style={{ background: i < current ? '#1f2937' : '#d1d5db' }} />}
        </div>
      ))}
    </div>
  )
}

export function TrackLine({ steps }: { steps: { label: string; sub?: string; done: boolean; active?: boolean }[] }) {
  return (
    <div className="pl-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex gap-2 mb-0">
          <div className="flex flex-col items-center">
            <div
              className="font-mono flex items-center justify-center border shrink-0"
              style={{
                width: 14, height: 14, fontSize: 7, borderRadius: 7,
                background: step.done ? '#1f2937' : step.active ? '#fff' : '#fff',
                borderColor: step.done ? '#1f2937' : step.active ? '#1f2937' : '#d1d5db',
                color: step.done ? '#fff' : step.active ? '#1f2937' : '#d1d5db',
                borderWidth: step.active ? 2 : 1,
              }}
            >
              {step.done ? '✓' : '○'}
            </div>
            {i < steps.length - 1 && (
              <div className="w-px my-0.5" style={{ height: 22, background: step.done ? '#1f2937' : '#e5e7eb' }} />
            )}
          </div>
          <div className="pb-3 pt-0.5">
            <div
              className="font-mono"
              style={{ fontSize: 10, color: step.done ? '#1f2937' : step.active ? '#1f2937' : '#9ca3af', fontWeight: step.active ? 700 : 400 }}
            >
              {step.label}
            </div>
            {step.sub && <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>{step.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Row({ label, value, border = true }: { label: string; value?: string; border?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 font-mono ${border ? 'border-b border-gray-200' : ''}`} style={{ fontSize: 10 }}>
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-bold">{value ?? '—'}</span>
    </div>
  )
}

export function Stars({ n = 4 }: { n?: number }) {
  return <span className="font-mono text-gray-700" style={{ fontSize: 10 }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="border-l-2 border-gray-300 pl-2 mb-2 font-mono text-gray-400 italic" style={{ fontSize: 8 }}>
      {children}
    </div>
  )
}

export function Progress({ value = 60, label }: { value?: number; label?: string }) {
  return (
    <div className="mb-2">
      {label && <div className="font-mono text-gray-500 mb-0.5" style={{ fontSize: 8 }}>{label}</div>}
      <div className="border border-gray-400 h-3">
        <div className="h-full bg-gray-800" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export function ScannerFrame() {
  return (
    <div className="relative flex items-center justify-center mb-2 bg-gray-900" style={{ height: 200 }}>
      <div className="absolute inset-0 opacity-50 bg-black" />
      <div className="relative border border-gray-400" style={{ width: 120, height: 120 }}>
        <div className="absolute top-0 left-0 border-t-4 border-l-4 border-white" style={{ width: 20, height: 20 }} />
        <div className="absolute top-0 right-0 border-t-4 border-r-4 border-white" style={{ width: 20, height: 20 }} />
        <div className="absolute bottom-0 left-0 border-b-4 border-l-4 border-white" style={{ width: 20, height: 20 }} />
        <div className="absolute bottom-0 right-0 border-b-4 border-r-4 border-white" style={{ width: 20, height: 20 }} />
        <div className="absolute top-1/2 left-0 right-0 bg-gray-400 opacity-70" style={{ height: 1 }} />
      </div>
      <div className="absolute bottom-3 font-mono text-gray-300" style={{ fontSize: 9 }}>ALIGN QR CODE WITHIN FRAME</div>
    </div>
  )
}

export function CameraFrame({ label = 'CAMERA FEED' }: { label?: string }) {
  return (
    <div className="relative flex items-center justify-center mb-2 bg-gray-900" style={{ height: 180 }}>
      <div className="absolute inset-6 border-2 border-dashed border-white opacity-40" />
      <div className="absolute top-2 right-2 font-mono text-gray-300" style={{ fontSize: 8 }}>● REC</div>
      <span className="font-mono text-gray-400" style={{ fontSize: 9 }}>[{label}]</span>
      <div className="absolute bottom-2 left-2 right-2 flex justify-between font-mono text-gray-500" style={{ fontSize: 7 }}>
        <span>FLASH: OFF</span><span>ZOOM: 1×</span><span>HD</span>
      </div>
    </div>
  )
}

export function FAB({ label = '+' }: { label?: string }) {
  return (
    <div
      className="absolute bottom-16 right-3 border-2 border-gray-700 bg-gray-800 text-white font-mono font-bold flex items-center justify-center"
      style={{ width: 44, height: 44, borderRadius: 22, fontSize: 16 }}
    >
      {label}
    </div>
  )
}

export function EmptyState({ icon = '○', title, sub }: { icon?: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="font-mono text-gray-300 mb-2" style={{ fontSize: 36 }}>{icon}</div>
      <div className="font-mono font-bold text-gray-400 text-center" style={{ fontSize: 11 }}>{title}</div>
      {sub && <div className="font-mono text-gray-300 mt-1 text-center" style={{ fontSize: 9 }}>{sub}</div>}
    </div>
  )
}

export function Spinner({ label = 'LOADING...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="border-2 border-gray-300 border-t-gray-800 rounded-full mb-2" style={{ width: 32, height: 32 }} />
      <div className="font-mono text-gray-400" style={{ fontSize: 9 }}>{label}</div>
    </div>
  )
}

export function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-gray-300 p-2 flex-1 min-w-0">
      <div className="font-mono text-gray-400 truncate" style={{ fontSize: 8 }}>{label}</div>
      <div className="font-mono font-bold text-gray-800 mt-0.5" style={{ fontSize: 14 }}>{value}</div>
      {sub && <div className="font-mono text-gray-400 mt-0.5" style={{ fontSize: 8 }}>{sub}</div>}
    </div>
  )
}

export function TableRow({ cells, header }: { cells: string[]; header?: boolean }) {
  return (
    <div className={`flex border-b border-gray-200 ${header ? 'bg-gray-50' : ''}`}>
      {cells.map((c, i) => (
        <div
          key={i}
          className="flex-1 px-2 py-1 font-mono truncate"
          style={{ fontSize: header ? 8 : 9, color: header ? '#6b7280' : '#374151', fontWeight: header ? 700 : 400 }}
        >
          {c}
        </div>
      ))}
    </div>
  )
}

export function Sheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-gray-400 rounded-tl-xl rounded-tr-xl" style={{ maxHeight: '65%' }}>
      <div className="flex justify-center pt-2 pb-1">
        <div className="bg-gray-300" style={{ width: 32, height: 3, borderRadius: 2 }} />
      </div>
      <div className="px-3 pb-2 font-mono font-bold text-gray-700 border-b border-gray-200" style={{ fontSize: 10 }}>{title}</div>
      <div className="px-3 py-2 overflow-y-auto" style={{ maxHeight: 260 }}>{children}</div>
    </div>
  )
}

export function ModalOverlay({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="h-full bg-white flex flex-col">
      <StatusBar />
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-gray-900 opacity-40" />
        <div className="absolute left-4 right-4" style={{ top: '15%' }}>
          <div className="bg-white border border-gray-300 p-4">
            <div className="font-mono font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3" style={{ fontSize: 11 }}>{title}</div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Admin layout primitives ───────────────────────────────────────────────────

export function AdminSidebar({ active }: { active: string }) {
  const items = ['Dashboard', 'Users', 'Drivers', 'Passengers', 'Trips', 'Parcels', 'Payments', 'Disputes', 'Analytics', 'Settings']
  return (
    <div className="border-r border-gray-300 bg-gray-50 shrink-0 flex flex-col" style={{ width: 140 }}>
      <div className="px-3 py-2 border-b border-gray-300">
        <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>PARCELGO</div>
        <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>Admin Portal</div>
      </div>
      {items.map(item => (
        <div
          key={item}
          className="px-3 py-2 font-mono border-b border-gray-100 flex items-center gap-1"
          style={{
            fontSize: 9,
            background: active === item ? '#1f2937' : 'transparent',
            color: active === item ? '#fff' : '#4b5563',
          }}
        >
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}

export function AdminHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="border-b border-gray-300 px-4 py-2 flex items-center justify-between bg-white shrink-0">
      <div>
        <div className="font-mono font-bold text-gray-800" style={{ fontSize: 11 }}>{title}</div>
        {sub && <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>{sub}</div>}
      </div>
      <div className="flex gap-2">
        <div className="border border-gray-300 px-2 py-1 font-mono text-gray-500" style={{ fontSize: 8 }}>⚙ Settings</div>
        <Avatar size={28} label="ADM" />
      </div>
    </div>
  )
}

export function AdminScreen({ active, title, sub, children }: { active: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="flex h-full bg-white">
      <AdminSidebar active={active} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title={title} sub={sub} />
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {children}
        </div>
      </div>
    </div>
  )
}
