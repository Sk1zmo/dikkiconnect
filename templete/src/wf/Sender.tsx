import {
  Screen, Input, Btn, Divider, ImgBox, QRBox, SL, Note, Card,
  MapArea, Chip, TrackLine, Row, Stars, Avatar, SENDER_TABS, Stepper,
} from './primitives'

export const Home = () => (
  <Screen title="HOME" tabs={SENDER_TABS} active={0} actions="🔔" id="SND-01">
    <div className="flex items-center gap-2 mb-2">
      <Avatar size={32} />
      <div>
        <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>Good morning, Amaka 👋</div>
        <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>Lagos, Nigeria</div>
      </div>
    </div>
    <div className="border border-gray-300 flex items-center px-2 py-1.5 mb-3">
      <span className="font-mono text-gray-400 mr-2" style={{ fontSize: 10 }}>🔍</span>
      <span className="font-mono text-gray-400" style={{ fontSize: 9 }}>Search parcels, hubs...</span>
    </div>
    <div className="grid grid-cols-2 gap-2 mb-3">
      <Btn label="BOOK PARCEL" />
      <Btn label="TRACK PARCEL" variant="secondary" />
    </div>
    <SL title="Active Deliveries" />
    {[
      { id: 'PG-1042', route: 'LOS → ABJ', status: 'IN TRANSIT' },
      { id: 'PG-1038', route: 'LOS → PH', status: 'AT HUB' },
    ].map(p => (
      <Card key={p.id}>
        <div className="flex justify-between items-start">
          <div>
            <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>{p.id}</div>
            <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>{p.route}</div>
          </div>
          <Chip label={p.status} filled />
        </div>
      </Card>
    ))}
    <SL title="Nearby Hubs" />
    <MapArea height={90} label="NEARBY HUBS · TAP TO NAVIGATE" />
    <SL title="Recent Orders" />
    {[
      { id: 'PG-1030', route: 'LOS → KAN', date: '12 Jan', status: 'DELIVERED' },
      { id: 'PG-1018', route: 'LOS → ABJ', date: '4 Jan', status: 'DELIVERED' },
    ].map(p => (
      <Card key={p.id}>
        <div className="flex justify-between">
          <div className="font-mono text-gray-800 font-bold" style={{ fontSize: 10 }}>{p.id} · {p.route}</div>
          <Chip label={p.status} />
        </div>
        <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>{p.date}</div>
      </Card>
    ))}
    <SL title="Promotions" />
    <ImgBox height={60} label="PROMO BANNER · SWIPEABLE CAROUSEL" />
  </Screen>
)

export const BookStep1 = () => (
  <Screen title="BOOK PARCEL" back tabs={SENDER_TABS} active={0} id="SND-02">
    <Stepper steps={['Cities', 'Parcel', 'Hub', 'Pay']} current={0} />
    <SL title="Origin City" />
    <div className="border border-gray-400 flex items-center mb-3">
      <div className="px-2 py-2 border-r border-gray-300 font-mono text-gray-400 shrink-0" style={{ fontSize: 10 }}>FROM</div>
      <input
        className="flex-1 px-2 py-2 font-mono text-gray-600 outline-none"
        style={{ fontSize: 10 }}
        defaultValue="Lagos, Nigeria"
        readOnly
      />
      <div className="px-2 font-mono text-gray-400" style={{ fontSize: 10 }}>✕</div>
    </div>
    <div className="flex justify-center mb-3">
      <div className="border border-gray-400 px-3 py-1 font-mono text-gray-600" style={{ fontSize: 9 }}>⇅ SWAP</div>
    </div>
    <SL title="Destination City" />
    <div className="border border-gray-400 flex items-center mb-3">
      <div className="px-2 py-2 border-r border-gray-300 font-mono text-gray-400 shrink-0" style={{ fontSize: 10 }}>TO</div>
      <input
        className="flex-1 px-2 py-2 font-mono text-gray-400 outline-none"
        style={{ fontSize: 10 }}
        placeholder="Select destination city..."
        readOnly
      />
    </div>
    <SL title="Popular Routes" />
    {['Lagos → Abuja', 'Lagos → Port Harcourt', 'Lagos → Kano', 'Abuja → Kano'].map(r => (
      <div key={r} className="border-b border-gray-200 py-2 flex justify-between font-mono" style={{ fontSize: 10 }}>
        <span className="text-gray-700">{r}</span>
        <span className="text-gray-400">›</span>
      </div>
    ))}
    <div className="mt-3">
      <Btn label="CONTINUE →" />
    </div>
    <Note>City search with autocomplete. Route price preview before proceeding.</Note>
  </Screen>
)

export const BookStep2 = () => (
  <Screen title="PARCEL DETAILS" back tabs={SENDER_TABS} active={0} id="SND-03">
    <Stepper steps={['Cities', 'Parcel', 'Hub', 'Pay']} current={1} />
    <SL title="Parcel Category" />
    <div className="grid grid-cols-3 gap-1 mb-3">
      {['Documents', 'Electronics', 'Clothing', 'Food', 'Medicine', 'Other'].map(c => (
        <div key={c} className="border border-gray-400 py-2 text-center font-mono" style={{ fontSize: 8 }}>
          {c}
        </div>
      ))}
    </div>
    <Input label="Parcel Type / Description" placeholder="e.g. Laptop bag, spare parts..." />
    <div className="grid grid-cols-2 gap-2">
      <Input label="Weight (kg)" placeholder="0.0" />
      <Input label="Declared Value (₦)" placeholder="0.00" />
    </div>
    <SL title="Dimensions (optional)" />
    <div className="grid grid-cols-3 gap-1 mb-3">
      <Input label="Length (cm)" placeholder="0" />
      <Input label="Width (cm)" placeholder="0" />
      <Input label="Height (cm)" placeholder="0" />
    </div>
    <SL title="Fragile?" />
    <div className="flex gap-2 mb-3">
      <div className="border-2 border-gray-800 px-3 py-1 font-mono text-gray-800" style={{ fontSize: 9 }}>● YES</div>
      <div className="border border-gray-400 px-3 py-1 font-mono text-gray-400" style={{ fontSize: 9 }}>○ NO</div>
    </div>
    <Input label="Notes for Driver" placeholder="Handle with care, keep upright..." />
    <SL title="Recipient Details" />
    <Input label="Recipient Name" placeholder="John Doe" />
    <Input label="Recipient Phone" placeholder="0800 000 0001" />
    <Btn label="CONTINUE →" />
    <Note>Weight validation required. Fragile toggle adds insurance option. Photo upload optional.</Note>
  </Screen>
)

export const PriceEstimate = () => (
  <Screen title="PRICE ESTIMATE" back tabs={SENDER_TABS} active={0} id="SND-04">
    <Stepper steps={['Cities', 'Parcel', 'Hub', 'Pay']} current={1} />
    <Card>
      <div className="font-mono font-bold text-gray-800 mb-2" style={{ fontSize: 11 }}>Lagos → Abuja</div>
      <Row label="Parcel Weight" value="2.5 kg" />
      <Row label="Category" value="Electronics" />
      <Row label="Declared Value" value="₦ 85,000" />
      <Row label="Fragile" value="YES" />
    </Card>
    <SL title="Pricing Breakdown" />
    <Card>
      <Row label="Base Rate (per kg)" value="₦ 1,200" />
      <Row label="Distance Surcharge" value="₦ 800" />
      <Row label="Fragile Handling" value="₦ 500" />
      <Row label="Insurance (optional)" value="₦ 200" />
      <Divider />
      <Row label="TOTAL" value="₦ 3,700" border={false} />
    </Card>
    <SL title="Options" />
    <div className="flex gap-2 mb-3">
      {[
        { label: 'STANDARD', days: '2-3 days', price: '₦ 3,700' },
        { label: 'EXPRESS', days: '1 day', price: '₦ 5,500' },
      ].map(o => (
        <div key={o.label} className="flex-1 border-2 border-gray-300 p-2 text-center">
          <div className="font-mono font-bold text-gray-800" style={{ fontSize: 9 }}>{o.label}</div>
          <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>{o.days}</div>
          <div className="font-mono font-bold text-gray-700 mt-1" style={{ fontSize: 11 }}>{o.price}</div>
        </div>
      ))}
    </div>
    <Btn label="CHOOSE HUB →" />
    <Note>Price updates live with insurance toggle. Compare standard vs express.</Note>
  </Screen>
)

export const ChooseHub = () => (
  <Screen title="CHOOSE DROP-OFF HUB" back tabs={SENDER_TABS} active={0} id="SND-05">
    <Stepper steps={['Cities', 'Parcel', 'Hub', 'Pay']} current={2} />
    <MapArea height={130} label="HUBS NEAR YOU · Lagos, Nigeria" />
    <SL title="Available Hubs" />
    {[
      { name: 'Yaba Hub · ParcelPoint', dist: '0.8 km', hours: '8am–8pm', slots: 12 },
      { name: 'Ikeja Hub · ShopExpress', dist: '2.1 km', hours: '7am–9pm', slots: 5 },
      { name: 'Lekki Hub · SendCenter', dist: '4.3 km', hours: '9am–7pm', slots: 22 },
    ].map(h => (
      <Card key={h.name}>
        <div className="flex justify-between items-start">
          <div>
            <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>{h.name}</div>
            <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>{h.dist} away · {h.hours}</div>
            <div className="font-mono text-gray-500 mt-0.5" style={{ fontSize: 8 }}>{h.slots} available slots</div>
          </div>
          <Btn label="SELECT" variant="secondary" full={false} />
        </div>
      </Card>
    ))}
    <Note>Hub slots update real-time. Filter by distance, hours, rating.</Note>
  </Screen>
)

export const Payment = () => (
  <Screen title="PAYMENT" back tabs={SENDER_TABS} active={0} id="SND-06">
    <Stepper steps={['Cities', 'Parcel', 'Hub', 'Pay']} current={3} />
    <Card>
      <div className="font-mono font-bold text-gray-800 mb-1" style={{ fontSize: 10 }}>Order Summary</div>
      <Row label="Lagos → Abuja · Standard" value="" />
      <Row label="Drop-off Hub: Yaba Hub" value="" />
      <Row label="Weight: 2.5 kg · Fragile" value="" />
      <Divider />
      <Row label="TOTAL AMOUNT" value="₦ 3,700" border={false} />
    </Card>
    <SL title="Payment Method" />
    {[
      { label: 'Wallet Balance', sub: '₦ 12,400 available', active: true },
      { label: 'Card ···· 4521', sub: 'Visa · Expires 04/27', active: false },
      { label: 'Bank Transfer', sub: 'GTBank · Pay via USSD', active: false },
    ].map(m => (
      <div key={m.label} className={`border flex items-center gap-2 px-3 py-2 mb-2 ${m.active ? 'border-gray-800' : 'border-gray-300'}`}>
        <div className={`border rounded-full shrink-0 ${m.active ? 'border-gray-800 bg-gray-800' : 'border-gray-400'}`} style={{ width: 12, height: 12 }} />
        <div className="flex-1">
          <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>{m.label}</div>
          <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>{m.sub}</div>
        </div>
      </div>
    ))}
    <div className="border-dashed border border-gray-400 py-2 text-center font-mono text-gray-500 mb-3" style={{ fontSize: 9 }}>
      + Add New Payment Method
    </div>
    <Btn label="PAY ₦ 3,700" />
    <div className="text-center font-mono text-gray-400" style={{ fontSize: 8 }}>🔒 Secured by Paystack</div>
    <Note>Wallet deducts instantly. Card/bank redirect to payment gateway.</Note>
  </Screen>
)

export const BookingConfirmed = () => (
  <Screen title="BOOKING CONFIRMED" tabs={SENDER_TABS} active={1} id="SND-07">
    <div className="flex flex-col items-center py-4">
      <div className="border-2 border-gray-800 rounded-full flex items-center justify-center mb-3" style={{ width: 56, height: 56, fontSize: 24 }}>
        ✓
      </div>
      <div className="font-mono font-bold text-gray-800 mb-1" style={{ fontSize: 13 }}>BOOKING CONFIRMED!</div>
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Order #PG-1043</div>
    </div>
    <Card>
      <Row label="Route" value="Lagos → Abuja" />
      <Row label="Drop-off Hub" value="Yaba Hub" />
      <Row label="Expected Transit" value="2–3 days" />
      <Row label="Amount Paid" value="₦ 3,700" border={false} />
    </Card>
    <SL title="Your Drop-off QR Code" />
    <div className="flex justify-center mb-1">
      <QRBox size={100} />
    </div>
    <div className="text-center font-mono text-gray-500 mb-3" style={{ fontSize: 9 }}>
      Show this QR at the hub when dropping off your parcel
    </div>
    <Btn label="SAVE QR CODE" variant="secondary" />
    <Btn label="SHARE TRACKING LINK" variant="secondary" />
    <Btn label="TRACK PARCEL" />
    <Note>QR expires after drop-off scan. Tracking link shareable with recipient.</Note>
  </Screen>
)

export const QRDropOff = () => (
  <Screen title="DROP-OFF QR" back tabs={SENDER_TABS} active={1} id="SND-08">
    <div className="text-center py-2">
      <div className="font-mono font-bold text-gray-800" style={{ fontSize: 11 }}>Order #PG-1043</div>
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Yaba Hub · Lagos, Nigeria</div>
    </div>
    <div className="flex justify-center mb-2">
      <QRBox size={140} />
    </div>
    <div className="text-center font-mono text-gray-500 mb-1" style={{ fontSize: 8 }}>
      PG-1043-LOS-ABJ-2025
    </div>
    <div className="text-center font-mono text-gray-400 mb-3" style={{ fontSize: 8 }}>
      Valid until: 15 Jan 2025 · 11:59 PM
    </div>
    <Card>
      <Row label="Recipient" value="John Doe" />
      <Row label="Destination" value="Abuja, Nigeria" />
      <Row label="Weight" value="2.5 kg" border={false} />
    </Card>
    <Btn label="SHARE QR CODE" variant="secondary" />
    <Btn label="VIEW TRACKING" variant="ghost" />
    <Note>Hub scanner reads QR → confirms intake → notifies sender. QR becomes invalid after scan.</Note>
  </Screen>
)

export const Tracking = () => (
  <Screen title="TRACKING" back tabs={SENDER_TABS} active={2} actions="↗" id="SND-09">
    <Card>
      <div className="flex justify-between items-center mb-1">
        <div className="font-mono font-bold text-gray-800" style={{ fontSize: 11 }}>PG-1043</div>
        <Chip label="IN TRANSIT" filled />
      </div>
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Lagos → Abuja · Standard</div>
      <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>ETA: 14 Jan 2025</div>
    </Card>
    <SL title="Live Location" />
    <MapArea height={100} label="LIVE VEHICLE TRACKING · ROUTE VISIBLE" />
    <SL title="Tracking Timeline" />
    <TrackLine steps={[
      { label: 'Booking Confirmed', sub: '12 Jan · 10:22 AM', done: true },
      { label: 'Dropped at Hub (Yaba)', sub: '12 Jan · 2:14 PM · By Amaka', done: true },
      { label: 'Picked by Traveler', sub: '13 Jan · 8:05 AM · Emeka O.', done: true },
      { label: 'In Transit', sub: '13 Jan · 8:30 AM · Moving to Abuja', done: true, active: true },
      { label: 'Arrived at Destination Hub', sub: 'Pending', done: false },
      { label: 'Collected by Recipient', sub: 'Pending', done: false },
    ]} />
    <SL title="Traveler Info" />
    <Card>
      <div className="flex items-center gap-2">
        <Avatar size={36} label="EO" />
        <div className="flex-1">
          <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>Emeka Okafor</div>
          <Stars n={5} />
          <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>Toyota Camry · LOS 234 AA</div>
        </div>
        <div className="border border-gray-400 px-2 py-1 font-mono text-gray-600" style={{ fontSize: 9 }}>📞 CALL</div>
      </div>
    </Card>
    <Note>Call button → masked number. Share tracking link. Report issue available.</Note>
  </Screen>
)

export const BookingsList = () => (
  <Screen title="MY BOOKINGS" tabs={SENDER_TABS} active={1} id="SND-10">
    <div className="flex gap-1 mb-3 overflow-x-auto">
      {['All', 'Active', 'In Transit', 'Delivered', 'Cancelled'].map((f, i) => (
        <div key={f} className={`border px-2 py-1 font-mono shrink-0 ${i === 0 ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-500'}`} style={{ fontSize: 8 }}>
          {f}
        </div>
      ))}
    </div>
    {[
      { id: 'PG-1043', route: 'Lagos → Abuja', date: '12 Jan', status: 'IN TRANSIT', amount: '₦3,700' },
      { id: 'PG-1038', route: 'Lagos → PH', date: '10 Jan', status: 'AT HUB', amount: '₦2,200' },
      { id: 'PG-1030', route: 'Lagos → Kano', date: '4 Jan', status: 'DELIVERED', amount: '₦4,100' },
      { id: 'PG-1018', route: 'Lagos → Abuja', date: '28 Dec', status: 'DELIVERED', amount: '₦3,200' },
    ].map(b => (
      <Card key={b.id}>
        <div className="flex justify-between items-start">
          <div>
            <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>{b.id}</div>
            <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>{b.route}</div>
            <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>{b.date}</div>
          </div>
          <div className="text-right">
            <Chip label={b.status} />
            <div className="font-mono font-bold text-gray-700 mt-1" style={{ fontSize: 10 }}>{b.amount}</div>
          </div>
        </div>
      </Card>
    ))}
  </Screen>
)

export const SenderWallet = () => (
  <Screen title="WALLET" tabs={SENDER_TABS} active={3} id="SND-11">
    <div className="border-2 border-gray-800 p-4 mb-3 text-center">
      <div className="font-mono text-gray-500 mb-1" style={{ fontSize: 9 }}>WALLET BALANCE</div>
      <div className="font-mono font-bold text-gray-800" style={{ fontSize: 24 }}>₦ 12,400.00</div>
    </div>
    <div className="grid grid-cols-2 gap-2 mb-3">
      <Btn label="FUND WALLET" />
      <Btn label="WITHDRAW" variant="secondary" />
    </div>
    <SL title="Recent Transactions" />
    {[
      { label: 'Booking PG-1043', amount: '−₦3,700', date: '12 Jan', type: 'debit' },
      { label: 'Wallet Top-up', amount: '+₦10,000', date: '11 Jan', type: 'credit' },
      { label: 'Booking PG-1038', amount: '−₦2,200', date: '10 Jan', type: 'debit' },
      { label: 'Refund PG-1022', amount: '+₦1,500', date: '5 Jan', type: 'credit' },
    ].map(t => (
      <div key={t.label} className="flex justify-between py-2 border-b border-gray-200 font-mono" style={{ fontSize: 10 }}>
        <div>
          <div className="text-gray-800">{t.label}</div>
          <div className="text-gray-400" style={{ fontSize: 8 }}>{t.date}</div>
        </div>
        <div className={t.type === 'credit' ? 'text-gray-700 font-bold' : 'text-gray-600'}>{t.amount}</div>
      </div>
    ))}
    <Note>Fund via card, bank transfer, USSD. Withdraw to bank account (1–2 business days).</Note>
  </Screen>
)

export const SenderProfile = () => (
  <Screen title="PROFILE" tabs={SENDER_TABS} active={4} id="SND-12">
    <div className="flex items-center gap-3 py-3 border-b border-gray-200 mb-2">
      <Avatar size={52} label="AO" />
      <div>
        <div className="font-mono font-bold text-gray-800" style={{ fontSize: 12 }}>Amaka Okafor</div>
        <div className="font-mono text-gray-400" style={{ fontSize: 9 }}>+234 0800 000 0000</div>
        <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>Member since Jan 2024</div>
      </div>
      <div className="ml-auto font-mono text-gray-400 border border-gray-300 px-2 py-1" style={{ fontSize: 8 }}>EDIT</div>
    </div>
    {[
      'KYC Status → Verified ✓',
      'Payment Methods',
      'Notification Preferences',
      'Emergency Contacts',
      'Saved Addresses',
      'Documents',
      'Help & Support',
      'Rate the App',
      'Terms & Privacy',
      'Switch Role',
      'Sign Out',
    ].map(item => (
      <div key={item} className="flex justify-between py-2.5 border-b border-gray-100 font-mono text-gray-700" style={{ fontSize: 10 }}>
        <span>{item}</span>
        <span className="text-gray-400">›</span>
      </div>
    ))}
  </Screen>
)
