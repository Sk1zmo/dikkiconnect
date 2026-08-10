import {
  Screen, Btn, SL, Note, Card, MapArea, Chip, Row, Stars,
  Avatar, PASSENGER_TABS, Divider,
} from './primitives'

export const SearchRide = () => (
  <Screen title="SEARCH" tabs={PASSENGER_TABS} active={0} id="PSG-01">
    <div className="text-center py-2">
      <div className="font-mono font-bold" style={{ fontSize: 12 }}>Find Your Ride</div>
      <div className="font-mono text-gray-400" style={{ fontSize: 9 }}>Book intercity seats instantly</div>
    </div>
    <div className="border-2 border-gray-300 p-3 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="font-mono text-gray-400 shrink-0" style={{ fontSize: 10 }}>FROM</div>
        <div className="flex-1 border-b border-gray-400 pb-0.5 font-mono text-gray-700" style={{ fontSize: 10 }}>Lagos, Nigeria</div>
        <div className="font-mono text-gray-400 text-lg shrink-0">⇅</div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="font-mono text-gray-400 shrink-0" style={{ fontSize: 10 }}>TO</div>
        <div className="flex-1 border-b border-gray-400 pb-0.5 font-mono text-gray-400" style={{ fontSize: 10 }}>Select destination...</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="font-mono text-gray-400 shrink-0" style={{ fontSize: 10 }}>DATE</div>
        <div className="flex-1 border-b border-gray-400 pb-0.5 font-mono text-gray-400" style={{ fontSize: 10 }}>Today, 13 Jan 2025</div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div>
        <div className="font-mono text-gray-500 mb-1" style={{ fontSize: 8 }}>PASSENGERS</div>
        <div className="border border-gray-400 flex justify-between px-2 py-1.5 font-mono" style={{ fontSize: 10 }}>
          <span>−</span><span>1</span><span>+</span>
        </div>
      </div>
      <div>
        <div className="font-mono text-gray-500 mb-1" style={{ fontSize: 8 }}>TIME (optional)</div>
        <div className="border border-gray-400 px-2 py-1.5 font-mono text-gray-500" style={{ fontSize: 10 }}>Any time ▾</div>
      </div>
    </div>
    <Btn label="SEARCH RIDES" />
    <SL title="Popular Routes Today" />
    {['Lagos → Abuja · 12 rides', 'Lagos → Port Harcourt · 8 rides', 'Abuja → Kano · 5 rides'].map(r => (
      <div key={r} className="border-b border-gray-100 py-2 flex justify-between font-mono" style={{ fontSize: 9 }}>
        <span className="text-gray-700">{r}</span>
        <span className="text-gray-400">›</span>
      </div>
    ))}
    <Note>Autocomplete cities. Calendar picker for date. Swipe to swap origin/destination.</Note>
  </Screen>
)

export const RideResults = () => (
  <Screen title="AVAILABLE RIDES" back tabs={PASSENGER_TABS} active={0} id="PSG-02">
    <div className="font-mono text-gray-500 mb-2" style={{ fontSize: 9 }}>
      Lagos → Abuja · 13 Jan · 1 passenger
    </div>
    <div className="flex gap-1 mb-3 overflow-x-auto">
      {['All (6)', 'Cheapest', 'Earliest', 'Highest Rated', 'AC'].map((f, i) => (
        <div key={f} className={`border px-2 py-1 font-mono shrink-0 ${i === 0 ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-500'}`} style={{ fontSize: 8 }}>
          {f}
        </div>
      ))}
    </div>
    {[
      { driver: 'Emeka O.', rating: 5, trips: 128, vehicle: 'Toyota Camry', seats: 3, time: '09:00', price: '₦6,500', ac: true },
      { driver: 'Chidi A.', rating: 4, trips: 87, vehicle: 'Honda Accord', seats: 1, time: '10:30', price: '₦5,800', ac: true },
      { driver: 'Ngozi K.', rating: 5, trips: 203, vehicle: 'Toyota Sienna', seats: 5, time: '11:00', price: '₦4,500', ac: false },
    ].map((r, i) => (
      <Card key={i}>
        <div className="flex gap-2 items-start">
          <Avatar size={36} label={r.driver.slice(0, 2).toUpperCase()} />
          <div className="flex-1">
            <div className="flex justify-between">
              <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>{r.driver}</div>
              <div className="font-mono font-bold text-gray-800" style={{ fontSize: 11 }}>{r.price}</div>
            </div>
            <div className="flex items-center gap-1">
              <Stars n={r.rating} />
              <span className="font-mono text-gray-400" style={{ fontSize: 8 }}>({r.trips})</span>
            </div>
            <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>{r.vehicle} · {r.seats} seats left</div>
            <div className="flex justify-between items-center mt-1">
              <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Departs {r.time}</div>
              <Btn label="SELECT" full={false} />
            </div>
          </div>
        </div>
        {r.ac && <Chip label="AC" />}
        <Chip label={`${r.seats} SEATS LEFT`} />
      </Card>
    ))}
  </Screen>
)

export const RideDetail = () => (
  <Screen title="RIDE DETAILS" back tabs={PASSENGER_TABS} active={0} id="PSG-03">
    <div className="flex gap-3 items-center py-2 border-b border-gray-200 mb-2">
      <Avatar size={48} label="EO" />
      <div className="flex-1">
        <div className="font-mono font-bold text-gray-800" style={{ fontSize: 12 }}>Emeka Okafor</div>
        <Stars n={5} />
        <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>128 trips · Verified Driver</div>
      </div>
      <div className="border border-gray-400 px-2 py-1 font-mono text-gray-600" style={{ fontSize: 9 }}>📞 CALL</div>
    </div>
    <Card>
      <Row label="Route" value="Lagos → Abuja" />
      <Row label="Departure" value="09:00 AM · 13 Jan" />
      <Row label="Duration (est.)" value="7 hours" />
      <Row label="Seats Available" value="3 of 4" />
      <Row label="Vehicle" value="Toyota Camry 2019" />
      <Row label="Plate" value="LOS 234 AA" border={false} />
    </Card>
    <SL title="Stops" />
    {['Lagos (departure)', 'Ibadan (pickup stop)', 'Ore (brief stop)', 'Abuja (arrival)'].map(s => (
      <div key={s} className="font-mono text-gray-600 py-1 border-b border-gray-100" style={{ fontSize: 9 }}>• {s}</div>
    ))}
    <SL title="Driver Reviews" />
    <Card>
      <div className="font-mono text-gray-600" style={{ fontSize: 9, lineHeight: 1.6 }}>
        "Very professional, punctual and safe driver." — Kemi A.
      </div>
      <div className="font-mono text-gray-400 mt-0.5" style={{ fontSize: 8 }}>Jan 10 · ★★★★★</div>
    </Card>
    <Divider />
    <div className="flex justify-between items-center mb-2">
      <div>
        <div className="font-mono font-bold text-gray-800" style={{ fontSize: 14 }}>₦ 6,500</div>
        <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>per seat</div>
      </div>
      <Btn label="BOOK NOW" full={false} />
    </div>
    <Note>KYC badge shown. Insurance included in price. Report driver option available.</Note>
  </Screen>
)

export const PassengerPayment = () => (
  <Screen title="CONFIRM BOOKING" back tabs={PASSENGER_TABS} active={1} id="PSG-04">
    <Card>
      <div className="font-mono font-bold text-gray-800 mb-1" style={{ fontSize: 11 }}>Booking Summary</div>
      <Row label="Lagos → Abuja" value="" />
      <Row label="13 Jan · 09:00 AM" value="" />
      <Row label="1 Passenger" value="" />
      <Row label="Driver: Emeka Okafor" value="" />
      <Divider />
      <Row label="Seat Price" value="₦ 6,500" />
      <Row label="Service Fee" value="₦ 200" />
      <Row label="TOTAL" value="₦ 6,700" border={false} />
    </Card>
    <SL title="Payment Method" />
    {[
      { label: 'Wallet', sub: '₦ 12,400 available', active: true },
      { label: 'Card ···· 4521', sub: 'Visa', active: false },
    ].map(m => (
      <div key={m.label} className={`border flex items-center gap-2 px-3 py-2 mb-2 ${m.active ? 'border-gray-800' : 'border-gray-300'}`}>
        <div className={`border rounded-full shrink-0 ${m.active ? 'border-gray-800 bg-gray-800' : 'border-gray-400'}`} style={{ width: 12, height: 12 }} />
        <div className="flex-1">
          <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>{m.label}</div>
          <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>{m.sub}</div>
        </div>
      </div>
    ))}
    <Btn label="PAY ₦ 6,700" />
    <div className="text-center font-mono text-gray-400" style={{ fontSize: 8 }}>🔒 Held in escrow until trip completion</div>
    <Note>Payment held until trip ends. Auto-release 2 hours after arrival.</Note>
  </Screen>
)

export const BoardingOTP = () => (
  <Screen title="BOARDING OTP" tabs={PASSENGER_TABS} active={1} id="PSG-05">
    <div className="text-center py-3">
      <div className="font-mono font-bold text-gray-800 mb-1" style={{ fontSize: 12 }}>Your Boarding Code</div>
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Show this to your driver before boarding</div>
    </div>
    <div className="border-2 border-gray-800 mx-4 py-5 text-center mb-3">
      <div className="font-mono font-bold text-gray-800" style={{ fontSize: 36, letterSpacing: 8 }}>4 8 2 1</div>
      <div className="font-mono text-gray-400 mt-1" style={{ fontSize: 8 }}>VALID FOR 30 MINUTES · SINGLE USE</div>
    </div>
    <Card>
      <Row label="Driver" value="Emeka Okafor" />
      <Row label="Vehicle" value="Toyota Camry · LOS 234 AA" />
      <Row label="Departs" value="09:00 AM · 13 Jan" border={false} />
    </Card>
    <SL title="Meeting Point" />
    <div className="font-mono text-gray-600 mb-2" style={{ fontSize: 9 }}>
      Oshodi Interchange, Under the bridge, Lagos · Bay 7
    </div>
    <MapArea height={80} label="PICKUP LOCATION MAP" />
    <Btn label="CALL DRIVER" variant="secondary" />
    <Note>OTP auto-expires. Tap to reveal if expired. Refresh generates new OTP with driver confirmation.</Note>
  </Screen>
)

export const LiveTracking = () => (
  <Screen title="LIVE TRACKING" tabs={PASSENGER_TABS} active={0} id="PSG-06">
    <MapArea height={220} label="LIVE VEHICLE TRACKING · REAL-TIME" />
    <Card>
      <div className="flex justify-between items-center">
        <div>
          <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>En Route to Abuja</div>
          <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Near Ore · 312 km remaining</div>
        </div>
        <Chip label="ON TIME" filled />
      </div>
      <Divider />
      <div className="flex justify-between font-mono" style={{ fontSize: 9 }}>
        <div className="text-center">
          <div className="font-bold text-gray-800">3h 21m</div>
          <div className="text-gray-400">ETA</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-gray-800">312 km</div>
          <div className="text-gray-400">Remaining</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-gray-800">92 km/h</div>
          <div className="text-gray-400">Speed</div>
        </div>
      </div>
    </Card>
    <div className="flex gap-2">
      <Btn label="📞 DRIVER" variant="secondary" />
      <Btn label="SHARE LIVE LOCATION" variant="secondary" />
      <Btn label="🚨 SOS" variant="danger" />
    </div>
    <Note>Share link with family. SOS → contacts emergency services + platform support.</Note>
  </Screen>
)

export const TripComplete = () => (
  <Screen title="TRIP COMPLETE" tabs={PASSENGER_TABS} active={1} id="PSG-07">
    <div className="flex flex-col items-center py-4">
      <div className="border-2 border-gray-800 rounded-full flex items-center justify-center mb-3" style={{ width: 52, height: 52, fontSize: 22 }}>
        ✓
      </div>
      <div className="font-mono font-bold text-gray-800 mb-1" style={{ fontSize: 12 }}>YOU'VE ARRIVED!</div>
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Abuja, Nigeria · 13 Jan · 4:28 PM</div>
    </div>
    <Card>
      <Row label="Trip Duration" value="7h 28m" />
      <Row label="Distance" value="682 km" />
      <Row label="Driver" value="Emeka Okafor" />
      <Row label="Amount Paid" value="₦ 6,700" border={false} />
    </Card>
    <SL title="Receipt sent to" />
    <div className="font-mono text-gray-500 mb-3" style={{ fontSize: 9 }}>chukwuemeka@email.com</div>
    <Btn label="RATE YOUR DRIVER" />
    <Btn label="BOOK RETURN TRIP" variant="secondary" />
    <Btn label="VIEW RECEIPT" variant="ghost" />
    <Note>Payment auto-released to driver. Receipt emailed. Rate within 24 hours.</Note>
  </Screen>
)

export const RateDriver = () => (
  <Screen title="RATE DRIVER" back tabs={PASSENGER_TABS} active={0} id="PSG-08">
    <div className="flex flex-col items-center py-3">
      <Avatar size={52} label="EO" />
      <div className="font-mono font-bold text-gray-800 mt-2 mb-1" style={{ fontSize: 12 }}>Emeka Okafor</div>
      <div className="font-mono text-gray-500 mb-3" style={{ fontSize: 9 }}>Lagos → Abuja · 13 Jan 2025</div>
      <div className="flex gap-2 mb-2">
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} className="text-gray-800" style={{ fontSize: 28 }}>{n <= 5 ? '★' : '☆'}</div>
        ))}
      </div>
      <div className="font-mono text-gray-500 mb-3" style={{ fontSize: 9 }}>Tap a star to rate</div>
    </div>
    <SL title="What went well?" />
    <div className="flex flex-wrap gap-1 mb-3">
      {['Punctual', 'Safe driving', 'Clean vehicle', 'Friendly', 'Comfortable', 'Good music', 'Professional'].map(t => (
        <div key={t} className="border border-gray-400 px-2 py-1 font-mono text-gray-600" style={{ fontSize: 8 }}>{t}</div>
      ))}
    </div>
    <div className="border border-gray-400 p-2 mb-3">
      <div className="font-mono text-gray-400 mb-1" style={{ fontSize: 8 }}>ADDITIONAL COMMENTS (optional)</div>
      <div className="font-mono text-gray-300" style={{ fontSize: 9, minHeight: 60 }}>Write your review here...</div>
    </div>
    <Btn label="SUBMIT RATING" />
    <Btn label="SKIP" variant="ghost" />
    <Note>Rating affects driver's profile score. Mandatory rating after 3 unrated trips.</Note>
  </Screen>
)

export const PassengerBookings = () => (
  <Screen title="MY BOOKINGS" tabs={PASSENGER_TABS} active={1} id="PSG-09">
    <div className="flex gap-1 mb-3">
      {['Upcoming', 'Completed', 'Cancelled'].map((f, i) => (
        <div key={f} className={`border px-2 py-1 font-mono shrink-0 ${i === 0 ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-500'}`} style={{ fontSize: 8 }}>
          {f}
        </div>
      ))}
    </div>
    {[
      { route: 'Lagos → Abuja', date: '13 Jan · 09:00', driver: 'Emeka O.', status: 'UPCOMING', price: '₦6,700' },
      { route: 'Abuja → Kano', date: '18 Jan · 07:30', driver: 'Rasheed M.', status: 'UPCOMING', price: '₦4,200' },
    ].map((b, i) => (
      <Card key={i}>
        <div className="flex justify-between items-start">
          <div>
            <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>{b.route}</div>
            <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>{b.date}</div>
            <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>Driver: {b.driver}</div>
          </div>
          <div className="text-right">
            <Chip label={b.status} />
            <div className="font-mono font-bold text-gray-700 mt-1" style={{ fontSize: 10 }}>{b.price}</div>
          </div>
        </div>
        <Divider />
        <div className="flex gap-2">
          <Btn label="VIEW OTP" full={false} />
          <Btn label="CANCEL" variant="danger" full={false} />
        </div>
      </Card>
    ))}
  </Screen>
)
