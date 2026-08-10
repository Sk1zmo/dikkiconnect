import {
  AdminScreen, Btn, Note, Chip, Row, Avatar, Divider,
  KpiCard, TableRow, MapArea, Progress, Stars, ImgBox,
} from './primitives'

const SearchBar = ({ placeholder }: { placeholder: string }) => (
  <div className="border border-gray-300 bg-white flex items-center px-2 py-1.5 mb-3">
    <span className="font-mono text-gray-400 mr-2" style={{ fontSize: 10 }}>🔍</span>
    <span className="font-mono text-gray-400 flex-1" style={{ fontSize: 9 }}>{placeholder}</span>
    <span className="font-mono text-gray-400 border-l border-gray-200 pl-2 ml-2" style={{ fontSize: 9 }}>FILTER ▾</span>
  </div>
)

export const AdminDashboard = () => (
  <AdminScreen active="Dashboard" title="Dashboard" sub="Live overview · 13 Jan 2025 · 14:30">
    <div className="flex gap-2 mb-4">
      <KpiCard label="Total Revenue (MTD)" value="₦4.2M" sub="+12% vs last month" />
      <KpiCard label="Active Trips" value="284" sub="Live now" />
      <KpiCard label="Parcels In Transit" value="1,840" sub="68 pending OTP" />
      <KpiCard label="Registered Users" value="42,300" sub="+840 this week" />
    </div>
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <div className="font-mono font-bold text-gray-700 mb-1" style={{ fontSize: 9 }}>LIVE VEHICLE TRACKING</div>
        <MapArea height={200} label="LIVE VEHICLES MAP · 284 ACTIVE" />
      </div>
      <div>
        <div className="font-mono font-bold text-gray-700 mb-1" style={{ fontSize: 9 }}>REVENUE (LAST 30 DAYS)</div>
        <div className="border border-dashed border-gray-400 bg-white flex items-end justify-around px-2" style={{ height: 200 }}>
          {[60, 40, 75, 55, 80, 70, 90, 65, 85, 72].map((h, i) => (
            <div key={i} className="bg-gray-700 w-4" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="border border-gray-300 bg-white p-3">
        <div className="font-mono font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>PENDING OTP ACTIONS</div>
        {['PG-1044 · Yaba Hub · Traveler', 'PG-1038 · Garki Hub · Receiver', 'PG-1051 · Ikeja Hub · Intake'].map(p => (
          <div key={p} className="border-b border-gray-100 py-1 font-mono text-gray-600" style={{ fontSize: 8 }}>{p}</div>
        ))}
      </div>
      <div className="border border-gray-300 bg-white p-3">
        <div className="font-mono font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>TOP ROUTES TODAY</div>
        {[['Lagos → Abuja', 84], ['Lagos → PH', 52], ['Abuja → Kano', 38]].map(([r, n]) => (
          <div key={r as string} className="mb-1">
            <div className="flex justify-between font-mono" style={{ fontSize: 8 }}>
              <span className="text-gray-600">{r}</span><span className="text-gray-800 font-bold">{n}</span>
            </div>
            <Progress value={Number(n)} />
          </div>
        ))}
      </div>
      <div className="border border-gray-300 bg-white p-3">
        <div className="font-mono font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>RECENT DISPUTES</div>
        {['DSP-084 · Lost Parcel · Open', 'DSP-083 · Overcharge · Resolved', 'DSP-082 · Late Delivery · Open'].map(d => (
          <div key={d} className="border-b border-gray-100 py-1 font-mono text-gray-600" style={{ fontSize: 8 }}>{d}</div>
        ))}
      </div>
    </div>
    <div className="border border-gray-300 bg-white">
      <div className="font-mono font-bold text-gray-700 px-3 py-2 border-b border-gray-200" style={{ fontSize: 9 }}>RECENT ACTIVITY</div>
      <TableRow cells={['TIME', 'EVENT', 'USER', 'ROUTE', 'STATUS']} header />
      {[
        ['14:28', 'Trip Completed', 'Emeka O.', 'LOS → ABJ', 'DONE'],
        ['14:15', 'Parcel Delivered', 'Yaba Hub', 'LOS → ABJ', 'DONE'],
        ['14:02', 'Dispute Filed', 'Kemi A.', '—', 'OPEN'],
        ['13:58', 'Payment Received', 'Chidi A.', 'LOS → PH', 'SETTLED'],
      ].map((row, i) => <TableRow key={i} cells={row} />)}
    </div>
    <Note>Auto-refresh every 30s. Click any row to drill down. Export data as CSV.</Note>
  </AdminScreen>
)

export const AdminUsers = () => (
  <AdminScreen active="Users" title="Users" sub="42,300 total · 840 new this week">
    <div className="flex justify-between items-center mb-3">
      <div className="flex gap-2">
        {['All Roles', 'Senders', 'Travelers', 'Passengers', 'Hub Managers'].map((f, i) => (
          <div key={f} className={`border px-2 py-1 font-mono ${i === 0 ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-500'}`} style={{ fontSize: 8 }}>
            {f}
          </div>
        ))}
      </div>
      <Btn label="EXPORT CSV" variant="secondary" full={false} />
    </div>
    <SearchBar placeholder="Search by name, phone, email, ID..." />
    <div className="border border-gray-300 bg-white">
      <TableRow cells={['USER', 'PHONE', 'ROLE', 'KYC', 'JOINED', 'STATUS', 'ACTION']} header />
      {[
        ['Amaka Okafor', '0800-000-0000', 'Sender', 'VERIFIED', '12 Jan 24', 'ACTIVE', ''],
        ['Emeka Okafor', '0801-000-0001', 'Traveler', 'VERIFIED', '5 Mar 24', 'ACTIVE', ''],
        ['Ngozi Kalu', '0802-000-0002', 'Passenger', 'PENDING', '1 Jan 25', 'ACTIVE', ''],
        ['Bola Ade', '0803-000-0003', 'Sender', 'REJECTED', '20 Dec 24', 'SUSPENDED', ''],
      ].map((row, i) => (
        <div key={i} className="flex border-b border-gray-200">
          {row.map((c, j) => (
            j < 6 ? (
              <div key={j} className="flex-1 px-2 py-2 font-mono truncate" style={{ fontSize: 9, color: '#374151' }}>
                {j === 3 ? <Chip label={c} filled={c === 'VERIFIED'} /> : c}
              </div>
            ) : (
              <div key={j} className="px-2 py-1 flex items-center gap-1 shrink-0">
                <div className="border border-gray-400 px-1 py-0.5 font-mono text-gray-600" style={{ fontSize: 8 }}>VIEW</div>
                <div className="border border-dashed border-gray-400 px-1 py-0.5 font-mono text-gray-500" style={{ fontSize: 8 }}>BAN</div>
              </div>
            )
          ))}
        </div>
      ))}
    </div>
    <Note>Click row to open user detail. Bulk actions: verify, suspend, export. Filters: status, KYC, date range.</Note>
  </AdminScreen>
)

export const AdminUserDetail = () => (
  <AdminScreen active="Users" title="User Detail" sub="Amaka Okafor · USR-00142">
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-1 border border-gray-300 bg-white p-3">
        <div className="flex flex-col items-center mb-3">
          <Avatar size={56} label="AO" />
          <div className="font-mono font-bold text-gray-800 mt-2" style={{ fontSize: 11 }}>Amaka Okafor</div>
          <Chip label="VERIFIED" filled />
        </div>
        <Row label="User ID" value="USR-00142" />
        <Row label="Phone" value="0800-000-0000" />
        <Row label="Email" value="amaka@email.com" />
        <Row label="Role" value="Sender" />
        <Row label="Joined" value="12 Jan 2024" />
        <Row label="Status" value="ACTIVE" border={false} />
        <Divider />
        <Btn label="SUSPEND USER" variant="danger" />
        <Btn label="SEND MESSAGE" variant="secondary" />
      </div>
      <div className="col-span-2 space-y-3">
        <div className="border border-gray-300 bg-white p-3">
          <div className="font-mono font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>KYC DOCUMENTS</div>
          <div className="grid grid-cols-2 gap-2">
            {['National ID', 'Proof of Address', 'Selfie'].map(d => (
              <div key={d} className="border border-gray-200 p-2">
                <ImgBox height={60} label={d} />
                <div className="font-mono text-gray-500 text-center" style={{ fontSize: 8 }}>{d} · APPROVED</div>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-gray-300 bg-white p-3">
          <div className="font-mono font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>SHIPMENT HISTORY (42 total)</div>
          <TableRow cells={['ORDER', 'ROUTE', 'DATE', 'AMOUNT', 'STATUS']} header />
          {[
            ['PG-1043', 'LOS → ABJ', '12 Jan', '₦3,700', 'IN TRANSIT'],
            ['PG-1038', 'LOS → PH', '10 Jan', '₦2,200', 'DELIVERED'],
          ].map((r, i) => <TableRow key={i} cells={r} />)}
        </div>
        <div className="border border-gray-300 bg-white p-3">
          <div className="font-mono font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>WALLET ACTIVITY</div>
          <Row label="Current Balance" value="₦ 12,400" />
          <Row label="Total Spent (2024)" value="₦ 84,300" border={false} />
        </div>
      </div>
    </div>
  </AdminScreen>
)

export const AdminDrivers = () => (
  <AdminScreen active="Drivers" title="Drivers" sub="3,240 total · 284 active now">
    <div className="flex gap-2 mb-3">
      {['All', 'Active', 'Pending KYC', 'Suspended'].map((f, i) => (
        <div key={f} className={`border px-2 py-1 font-mono ${i === 0 ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-500'}`} style={{ fontSize: 8 }}>
          {f}
        </div>
      ))}
      <div className="ml-auto"><Btn label="ADD DRIVER" full={false} /></div>
    </div>
    <SearchBar placeholder="Search by name, vehicle, plate number..." />
    <div className="border border-gray-300 bg-white">
      <TableRow cells={['DRIVER', 'VEHICLE', 'TRIPS', 'RATING', 'EARNINGS MTD', 'KYC', 'STATUS']} header />
      {[
        ['Emeka Okafor', 'Camry · LOS234AA', '128', '★ 4.9', '₦84,200', 'VERIFIED', 'ACTIVE'],
        ['Chidi Aro', 'Accord · ABJ112KK', '87', '★ 4.7', '₦62,400', 'VERIFIED', 'ACTIVE'],
        ['Rasheed M.', 'Sienna · KN041AB', '203', '★ 5.0', '₦112,000', 'VERIFIED', 'ACTIVE'],
        ['Yemi Bello', 'Corolla · LOS089CC', '12', '★ 3.8', '₦8,400', 'PENDING', 'INACTIVE'],
      ].map((row, i) => <TableRow key={i} cells={row} />)}
    </div>
    <Note>Click driver to view full profile, documents, trips, and wallet.</Note>
  </AdminScreen>
)

export const AdminDriverDetail = () => (
  <AdminScreen active="Drivers" title="Driver Detail" sub="Emeka Okafor · DRV-00284">
    <div className="grid grid-cols-3 gap-4">
      <div className="border border-gray-300 bg-white p-3">
        <div className="flex flex-col items-center mb-3">
          <Avatar size={52} label="EO" />
          <div className="font-mono font-bold text-gray-800 mt-2" style={{ fontSize: 11 }}>Emeka Okafor</div>
          <Stars n={5} />
          <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>128 trips · DRV-00284</div>
        </div>
        <Row label="Vehicle" value="Toyota Camry" />
        <Row label="Plate" value="LOS 234 AA" />
        <Row label="Year" value="2019" />
        <Row label="Insurance" value="Valid · Dec 2025" />
        <Row label="Earnings MTD" value="₦ 84,200" border={false} />
        <Divider />
        <Btn label="APPROVE KYC" />
        <Btn label="SUSPEND DRIVER" variant="danger" />
      </div>
      <div className="col-span-2 space-y-3">
        <div className="border border-gray-300 bg-white p-3">
          <div className="font-mono font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>VEHICLE DOCUMENTS</div>
          <div className="grid grid-cols-3 gap-2">
            {["Driver's License", 'Vehicle Insurance', 'Roadworthiness', 'Vehicle Photo'].map(d => (
              <div key={d}>
                <ImgBox height={60} label={d} />
                <div className="font-mono text-gray-500 text-center" style={{ fontSize: 7 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-gray-300 bg-white p-3">
          <div className="font-mono font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>TRIP HISTORY</div>
          <TableRow cells={['TRIP ID', 'ROUTE', 'DATE', 'PARCELS', 'PASSENGERS', 'EARNINGS']} header />
          {[
            ['TRP-0892', 'LOS → ABJ', '13 Jan', '4', '3', '₦ 8,240'],
            ['TRP-0884', 'LOS → PH', '11 Jan', '2', '4', '₦ 7,600'],
          ].map((r, i) => <TableRow key={i} cells={r} />)}
        </div>
      </div>
    </div>
  </AdminScreen>
)

export const AdminTrips = () => (
  <AdminScreen active="Trips" title="Trips" sub="18,420 total · 284 active now">
    <div className="flex gap-2 mb-3">
      {['All', 'Active', 'Completed', 'Cancelled'].map((f, i) => (
        <div key={f} className={`border px-2 py-1 font-mono ${i === 0 ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-500'}`} style={{ fontSize: 8 }}>
          {f}
        </div>
      ))}
    </div>
    <div className="grid grid-cols-2 gap-3 mb-3">
      <div>
        <MapArea height={180} label="LIVE TRIPS MAP · 284 ACTIVE" />
      </div>
      <div className="border border-gray-300 bg-white p-3">
        <div className="font-mono font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>ACTIVE TRIPS BY ROUTE</div>
        {[['Lagos → Abuja', 84], ['Lagos → PH', 52], ['Abuja → Kano', 38], ['Lagos → Ibadan', 28]].map(([r, n]) => (
          <div key={r as string} className="mb-1.5">
            <div className="flex justify-between font-mono mb-0.5" style={{ fontSize: 8 }}>
              <span className="text-gray-600">{r}</span><span className="font-bold">{n}</span>
            </div>
            <Progress value={Number(n)} />
          </div>
        ))}
      </div>
    </div>
    <SearchBar placeholder="Search by driver, route, trip ID..." />
    <div className="border border-gray-300 bg-white">
      <TableRow cells={['TRIP ID', 'DRIVER', 'ROUTE', 'DEPARTURE', 'PARCELS', 'SEATS', 'STATUS']} header />
      {[
        ['TRP-0892', 'Emeka O.', 'LOS → ABJ', '13 Jan 09:00', '4', '3/4', 'ACTIVE'],
        ['TRP-0890', 'Chidi A.', 'LOS → PH', '13 Jan 07:30', '2', '4/4', 'ACTIVE'],
        ['TRP-0888', 'Rasheed M.', 'ABJ → KAN', '12 Jan 06:00', '1', '2/6', 'COMPLETED'],
      ].map((row, i) => <TableRow key={i} cells={row} />)}
    </div>
  </AdminScreen>
)

export const AdminParcels = () => (
  <AdminScreen active="Parcels" title="Parcels" sub="84,200 total · 1,840 in transit">
    <div className="flex gap-2 mb-3">
      {['All', 'Booked', 'At Hub', 'In Transit', 'Delivered', 'Disputed'].map((f, i) => (
        <div key={f} className={`border px-2 py-1 font-mono ${i === 2 ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-500'}`} style={{ fontSize: 8 }}>
          {f}
        </div>
      ))}
    </div>
    <SearchBar placeholder="Search by order ID, sender, recipient..." />
    <div className="border border-gray-300 bg-white">
      <TableRow cells={['ORDER', 'SENDER', 'ROUTE', 'WEIGHT', 'VALUE', 'TRAVELER', 'STATUS']} header />
      {[
        ['PG-1044', 'Amaka O.', 'LOS → ABJ', '2.5kg', '₦85k', 'Emeka O.', 'IN TRANSIT'],
        ['PG-1045', 'Kemi A.', 'LOS → PH', '1kg', '₦5k', 'Ngozi K.', 'IN TRANSIT'],
        ['PG-1038', 'Tunde M.', 'LOS → PH', '4kg', '₦20k', 'Chidi A.', 'AT HUB'],
      ].map((row, i) => <TableRow key={i} cells={row} />)}
    </div>
    <Note>Click order to view full tracking timeline, photos, OTP history.</Note>
  </AdminScreen>
)

export const AdminParcelTimeline = () => (
  <AdminScreen active="Parcels" title="Parcel Timeline" sub="Order PG-1044 · Detailed Audit Trail">
    <div className="grid grid-cols-3 gap-4">
      <div className="border border-gray-300 bg-white p-3">
        <Row label="Order" value="PG-1044" />
        <Row label="Route" value="LOS → ABJ" />
        <Row label="Sender" value="Amaka Okafor" />
        <Row label="Recipient" value="John Doe" />
        <Row label="Weight" value="2.5 kg" />
        <Row label="Declared" value="₦ 85,000" />
        <Row label="Status" value="IN TRANSIT" border={false} />
      </div>
      <div className="col-span-2 border border-gray-300 bg-white p-3">
        <div className="font-mono font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>FULL TRACKING TIMELINE</div>
        {[
          { action: 'Booking Created', by: 'Amaka Okafor', time: '12 Jan · 10:22 AM', otp: '—', status: 'DONE' },
          { action: 'Dropped at Yaba Hub', by: 'Hub Manager: Ayo', time: '12 Jan · 14:14 PM', otp: 'OTP: 7241', status: 'DONE' },
          { action: 'Picked by Traveler', by: 'Emeka Okafor', time: '13 Jan · 08:05 AM', otp: 'OTP: 4821', status: 'DONE' },
          { action: 'In Transit', by: 'Emeka Okafor', time: '13 Jan · 08:30 AM', otp: '—', status: 'ACTIVE' },
          { action: 'Arrived Destination Hub', by: 'Pending', time: '—', otp: '—', status: 'PENDING' },
          { action: 'Collected by Recipient', by: 'Pending', time: '—', otp: '—', status: 'PENDING' },
        ].map((step, i) => (
          <div key={i} className="border-b border-gray-100 py-2 flex gap-3 font-mono" style={{ fontSize: 9 }}>
            <div className={`border shrink-0 flex items-center justify-center` } style={{ width: 16, height: 16, fontSize: 7, background: step.status === 'DONE' ? '#1f2937' : '#fff', borderColor: '#9ca3af', color: step.status === 'DONE' ? '#fff' : '#9ca3af' }}>
              {step.status === 'DONE' ? '✓' : step.status === 'ACTIVE' ? '●' : '○'}
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-800">{step.action}</div>
              <div className="text-gray-400">{step.by} · {step.time} · {step.otp}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </AdminScreen>
)

export const AdminPayments = () => (
  <AdminScreen active="Payments" title="Payments & Settlement" sub="₦ 42.8M processed this month">
    <div className="flex gap-2 mb-4">
      <KpiCard label="Gross Revenue (MTD)" value="₦42.8M" />
      <KpiCard label="Platform Fee (10%)" value="₦4.28M" />
      <KpiCard label="Pending Settlement" value="₦8.4M" />
      <KpiCard label="Failed Transactions" value="24" sub="This week" />
    </div>
    <div className="grid grid-cols-2 gap-3 mb-3">
      <div className="border border-gray-300 bg-white p-3">
        <div className="font-mono font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>SETTLEMENT QUEUE</div>
        <TableRow cells={['TRAVELER', 'TRIPS', 'AMOUNT', 'STATUS']} header />
        {[['Emeka O.', '12', '₦84,200', 'PENDING'], ['Ngozi K.', '8', '₦42,100', 'PROCESSING']].map((r, i) => <TableRow key={i} cells={r} />)}
      </div>
      <div className="border border-gray-300 bg-white p-3">
        <div className="font-mono font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>FAILED TRANSACTIONS</div>
        <TableRow cells={['ORDER', 'USER', 'AMOUNT', 'REASON']} header />
        {[['PG-1046', 'Bola A.', '₦3,200', 'Insufficient'],['PG-1042', 'Tunde K.', '₦6,700', 'Card Declined']].map((r, i) => <TableRow key={i} cells={r} />)}
      </div>
    </div>
    <div className="border border-gray-300 bg-white">
      <div className="font-mono font-bold text-gray-700 px-3 py-2 border-b border-gray-200" style={{ fontSize: 9 }}>ALL TRANSACTIONS</div>
      <TableRow cells={['TXN ID', 'TYPE', 'USER', 'AMOUNT', 'GATEWAY', 'DATE', 'STATUS']} header />
      {[
        ['TXN-8842', 'Booking', 'Amaka O.', '₦3,700', 'Paystack', '12 Jan', 'SUCCESS'],
        ['TXN-8841', 'Booking', 'Kemi A.', '₦6,700', 'Wallet', '12 Jan', 'SUCCESS'],
        ['TXN-8840', 'Withdrawal', 'Emeka O.', '₦20,000', 'Bank', '11 Jan', 'SETTLED'],
      ].map((r, i) => <TableRow key={i} cells={r} />)}
    </div>
  </AdminScreen>
)

export const AdminDisputes = () => (
  <AdminScreen active="Disputes" title="Disputes" sub="142 total · 8 open · 3 escalated">
    <div className="flex gap-2 mb-3">
      {['Open (8)', 'Escalated (3)', 'Resolved (131)'].map((f, i) => (
        <div key={f} className={`border px-2 py-1 font-mono ${i === 0 ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-500'}`} style={{ fontSize: 8 }}>
          {f}
        </div>
      ))}
    </div>
    <div className="border border-gray-300 bg-white">
      <TableRow cells={['DISPUTE ID', 'TYPE', 'FILED BY', 'ORDER', 'DATE', 'PRIORITY', 'STATUS']} header />
      {[
        ['DSP-084', 'Lost Parcel', 'Amaka O.', 'PG-1022', '10 Jan', 'HIGH', 'OPEN'],
        ['DSP-083', 'Overcharge', 'Kemi A.', 'PG-1018', '8 Jan', 'MED', 'OPEN'],
        ['DSP-082', 'Late Delivery', 'Bola A.', 'PG-1014', '5 Jan', 'LOW', 'RESOLVED'],
      ].map((row, i) => <TableRow key={i} cells={row} />)}
    </div>
    <Note>Click dispute to open resolution panel. Assign to support agent. Attach evidence. Issue refund.</Note>
  </AdminScreen>
)

export const AdminAnalytics = () => (
  <AdminScreen active="Analytics" title="Analytics" sub="Performance insights · Last 30 days">
    <div className="flex gap-2 mb-1" style={{ fontSize: 8 }}>
      {['7 Days', '30 Days', '90 Days', 'Custom'].map((f, i) => (
        <div key={f} className={`border px-2 py-1 font-mono ${i === 1 ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-500'}`}>{f}</div>
      ))}
    </div>
    <div className="grid grid-cols-2 gap-3 mt-3">
      {[
        'Revenue by City',
        'Trip Density Heatmap',
        'Parcel Volume (Daily)',
        'Driver Growth',
        'Hub Performance',
        'Payment Methods Split',
      ].map(chart => (
        <div key={chart} className="border border-dashed border-gray-400 bg-white" style={{ height: 140 }}>
          <div className="font-mono text-gray-500 px-2 py-1 border-b border-gray-200" style={{ fontSize: 8 }}>{chart}</div>
          <div className="flex items-end justify-around px-2 pb-2" style={{ height: 100 }}>
            {[55, 70, 45, 80, 65, 90, 72, 58, 84, 76].map((h, i) => (
              <div key={i} className="bg-gray-600 w-3" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
    <Note>Click chart to drill down. Export as PNG/CSV. Schedule report to email.</Note>
  </AdminScreen>
)

export const AdminSettings = () => (
  <AdminScreen active="Settings" title="Settings" sub="Platform configuration">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="border border-gray-300 bg-white p-3">
          <div className="font-mono font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>PLATFORM FEES</div>
          <Row label="Sender Commission" value="8%" />
          <Row label="Traveler Commission" value="10%" />
          <Row label="Hub Manager Share" value="5%" border={false} />
          <Btn label="UPDATE FEES" variant="secondary" />
        </div>
        <div className="border border-gray-300 bg-white p-3">
          <div className="font-mono font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>VERIFICATION SETTINGS</div>
          <Row label="KYC Required" value="YES" />
          <Row label="Driver Documents" value="5 required" />
          <Row label="Auto-approve" value="OFF" border={false} />
        </div>
      </div>
      <div className="space-y-3">
        <div className="border border-gray-300 bg-white p-3">
          <div className="font-mono font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>NOTIFICATION TEMPLATES</div>
          {['OTP SMS', 'Booking Confirmation', 'Delivery Alert', 'Payment Receipt'].map(t => (
            <div key={t} className="flex justify-between py-1.5 border-b border-gray-100 font-mono" style={{ fontSize: 9 }}>
              <span className="text-gray-600">{t}</span>
              <span className="text-gray-400 underline">EDIT</span>
            </div>
          ))}
        </div>
        <div className="border border-gray-300 bg-white p-3">
          <div className="font-mono font-bold text-gray-700 mb-2" style={{ fontSize: 9 }}>ADMIN TEAM</div>
          {['Super Admin · Ola A.', 'Support Agent · Zara K.', 'Finance · Bayo M.'].map(a => (
            <div key={a} className="py-1.5 border-b border-gray-100 font-mono text-gray-600" style={{ fontSize: 9 }}>{a}</div>
          ))}
          <Btn label="ADD ADMIN" variant="secondary" />
        </div>
      </div>
    </div>
  </AdminScreen>
)
