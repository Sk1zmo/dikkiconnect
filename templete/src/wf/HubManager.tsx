import {
  Screen, Btn, SL, Note, Card, Chip, Row, Avatar, HUB_TABS, Divider,
  ScannerFrame, OTPInput, CameraFrame, KpiCard, ImgBox, Progress, TableRow,
} from './primitives'

export const HubDashboard = () => (
  <Screen title="DASHBOARD" tabs={HUB_TABS} active={0} actions="🔔" id="HUB-01">
    <div className="font-mono text-gray-500 mb-2" style={{ fontSize: 9 }}>Yaba Hub, Lagos · Mon 13 Jan 2025</div>
    <div className="flex gap-2 mb-3 overflow-x-auto">
      <KpiCard label="Incoming Today" value="12" sub="+3 since 8am" />
      <KpiCard label="Outgoing Today" value="8" sub="2 pending" />
      <KpiCard label="Held Inventory" value="34" sub="3 delayed" />
      <KpiCard label="Revenue" value="₦24k" sub="Today" />
    </div>
    <SL title="Urgent Actions" />
    {[
      { label: 'Traveler pickup waiting · PG-1044', action: 'Generate OTP' },
      { label: 'Receiver arrived for PG-1038', action: 'Release Parcel' },
    ].map(a => (
      <Card key={a.label}>
        <div className="flex justify-between items-center">
          <div className="font-mono text-gray-700 flex-1 pr-2" style={{ fontSize: 9 }}>{a.label}</div>
          <Btn label={a.action} full={false} />
        </div>
      </Card>
    ))}
    <SL title="Incoming (Next 2 Hours)" />
    {[
      { id: 'PG-1049', sender: 'Kemi O.', weight: '1.5kg', eta: '11:30 AM' },
      { id: 'PG-1050', sender: 'Tunde A.', weight: '3kg', eta: '12:00 PM' },
    ].map(p => (
      <div key={p.id} className="flex justify-between py-2 border-b border-gray-200 font-mono" style={{ fontSize: 9 }}>
        <span className="font-bold text-gray-800">{p.id}</span>
        <span className="text-gray-500">{p.sender}</span>
        <span className="text-gray-500">{p.weight}</span>
        <span className="text-gray-600 font-bold">ETA {p.eta}</span>
      </div>
    ))}
    <SL title="Today's Activity" />
    <Progress value={65} label="Hub Capacity: 34/52 slots" />
    <Note>Urgent items highlighted. Hub capacity triggers alert at 90%.</Note>
  </Screen>
)

export const ParcelIntakeScan = () => (
  <Screen title="PARCEL INTAKE" back tabs={HUB_TABS} active={2} id="HUB-02">
    <div className="text-center py-2">
      <div className="font-mono font-bold" style={{ fontSize: 11 }}>Scan Parcel QR Code</div>
      <div className="font-mono text-gray-400" style={{ fontSize: 9 }}>Sender presents QR at drop-off</div>
    </div>
    <ScannerFrame />
    <div className="text-center font-mono text-gray-500 mb-3" style={{ fontSize: 9 }}>
      OR search by Order ID
    </div>
    <div className="border border-gray-400 flex mb-3">
      <input
        className="flex-1 px-2 py-2 font-mono outline-none text-gray-600"
        style={{ fontSize: 10 }}
        placeholder="PG - 1044"
        readOnly
      />
      <div className="border-l border-gray-300 px-3 py-2 font-mono text-gray-500 bg-gray-50" style={{ fontSize: 9 }}>SEARCH</div>
    </div>
    <SL title="Recent Intakes Today" />
    {['PG-1042 · Kemi O. · 10:22 AM', 'PG-1040 · Rasheed M. · 9:45 AM'].map(r => (
      <div key={r} className="border-b border-gray-200 py-2 font-mono text-gray-500" style={{ fontSize: 9 }}>{r}</div>
    ))}
    <Note>QR scan links order. If no QR, manual entry with sender ID verification required.</Note>
  </Screen>
)

export const ParcelIntakeDetails = () => (
  <Screen title="CONFIRM INTAKE" back tabs={HUB_TABS} active={2} id="HUB-03">
    <div className="border-2 border-gray-800 py-2 text-center mb-3">
      <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>PARCEL FOUND · PG-1044</div>
    </div>
    <Card>
      <Row label="Sender" value="Amaka Okafor" />
      <Row label="Recipient" value="John Doe, Abuja" />
      <Row label="Category" value="Electronics" />
      <Row label="Declared Weight" value="2.5 kg" />
      <Row label="Declared Value" value="₦ 85,000" />
      <Row label="Fragile" value="YES ⚠" border={false} />
    </Card>
    <SL title="Physical Verification" />
    <div className="border border-gray-400 px-2 py-1.5 flex mb-2">
      <span className="font-mono text-gray-500 flex-1" style={{ fontSize: 9 }}>Actual Weight (kg)</span>
      <span className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>2.6 kg</span>
    </div>
    <SL title="Parcel Photos (required)" />
    <div className="grid grid-cols-3 gap-1 mb-2">
      {['FRONT', 'SIDE', 'TOP'].map(v => (
        <ImgBox key={v} height={70} label={v} />
      ))}
    </div>
    <Btn label="CAPTURE PHOTOS" variant="secondary" />
    <SL title="OTP to Sender" />
    <div className="border-2 border-gray-800 py-3 text-center mb-3">
      <div className="font-mono font-bold text-gray-300 mb-1" style={{ fontSize: 9 }}>CONFIRM INTAKE OTP</div>
      <div className="font-mono font-bold text-gray-800" style={{ fontSize: 32, letterSpacing: 6 }}>7 2 4 1</div>
    </div>
    <div className="font-mono text-gray-500 text-center mb-3" style={{ fontSize: 9 }}>
      Share this OTP with sender to confirm receipt
    </div>
    <Btn label="CONFIRM INTAKE" />
    <Note>Weight discrepancy over 10% flags order. Photo upload mandatory for fragile items.</Note>
  </Screen>
)

export const ParcelIntakeCamera = () => (
  <Screen title="CAPTURE PHOTOS" back tabs={HUB_TABS} active={2} id="HUB-04">
    <div className="font-mono text-gray-500 mb-2 text-center" style={{ fontSize: 9 }}>
      Parcel PG-1044 · Photo 1 of 3: FRONT
    </div>
    <CameraFrame label="ALIGN PARCEL IN FRAME · FRONT VIEW" />
    <div className="flex justify-between mb-3 font-mono" style={{ fontSize: 8 }}>
      <div className="border border-gray-400 px-2 py-1 text-gray-500">FLASH: AUTO</div>
      <div className="border-2 border-gray-800 px-4 py-1 text-gray-800 font-bold">📷 CAPTURE</div>
      <div className="border border-gray-400 px-2 py-1 text-gray-500">GRID: ON</div>
    </div>
    <SL title="Captured Photos" />
    <div className="grid grid-cols-3 gap-1">
      <div className="relative">
        <ImgBox height={70} label="FRONT ✓" />
        <div className="absolute top-0 right-0 bg-gray-800 text-white font-mono" style={{ fontSize: 7, padding: '1px 3px' }}>✓</div>
      </div>
      <ImgBox height={70} label="SIDE" />
      <ImgBox height={70} label="TOP" />
    </div>
    <Btn label="NEXT PHOTO (SIDE)" />
    <Note>3 photos mandatory. Retake available. Auto-save to order record.</Note>
  </Screen>
)

export const Inventory = () => (
  <Screen title="INVENTORY" tabs={HUB_TABS} active={1} id="HUB-05">
    <div className="border border-gray-300 flex items-center px-2 py-1.5 mb-2">
      <span className="font-mono text-gray-400" style={{ fontSize: 9 }}>🔍 Search by Order ID, sender, recipient...</span>
    </div>
    <div className="flex gap-1 mb-3 overflow-x-auto">
      {[
        { label: 'All (34)', active: true },
        { label: 'Waiting (21)', active: false },
        { label: 'Assigned (10)', active: false },
        { label: 'Delayed (3)', active: false },
        { label: 'Lost (0)', active: false },
      ].map(f => (
        <div key={f.label} className={`border px-2 py-1 font-mono shrink-0 ${f.active ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-500'}`} style={{ fontSize: 8 }}>
          {f.label}
        </div>
      ))}
    </div>
    {[
      { id: 'PG-1044', dest: 'Abuja', sender: 'Amaka O.', weight: '2.5kg', status: 'WAITING', days: '0d' },
      { id: 'PG-1038', dest: 'Port Harcourt', sender: 'Kemi O.', weight: '4kg', status: 'ASSIGNED', days: '1d' },
      { id: 'PG-1035', dest: 'Kano', sender: 'Bola A.', weight: '1kg', status: 'DELAYED', days: '3d' },
      { id: 'PG-1030', dest: 'Abuja', sender: 'Tunde M.', weight: '6kg', status: 'WAITING', days: '0d' },
    ].map(p => (
      <Card key={p.id}>
        <div className="flex justify-between items-start">
          <div>
            <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>{p.id}</div>
            <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>→ {p.dest} · {p.weight}</div>
            <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>From: {p.sender} · {p.days} ago</div>
          </div>
          <Chip label={p.status} filled={p.status === 'ASSIGNED'} />
        </div>
      </Card>
    ))}
    <Note>Delayed parcels (over 72h at hub) trigger automatic escalation to admin.</Note>
  </Screen>
)

export const TravelerPickupOTP = () => (
  <Screen title="TRAVELER PICKUP" back tabs={HUB_TABS} active={2} id="HUB-06">
    <div className="border-2 border-gray-800 p-2 text-center mb-3">
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>TRAVELER ARRIVED FOR PICKUP</div>
      <div className="font-mono font-bold text-gray-800 mt-1" style={{ fontSize: 10 }}>Parcel: PG-1044 · Emeka Okafor</div>
    </div>
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Avatar size={36} label="EO" />
        <div>
          <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>Emeka Okafor</div>
          <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>Toyota Camry · LOS 234 AA</div>
          <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>Verified Traveler ✓</div>
        </div>
      </div>
      <Row label="Parcel" value="PG-1044" />
      <Row label="Destination" value="Abuja (Garki Hub)" border={false} />
    </Card>
    <SL title="Verify Traveler ID" />
    <div className="border border-dashed border-gray-400 py-2 text-center font-mono text-gray-500 mb-3" style={{ fontSize: 9 }}>
      📷 SCAN TRAVELER FACE / ID
    </div>
    <SL title="Generate Release OTP" />
    <div className="font-mono text-gray-500 mb-3" style={{ fontSize: 9, lineHeight: 1.6 }}>
      Tap button to generate a 4-digit OTP. Share verbally with the traveler. Traveler enters OTP in their app to confirm pickup.
    </div>
    <Btn label="GENERATE OTP" />
    <div className="border-2 border-gray-800 py-4 text-center mb-3">
      <div className="font-mono text-gray-300" style={{ fontSize: 9 }}>OTP WILL APPEAR HERE</div>
      <div className="font-mono font-bold text-gray-800 mt-1" style={{ fontSize: 36, letterSpacing: 8 }}>_ _ _ _</div>
      <div className="font-mono text-gray-400 mt-1" style={{ fontSize: 8 }}>Valid for 10 minutes</div>
    </div>
    <Note>OTP generated server-side. Hub manager never sees traveler OTP entry. Audit logged.</Note>
  </Screen>
)

export const TravelerPickupRelease = () => (
  <Screen title="RELEASE PARCEL" tabs={HUB_TABS} active={2} id="HUB-07">
    <div className="flex flex-col items-center py-4">
      <div className="border-2 border-gray-800 rounded-full flex items-center justify-center mb-2" style={{ width: 52, height: 52, fontSize: 22 }}>✓</div>
      <div className="font-mono font-bold text-gray-800 mb-1" style={{ fontSize: 12 }}>OTP VERIFIED!</div>
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Parcel PG-1044 is cleared for release</div>
    </div>
    <Card>
      <Row label="Traveler" value="Emeka Okafor" />
      <Row label="Destination" value="Garki Hub, Abuja" />
      <Row label="Expected Delivery" value="14 Jan 2025" />
      <Row label="Reward to Traveler" value="₦ 1,200" border={false} />
    </Card>
    <ImgBox height={60} label="HANDOVER PHOTO (capture now)" />
    <Btn label="CAPTURE HANDOVER PHOTO" variant="secondary" />
    <Btn label="CONFIRM RELEASE" />
    <Note>Handover photo optional but recommended. Status updates to "Picked by Traveler".</Note>
  </Screen>
)

export const ReceiverPickupOTP = () => (
  <Screen title="RECEIVER PICKUP" back tabs={HUB_TABS} active={2} id="HUB-08">
    <div className="border-2 border-gray-800 p-2 text-center mb-3">
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>RECEIVER ARRIVED FOR COLLECTION</div>
      <div className="font-mono font-bold text-gray-800 mt-1" style={{ fontSize: 10 }}>Parcel: PG-1038 · John Doe</div>
    </div>
    <SL title="Verify Receiver Identity" />
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div>
        <div className="font-mono text-gray-500 mb-1" style={{ fontSize: 8 }}>GOVERNMENT ID</div>
        <ImgBox height={60} label="CAPTURE ID" />
      </div>
      <div>
        <div className="font-mono text-gray-500 mb-1" style={{ fontSize: 8 }}>FACE MATCH</div>
        <ImgBox height={60} label="CAPTURE FACE" />
      </div>
    </div>
    <SL title="Receiver Enters OTP" />
    <div className="font-mono text-gray-500 mb-1" style={{ fontSize: 9 }}>
      Receiver should have received OTP via SMS when parcel arrived at hub.
    </div>
    <OTPInput digits={6} />
    <Btn label="VERIFY & DELIVER" />
    <Btn label="RECEIVER HAS NO OTP" variant="secondary" />
    <Note>No OTP: resend to registered phone. Manual override requires admin approval.</Note>
  </Screen>
)

export const Delivered = () => (
  <Screen title="DELIVERED" tabs={HUB_TABS} active={2} id="HUB-09">
    <div className="flex flex-col items-center py-4">
      <div className="border-2 border-gray-800 rounded-full flex items-center justify-center mb-2" style={{ width: 52, height: 52, fontSize: 22 }}>✓</div>
      <div className="font-mono font-bold text-gray-800 mb-1" style={{ fontSize: 12 }}>DELIVERED!</div>
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Parcel PG-1038 collected by John Doe</div>
    </div>
    <Card>
      <Row label="Order" value="PG-1038" />
      <Row label="Collected by" value="John Doe" />
      <Row label="Verified via" value="OTP + Face ID" />
      <Row label="Timestamp" value="13 Jan · 14:32" border={false} />
    </Card>
    <ImgBox height={70} label="RECEIVER SIGNATURE / PHOTO (captured)" />
    <Btn label="BACK TO INVENTORY" variant="secondary" />
    <Btn label="NEXT PARCEL" />
    <Note>Sender, traveler, and recipient all notified. Settlement triggered.</Note>
  </Screen>
)

export const HubHistory = () => (
  <Screen title="HISTORY" tabs={HUB_TABS} active={3} id="HUB-10">
    <div className="flex gap-1 mb-2">
      {['Today', 'This Week', 'This Month', 'Custom'].map((f, i) => (
        <div key={f} className={`border px-2 py-1 font-mono ${i === 0 ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-500'}`} style={{ fontSize: 8 }}>
          {f}
        </div>
      ))}
    </div>
    <div className="flex gap-2 mb-3">
      <KpiCard label="Intake" value="12" />
      <KpiCard label="Released" value="8" />
      <KpiCard label="Delivered" value="6" />
      <KpiCard label="Revenue" value="₦24k" />
    </div>
    <SL title="Transaction Log" />
    <TableRow cells={['ORDER', 'ACTION', 'TIME', 'STATUS']} header />
    {[
      ['PG-1044', 'Intake', '10:22', 'DONE'],
      ['PG-1044', 'Released', '13:05', 'DONE'],
      ['PG-1038', 'Delivered', '14:32', 'DONE'],
      ['PG-1045', 'Intake', '15:10', 'DONE'],
    ].map((row, i) => (
      <TableRow key={i} cells={row} />
    ))}
    <Divider />
    <Btn label="EXPORT REPORT (CSV)" variant="secondary" />
    <Btn label="VIEW SETTLEMENT" variant="secondary" />
  </Screen>
)
