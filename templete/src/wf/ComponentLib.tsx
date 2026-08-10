import {
  StatusBar, NavBar, BottomNav, Btn, Input, Card, Chip, Avatar, Stars,
  OTPInput, QRBox, ScannerFrame, CameraFrame, TrackLine, Progress,
  SENDER_TABS, Divider, FAB, EmptyState, Spinner, MapArea, SL, Note,
} from './primitives'

export const ComponentLibrary = () => (
  <div className="flex flex-col h-full bg-white overflow-y-auto">
    <StatusBar />
    <NavBar title="COMPONENT LIBRARY" />
    <div className="px-3 py-2">

      {/* Buttons */}
      <SL title="Buttons" />
      <Btn label="PRIMARY BUTTON" />
      <Btn label="SECONDARY BUTTON" variant="secondary" />
      <Btn label="DANGER / DESTRUCTIVE" variant="danger" />
      <Btn label="GHOST / LINK STYLE" variant="ghost" />
      <div className="flex gap-2 mb-2">
        <Btn label="INLINE" full={false} />
        <Btn label="OUTLINE" variant="secondary" full={false} />
        <Btn label="DESTROY" variant="danger" full={false} />
      </div>
      <Note>All buttons: full-width by default. full=false for inline. Disabled state: 40% opacity.</Note>

      {/* Inputs */}
      <SL title="Inputs" />
      <Input label="Default Input" placeholder="Enter value..." />
      <Input label="Filled Input" value="John Doe" />
      <div className="border border-gray-400 flex mb-2">
        <div className="border-r border-gray-300 px-2 py-2 font-mono text-gray-400 shrink-0" style={{ fontSize: 10 }}>+234 ▾</div>
        <div className="flex-1 px-2 py-2 font-mono text-gray-500" style={{ fontSize: 10 }}>Phone with prefix</div>
      </div>
      <div className="border border-gray-400 p-2 mb-2">
        <div className="font-mono text-gray-300 mb-1" style={{ fontSize: 8 }}>TEXTAREA LABEL</div>
        <div className="font-mono text-gray-300" style={{ fontSize: 9, minHeight: 48 }}>Multi-line text area placeholder...</div>
      </div>
      <Note>Error state: red border + message below. Focus: border-gray-800. Disabled: bg-gray-50.</Note>

      {/* Cards */}
      <SL title="Cards" />
      <Card>
        <div className="font-mono font-bold text-gray-800 mb-1" style={{ fontSize: 10 }}>Standard Card</div>
        <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Used for parcels, trips, drivers, and list items. Tap to navigate or expand.</div>
      </Card>
      <Card className="border-l-4 border-l-gray-800">
        <div className="font-mono font-bold text-gray-800 mb-1" style={{ fontSize: 10 }}>Highlighted Card</div>
        <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Left accent border for urgent or active items.</div>
      </Card>

      {/* Status Chips */}
      <SL title="Status Chips" />
      <div className="flex flex-wrap gap-1 mb-2">
        {[
          { label: 'ACTIVE', filled: true },
          { label: 'IN TRANSIT', filled: true },
          { label: 'VERIFIED', filled: true },
          { label: 'PENDING', filled: false },
          { label: 'WAITING', filled: false },
          { label: 'DELAYED', filled: false },
          { label: 'DELIVERED', filled: false },
          { label: 'CANCELLED', filled: false },
        ].map(c => <Chip key={c.label} label={c.label} filled={c.filled} />)}
      </div>

      {/* Avatar */}
      <SL title="Avatar" />
      <div className="flex gap-2 mb-2 items-end">
        {[24, 32, 40, 52].map(s => <Avatar key={s} size={s} label="AB" />)}
      </div>

      {/* Stars */}
      <SL title="Rating" />
      <div className="flex flex-col gap-1 mb-2">
        {[5, 4, 3].map(n => (
          <div key={n} className="flex items-center gap-2">
            <Stars n={n} />
            <span className="font-mono text-gray-400" style={{ fontSize: 8 }}>{n}.0 ({n * 20} reviews)</span>
          </div>
        ))}
      </div>

      {/* OTP Input */}
      <SL title="OTP Input" />
      <div className="mb-1">
        <div className="font-mono text-gray-400 mb-0.5" style={{ fontSize: 8 }}>6-DIGIT (Account Verification)</div>
        <OTPInput digits={6} />
      </div>
      <div className="mb-2">
        <div className="font-mono text-gray-400 mb-0.5" style={{ fontSize: 8 }}>4-DIGIT (Hub Operations)</div>
        <OTPInput digits={4} />
      </div>

      {/* Progress Bar */}
      <SL title="Progress Bar" />
      <Progress value={100} label="Complete (100%)" />
      <Progress value={65} label="In Progress (65%)" />
      <Progress value={20} label="Started (20%)" />

      {/* QR Code */}
      <SL title="QR Code" />
      <div className="flex items-center gap-4 mb-2">
        <QRBox size={72} />
        <div className="flex-1">
          <div className="font-mono text-gray-600" style={{ fontSize: 9, lineHeight: 1.6 }}>
            Unique per booking. Generated server-side. Single-use scan invalidates token.
          </div>
        </div>
      </div>

      {/* Tracking Timeline */}
      <SL title="Tracking Timeline" />
      <TrackLine steps={[
        { label: 'Booking Confirmed', sub: '12 Jan · 10:22', done: true },
        { label: 'Dropped at Hub', sub: '12 Jan · 14:14', done: true },
        { label: 'In Transit', sub: '13 Jan · 08:30', done: true, active: true },
        { label: 'Arrived at Hub', sub: 'Pending', done: false },
        { label: 'Collected', sub: 'Pending', done: false },
      ]} />

      {/* Map Area */}
      <SL title="Map Placeholder" />
      <MapArea height={80} label="MAP · INTERACTIVE (Leaflet / MapBox)" />

      {/* Scanner & Camera */}
      <SL title="Scanner Frame" />
      <ScannerFrame />
      <SL title="Camera Frame" />
      <CameraFrame />

      {/* Empty States */}
      <SL title="Empty States" />
      <EmptyState icon="□" title="No parcels found" sub="Try adjusting your filters or book a new parcel." />

      {/* Spinner */}
      <SL title="Loading Spinner" />
      <Spinner label="FETCHING DRIVERS..." />

      {/* Divider */}
      <SL title="Dividers" />
      <Divider />
      <Divider label="OR CONTINUE WITH" />

      {/* Bottom Nav */}
      <SL title="Bottom Navigation" />
      <div className="border border-gray-300 mb-2">
        <BottomNav tabs={SENDER_TABS} active={0} />
      </div>

      {/* FAB */}
      <SL title="Floating Action Button" />
      <div className="relative border border-dashed border-gray-400" style={{ height: 70 }}>
        <FAB label="+" />
        <div className="font-mono text-gray-400 px-2 py-2" style={{ fontSize: 8 }}>
          Fixed at bottom-right above bottom nav
        </div>
      </div>

      {/* Typography */}
      <SL title="Typography Scale" />
      {[
        { size: 14, label: 'Heading · font-bold · 14px' },
        { size: 12, label: 'Subheading · font-bold · 12px' },
        { size: 10, label: 'Body · regular · 10px' },
        { size: 9, label: 'Body small · regular · 9px' },
        { size: 8, label: 'Caption · regular · 8px' },
        { size: 7, label: 'Label / badge · 7px' },
      ].map(t => (
        <div key={t.size} className="font-mono text-gray-700 border-b border-gray-100 py-1" style={{ fontSize: t.size }}>
          {t.label}
        </div>
      ))}

      {/* Spacing */}
      <SL title="Spacing System (px)" />
      <div className="flex gap-1 mb-2 items-end">
        {[4, 8, 12, 16, 24, 32, 48].map(s => (
          <div key={s} className="flex flex-col items-center">
            <div className="bg-gray-400" style={{ width: s > 20 ? 16 : s, height: Math.min(s, 48) }} />
            <div className="font-mono text-gray-400 mt-0.5" style={{ fontSize: 7 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Color Palette */}
      <SL title="Color System (Grayscale)" />
      <div className="flex gap-1 mb-4">
        {[
          { bg: '#1f2937', label: '900' },
          { bg: '#374151', label: '700' },
          { bg: '#6b7280', label: '500' },
          { bg: '#9ca3af', label: '400' },
          { bg: '#d1d5db', label: '300' },
          { bg: '#e5e7eb', label: '200' },
          { bg: '#f9fafb', label: '50' },
        ].map(c => (
          <div key={c.label} className="flex flex-col items-center flex-1">
            <div className="border border-gray-300 w-full" style={{ height: 24, background: c.bg }} />
            <div className="font-mono text-gray-400" style={{ fontSize: 7 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <Note>
        All components follow Space Mono typeface. Wireframe only — no colors, illustrations, or gradients.
        Every pixel communicates structure and function.
      </Note>
    </div>
  </div>
)
