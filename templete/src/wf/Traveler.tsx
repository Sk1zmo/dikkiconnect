import {
  Screen, Input, Btn, SL, Note, Card, MapArea, Chip, Row, Stars,
  Avatar, TRAVELER_TABS, Divider, ScannerFrame, OTPInput, ImgBox, Progress,
} from './primitives'

export const TravelerDashboard = () => (
  <Screen title="DASHBOARD" tabs={TRAVELER_TABS} active={0} actions="🔔" id="TRV-01">
    <div className="flex items-center gap-2 mb-3">
      <Avatar size={36} label="EO" />
      <div className="flex-1">
        <div className="font-mono font-bold text-gray-800" style={{ fontSize: 11 }}>Emeka Okafor</div>
        <div className="flex items-center gap-1">
          <Stars n={5} />
          <span className="font-mono text-gray-400" style={{ fontSize: 8 }}>(128 trips)</span>
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono font-bold text-gray-800" style={{ fontSize: 11 }}>₦ 8,240</div>
        <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>Today's Earnings</div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div className="border border-gray-300 p-2 text-center">
        <div className="font-mono font-bold text-gray-800" style={{ fontSize: 16 }}>3</div>
        <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>Today's Trips</div>
      </div>
      <div className="border border-gray-300 p-2 text-center">
        <div className="font-mono font-bold text-gray-800" style={{ fontSize: 16 }}>7</div>
        <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>Parcels Carried</div>
      </div>
    </div>
    <Btn label="CREATE NEW TRIP" />
    <SL title="Today's Active Trip" />
    <Card>
      <div className="flex justify-between items-center mb-1">
        <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>Lagos → Abuja</div>
        <Chip label="ACTIVE" filled />
      </div>
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Departs 09:00 · 4 parcels · 3 passengers</div>
      <Progress value={40} label="Route Progress: Ibadan Bypass" />
    </Card>
    <SL title="Available Parcel Jobs" />
    {[
      { id: 'PG-1044', route: 'LOS → ABJ', reward: '₦ 1,200', weight: '3kg' },
      { id: 'PG-1045', route: 'LOS → PH', reward: '₦ 900', weight: '1.5kg' },
    ].map(p => (
      <Card key={p.id}>
        <div className="flex justify-between items-center">
          <div>
            <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>{p.id} · {p.route}</div>
            <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>{p.weight}</div>
          </div>
          <div className="text-right">
            <div className="font-mono font-bold text-gray-700" style={{ fontSize: 11 }}>{p.reward}</div>
            <Btn label="ACCEPT" full={false} />
          </div>
        </div>
      </Card>
    ))}
    <SL title="Vehicle Status" />
    <Card>
      <div className="flex justify-between font-mono" style={{ fontSize: 9 }}>
        <span className="text-gray-600">Toyota Camry · LOS 234 AA</span>
        <Chip label="VERIFIED" />
      </div>
    </Card>
  </Screen>
)

export const CreateTripRoute = () => (
  <Screen title="CREATE TRIP" back tabs={TRAVELER_TABS} active={1} id="TRV-02">
    <SL title="Step 1 of 3 · Route" />
    <Input label="Origin City" placeholder="Lagos, Nigeria" />
    <Input label="Destination City" placeholder="Select destination..." />
    <Input label="Departure Date" placeholder="DD / MM / YYYY" />
    <Input label="Departure Time" placeholder="HH : MM (24hr)" />
    <SL title="Stopovers (optional)" />
    <div className="border border-dashed border-gray-400 py-2 text-center font-mono text-gray-500 mb-3" style={{ fontSize: 9 }}>
      + Add Stopover City
    </div>
    <SL title="Route Preview" />
    <MapArea height={100} label="ROUTE MAP PREVIEW" />
    <div className="font-mono text-gray-500 mb-3 text-center" style={{ fontSize: 9 }}>Lagos → Ibadan → Abuja · ~680 km</div>
    <Btn label="NEXT: VEHICLE →" />
    <Note>Date/time picker. Map shows route preview with estimated duration.</Note>
  </Screen>
)

export const CreateTripDetails = () => (
  <Screen title="TRIP DETAILS" back tabs={TRAVELER_TABS} active={1} id="TRV-03">
    <SL title="Step 2 of 3 · Vehicle & Capacity" />
    <SL title="Vehicle" />
    <div className="border border-gray-300 flex items-center px-3 py-2 mb-3">
      <div className="flex-1">
        <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>Toyota Camry 2019</div>
        <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>LOS 234 AA · Sedan</div>
      </div>
      <Chip label="SELECTED" filled />
    </div>
    <div className="border border-dashed border-gray-400 py-2 text-center font-mono text-gray-500 mb-3" style={{ fontSize: 9 }}>
      + Add Another Vehicle
    </div>
    <div className="grid grid-cols-2 gap-2">
      <Input label="Available Passenger Seats" placeholder="4" />
      <Input label="Seat Price (₦)" placeholder="6,500" />
    </div>
    <Input label="Available Cargo Space (kg)" placeholder="30" />
    <SL title="Parcel Weight Limit per Job" />
    <div className="flex gap-2 mb-3">
      {['5 kg', '10 kg', '20 kg', 'Custom'].map(w => (
        <div key={w} className="border border-gray-400 px-2 py-1 font-mono text-gray-600" style={{ fontSize: 8 }}>{w}</div>
      ))}
    </div>
    <SL title="Rules & Preferences" />
    <div className="space-y-1 mb-3">
      {['No smoking', 'No pets', 'Accept fragile items', 'Accept liquids'].map(r => (
        <div key={r} className="flex items-center gap-2 font-mono" style={{ fontSize: 9 }}>
          <div className="border-2 border-gray-800 bg-gray-800" style={{ width: 10, height: 10 }} />
          <span className="text-gray-700">{r}</span>
        </div>
      ))}
    </div>
    <Btn label="NEXT: REVIEW →" />
  </Screen>
)

export const PublishTrip = () => (
  <Screen title="REVIEW & PUBLISH" back tabs={TRAVELER_TABS} active={1} id="TRV-04">
    <SL title="Step 3 of 3 · Confirm" />
    <Card>
      <Row label="Route" value="Lagos → Abuja" />
      <Row label="Via" value="Ibadan" />
      <Row label="Date & Time" value="13 Jan · 09:00" />
      <Row label="Vehicle" value="Toyota Camry" />
      <Row label="Passenger Seats" value="4" />
      <Row label="Seat Price" value="₦ 6,500" />
      <Row label="Cargo Space" value="30 kg" border={false} />
    </Card>
    <SL title="Earnings Preview" />
    <Card>
      <Row label="4 seats × ₦6,500" value="₦ 26,000" />
      <Row label="Parcel Rewards (est.)" value="₦ 3,600" />
      <Row label="Platform Fee (10%)" value="−₦ 2,960" />
      <Row label="NET EARNINGS (est.)" value="₦ 26,640" border={false} />
    </Card>
    <Btn label="PUBLISH TRIP" />
    <Btn label="SAVE AS DRAFT" variant="secondary" />
    <Note>Trip visible to passengers & senders after publish. Edit window: 30 min after publish.</Note>
  </Screen>
)

export const AvailableParcels = () => (
  <Screen title="PARCEL JOBS" tabs={TRAVELER_TABS} active={0} id="TRV-05">
    <div className="border border-gray-300 flex items-center px-2 py-1.5 mb-2">
      <span className="font-mono text-gray-400 mr-2" style={{ fontSize: 10 }}>🔍</span>
      <span className="font-mono text-gray-400" style={{ fontSize: 9 }}>Filter by route, weight, reward...</span>
    </div>
    <div className="flex gap-1 mb-3">
      {['My Route', 'High Reward', 'Light Weight', 'Nearby'].map((f, i) => (
        <div key={f} className={`border px-2 py-1 font-mono shrink-0 ${i === 0 ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-500'}`} style={{ fontSize: 8 }}>
          {f}
        </div>
      ))}
    </div>
    {[
      { id: 'PG-1044', from: 'Lagos (Yaba Hub)', to: 'Abuja (Garki Hub)', weight: '2.5 kg', reward: '₦ 1,200', tag: 'FRAGILE' },
      { id: 'PG-1046', from: 'Lagos (Ikeja)', to: 'Abuja (Wuse)', weight: '5 kg', reward: '₦ 2,100', tag: 'STANDARD' },
      { id: 'PG-1048', from: 'Lagos (Lekki)', to: 'Benin City', weight: '1 kg', reward: '₦ 600', tag: 'DOCS' },
    ].map(p => (
      <Card key={p.id}>
        <div className="flex justify-between items-start mb-1">
          <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>{p.id}</div>
          <Chip label={p.tag} />
        </div>
        <div className="font-mono text-gray-600" style={{ fontSize: 9 }}>📍 {p.from}</div>
        <div className="font-mono text-gray-600" style={{ fontSize: 9 }}>📍 {p.to}</div>
        <Divider />
        <div className="flex justify-between items-center">
          <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>{p.weight}</div>
          <div className="font-mono font-bold text-gray-800" style={{ fontSize: 12 }}>{p.reward}</div>
          <Btn label="ACCEPT" full={false} />
        </div>
      </Card>
    ))}
  </Screen>
)

export const ParcelAccept = () => (
  <Screen title="PARCEL DETAILS" back tabs={TRAVELER_TABS} active={0} id="TRV-06">
    <Card>
      <div className="font-mono font-bold text-gray-800 mb-2" style={{ fontSize: 11 }}>Order PG-1044</div>
      <Row label="Category" value="Electronics" />
      <Row label="Weight" value="2.5 kg" />
      <Row label="Fragile" value="YES ⚠" />
      <Row label="Pick-up Hub" value="Yaba Hub, Lagos" />
      <Row label="Drop-off Hub" value="Garki Hub, Abuja" />
      <Row label="Declared Value" value="₦ 85,000" />
      <Row label="Your Reward" value="₦ 1,200" border={false} />
    </Card>
    <SL title="Sender" />
    <Card>
      <div className="flex items-center gap-2">
        <Avatar size={32} />
        <div>
          <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>A. Okafor</div>
          <Stars n={4} />
          <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>12 shipments</div>
        </div>
      </div>
    </Card>
    <SL title="Terms" />
    <div className="font-mono text-gray-500 mb-3" style={{ fontSize: 8, lineHeight: 1.6 }}>
      By accepting, you agree to collect from Yaba Hub using OTP verification, transport carefully, and deliver to Garki Hub within 24 hours.
    </div>
    <Btn label="ACCEPT THIS JOB" />
    <Btn label="DECLINE" variant="danger" />
    <Note>Job acceptance is binding. Cancellation after acceptance reduces rating.</Note>
  </Screen>
)

export const ScanQR = () => (
  <Screen title="SCAN QR CODE" back tabs={TRAVELER_TABS} active={2} id="TRV-07">
    <div className="text-center py-2">
      <div className="font-mono font-bold text-gray-800 mb-1" style={{ fontSize: 11 }}>Scan Parcel QR</div>
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Yaba Hub · Parcel PG-1044</div>
    </div>
    <ScannerFrame />
    <div className="text-center mb-3">
      <div className="font-mono text-gray-500 mb-2" style={{ fontSize: 9 }}>OR enter tracking code manually</div>
      <div className="border border-gray-400 px-3 py-2 font-mono text-gray-600 text-center" style={{ fontSize: 10 }}>
        PG - ____ - ___ - ___
      </div>
    </div>
    <Btn label="ENTER OTP INSTEAD" variant="secondary" />
    <Note>Camera requires permission. Auto-detects QR. Vibrates on successful scan.</Note>
  </Screen>
)

export const EnterOTP = () => (
  <Screen title="ENTER OTP" back tabs={TRAVELER_TABS} active={2} id="TRV-08">
    <div className="text-center py-3">
      <div className="font-mono font-bold text-gray-800 mb-1" style={{ fontSize: 11 }}>Hub OTP Verification</div>
      <div className="font-mono text-gray-500 mb-1" style={{ fontSize: 9 }}>Ask the Hub Manager for the OTP</div>
      <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>Parcel: PG-1044 · Pickup from Yaba Hub</div>
    </div>
    <OTPInput digits={4} />
    <div className="text-center font-mono text-gray-400 mb-3" style={{ fontSize: 8 }}>
      OTP generated by Hub Manager · Valid for 10 minutes
    </div>
    <Btn label="VERIFY & PICK UP" />
    <Btn label="CALL HUB MANAGER" variant="secondary" />
    <Note>Wrong OTP × 3 → locks pickup for 30 min. Hub manager can reset.</Note>
  </Screen>
)

export const PickupConfirmed = () => (
  <Screen title="PICKUP CONFIRMED" tabs={TRAVELER_TABS} active={2} id="TRV-09">
    <div className="flex flex-col items-center py-5">
      <div className="border-2 border-gray-800 rounded-full flex items-center justify-center mb-3" style={{ width: 52, height: 52, fontSize: 22 }}>✓</div>
      <div className="font-mono font-bold text-gray-800 mb-1" style={{ fontSize: 12 }}>PICKUP CONFIRMED</div>
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Parcel PG-1044 is now in your care</div>
    </div>
    <Card>
      <Row label="Picked From" value="Yaba Hub, Lagos" />
      <Row label="Deliver To" value="Garki Hub, Abuja" />
      <Row label="Deadline" value="14 Jan · 11:59 PM" />
      <Row label="Your Reward" value="₦ 1,200" border={false} />
    </Card>
    <ImgBox height={60} label="PARCEL PHOTO (captured at pickup)" />
    <SL title="Next Step" />
    <div className="font-mono text-gray-500 mb-3" style={{ fontSize: 9, lineHeight: 1.6 }}>
      Navigate to your destination. Upon arrival, scan the parcel QR at Garki Hub and complete drop-off OTP.
    </div>
    <Btn label="NAVIGATE TO DESTINATION" />
    <Btn label="VIEW ALL MY PARCELS" variant="secondary" />
  </Screen>
)

export const RouteNavigation = () => (
  <Screen title="NAVIGATION" tabs={TRAVELER_TABS} active={0} id="TRV-10">
    <MapArea height={260} label="FULL NAVIGATION MAP · TURN-BY-TURN" />
    <div className="border-t border-gray-300 px-3 py-2 bg-white">
      <div className="font-mono font-bold text-gray-800" style={{ fontSize: 12 }}>Turn right in 1.2 km</div>
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Onto Sagamu–Ore Expressway</div>
    </div>
    <Card>
      <div className="flex justify-between font-mono" style={{ fontSize: 9 }}>
        <span className="text-gray-500">ETA Abuja</span>
        <span className="font-bold text-gray-800">4h 32min</span>
      </div>
      <div className="flex justify-between font-mono mt-1" style={{ fontSize: 9 }}>
        <span className="text-gray-500">Distance Remaining</span>
        <span className="font-bold text-gray-800">412 km</span>
      </div>
    </Card>
    <div className="flex gap-2">
      <Btn label="PARCELS (4)" variant="secondary" />
      <Btn label="PASSENGERS (3)" variant="secondary" />
    </div>
    <Note>Fullscreen map mode available. Parcel/passenger quick-view. SOS button top-right.</Note>
  </Screen>
)

export const DropOffScan = () => (
  <Screen title="DROP-OFF SCAN" back tabs={TRAVELER_TABS} active={2} id="TRV-11">
    <div className="text-center py-2">
      <div className="font-mono font-bold text-gray-800 mb-1" style={{ fontSize: 11 }}>You've Arrived!</div>
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Garki Hub, Abuja · Scan parcel QR</div>
    </div>
    <ScannerFrame />
    <div className="text-center font-mono text-gray-500 mb-3" style={{ fontSize: 9 }}>
      Scan QR then enter Hub Manager OTP to complete drop-off
    </div>
    <SL title="My Active Parcels for Drop-off" />
    {['PG-1044 · Electronics · ✓ Scanned', 'PG-1045 · Clothing · ○ Pending'].map(p => (
      <div key={p} className="border border-gray-300 px-2 py-1.5 mb-1 font-mono text-gray-600" style={{ fontSize: 9 }}>{p}</div>
    ))}
    <Btn label="COMPLETE DROP-OFF" />
  </Screen>
)

export const TravelerWallet = () => (
  <Screen title="WALLET" tabs={TRAVELER_TABS} active={3} id="TRV-12">
    <div className="border-2 border-gray-800 p-4 mb-3 text-center">
      <div className="font-mono text-gray-500 mb-1" style={{ fontSize: 9 }}>TOTAL EARNINGS</div>
      <div className="font-mono font-bold text-gray-800" style={{ fontSize: 24 }}>₦ 34,800.00</div>
      <div className="font-mono text-gray-400 mt-1" style={{ fontSize: 8 }}>This month: ₦ 12,400</div>
    </div>
    <div className="grid grid-cols-2 gap-2 mb-3">
      <Btn label="WITHDRAW" />
      <Btn label="HISTORY" variant="secondary" />
    </div>
    <SL title="Trip Earnings Breakdown" />
    <Card>
      <Row label="Parcel Deliveries (18)" value="₦ 22,400" />
      <Row label="Passenger Seats (43)" value="₦ 12,400" />
      <Row label="Bonus / Referral" value="₦ 2,000" />
      <Row label="Platform Fees" value="−₦ 2,000" border={false} />
    </Card>
    <SL title="Recent Transactions" />
    {['Trip LOS-ABJ · Jan 13 · +₦4,200', 'Withdrawal · Jan 10 · −₦10,000', 'Trip LOS-PH · Jan 8 · +₦2,600'].map(t => (
      <div key={t} className="border-b border-gray-200 py-2 font-mono text-gray-600" style={{ fontSize: 9 }}>{t}</div>
    ))}
  </Screen>
)
