import {
  Screen, Input, Btn, SL, Note, Card, Chip, Avatar, Divider,
  Stars,
} from './primitives'

export const Notifications = () => (
  <Screen title="NOTIFICATIONS" back id="CMN-01">
    <div className="flex justify-end mb-2">
      <span className="font-mono text-gray-400 underline" style={{ fontSize: 9 }}>Mark all read</span>
    </div>
    <SL title="Today" />
    {[
      { icon: '📦', title: 'Parcel PG-1044 picked up', sub: 'Emeka Okafor collected from Yaba Hub', time: '2m ago', unread: true },
      { icon: '✓', title: 'Payment confirmed', sub: 'Booking PG-1043 payment successful', time: '1h ago', unread: true },
      { icon: '🚗', title: 'Driver assigned', sub: 'Emeka O. will carry PG-1043', time: '3h ago', unread: false },
    ].map((n, i) => (
      <div key={i} className={`flex gap-2 py-2.5 border-b border-gray-100 ${n.unread ? 'bg-gray-50' : ''}`}>
        <div className="font-mono text-lg shrink-0">{n.icon}</div>
        <div className="flex-1">
          <div className="flex justify-between">
            <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>{n.title}</div>
            {n.unread && <div className="bg-gray-800 rounded-full shrink-0" style={{ width: 6, height: 6 }} />}
          </div>
          <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>{n.sub}</div>
          <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>{n.time}</div>
        </div>
      </div>
    ))}
    <SL title="Yesterday" />
    {[
      { icon: '⭐', title: 'Rate your trip', sub: 'How was your ride with Emeka Okafor?', time: '18h ago', unread: false },
      { icon: '💰', title: 'Wallet funded', sub: '₦10,000 added to your wallet', time: '22h ago', unread: false },
    ].map((n, i) => (
      <div key={i} className="flex gap-2 py-2.5 border-b border-gray-100">
        <div className="font-mono text-lg shrink-0">{n.icon}</div>
        <div className="flex-1">
          <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>{n.title}</div>
          <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>{n.sub}</div>
          <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>{n.time}</div>
        </div>
      </div>
    ))}
  </Screen>
)

export const CommonWallet = () => (
  <Screen title="WALLET" back id="CMN-02">
    <div className="border-2 border-gray-800 p-4 text-center mb-3">
      <div className="font-mono text-gray-500 mb-1" style={{ fontSize: 9 }}>AVAILABLE BALANCE</div>
      <div className="font-mono font-bold text-gray-800" style={{ fontSize: 28 }}>₦ 12,400.00</div>
      <div className="font-mono text-gray-400 mt-1" style={{ fontSize: 8 }}>Wallet ID: WLT-0042</div>
    </div>
    <div className="grid grid-cols-3 gap-1 mb-3">
      <Btn label="ADD FUNDS" />
      <Btn label="WITHDRAW" variant="secondary" />
      <Btn label="TRANSFER" variant="secondary" />
    </div>
    <SL title="Add Funds via" />
    <div className="grid grid-cols-3 gap-1 mb-3">
      {['Bank Transfer', 'Debit Card', 'USSD'].map(m => (
        <div key={m} className="border border-dashed border-gray-400 py-3 text-center font-mono text-gray-500" style={{ fontSize: 8 }}>
          {m}
        </div>
      ))}
    </div>
    <SL title="Transaction History" />
    {[
      { label: 'Booking PG-1043', type: 'debit', amount: '−₦3,700', date: '12 Jan' },
      { label: 'Top-up via Card', type: 'credit', amount: '+₦10,000', date: '11 Jan' },
      { label: 'Booking PG-1038', type: 'debit', amount: '−₦2,200', date: '10 Jan' },
      { label: 'Refund PG-1022', type: 'credit', amount: '+₦1,500', date: '5 Jan' },
    ].map((t, i) => (
      <div key={i} className="flex justify-between py-2 border-b border-gray-200 font-mono" style={{ fontSize: 10 }}>
        <div>
          <div className="text-gray-800">{t.label}</div>
          <div className="text-gray-400" style={{ fontSize: 8 }}>{t.date}</div>
        </div>
        <div className={t.type === 'credit' ? 'text-gray-700 font-bold' : 'text-gray-600'}>{t.amount}</div>
      </div>
    ))}
  </Screen>
)

export const SupportChat = () => (
  <Screen title="SUPPORT CHAT" back actions="⋯" id="CMN-03">
    <div className="text-center py-2 mb-2 border-b border-gray-200">
      <div className="font-mono text-gray-500" style={{ fontSize: 8 }}>Ticket #TKT-00284 · Open</div>
      <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>Lost Parcel - PG-1022</div>
    </div>
    <div className="flex-1 space-y-2 mb-3">
      {[
        { from: 'Support', msg: 'Hello! Thanks for contacting ParcelGo Support. I can see your ticket about order PG-1022. Let me look into this.', time: '10:22 AM' },
        { from: 'Me', msg: 'My parcel was supposed to arrive 3 days ago but there\'s no update.', time: '10:24 AM' },
        { from: 'Support', msg: 'I\'ve flagged this for our logistics team. You\'ll receive an update within 2 hours. We\'re sorry for the delay.', time: '10:28 AM' },
      ].map((m, i) => (
        <div key={i} className={`flex ${m.from === 'Me' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`border px-2 py-1.5 font-mono max-w-[80%] ${m.from === 'Me' ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 bg-gray-50 text-gray-700'}`}
            style={{ fontSize: 9, lineHeight: 1.5 }}
          >
            {m.msg}
            <div className={`mt-0.5 ${m.from === 'Me' ? 'text-gray-300' : 'text-gray-400'}`} style={{ fontSize: 7 }}>{m.time}</div>
          </div>
        </div>
      ))}
    </div>
    <div className="flex border border-gray-400 mt-2">
      <input className="flex-1 px-2 py-2 font-mono outline-none text-gray-600" style={{ fontSize: 9 }} placeholder="Type a message..." readOnly />
      <div className="border-l border-gray-300 px-3 py-2 font-mono text-gray-500 bg-gray-50" style={{ fontSize: 9 }}>SEND</div>
    </div>
    <div className="flex gap-2 mt-2">
      <div className="border border-dashed border-gray-400 px-2 py-1 font-mono text-gray-500" style={{ fontSize: 8 }}>📎 Attach File</div>
      <div className="border border-dashed border-gray-400 px-2 py-1 font-mono text-gray-500" style={{ fontSize: 8 }}>📷 Photo</div>
    </div>
  </Screen>
)

export const HelpCenter = () => (
  <Screen title="HELP CENTER" back id="CMN-04">
    <div className="border border-gray-400 flex items-center px-2 py-1.5 mb-3">
      <span className="font-mono text-gray-400 mr-2" style={{ fontSize: 10 }}>🔍</span>
      <span className="font-mono text-gray-400" style={{ fontSize: 9 }}>Search help articles...</span>
    </div>
    <SL title="Popular Topics" />
    {[
      'How to track my parcel',
      'What happens if my parcel is lost?',
      'How do I cancel a booking?',
      'When will I receive my refund?',
      'How to become a traveler/driver',
      'How OTP verification works',
    ].map(t => (
      <div key={t} className="flex justify-between py-2.5 border-b border-gray-100 font-mono" style={{ fontSize: 10 }}>
        <span className="text-gray-700">? {t}</span>
        <span className="text-gray-400">›</span>
      </div>
    ))}
    <Divider />
    <Btn label="CONTACT SUPPORT" />
    <Btn label="CALL US: +234 700 PARCEL" variant="secondary" />
    <div className="text-center font-mono text-gray-400 mt-2" style={{ fontSize: 8 }}>
      Support available 8am–9pm daily
    </div>
  </Screen>
)

export const Settings = () => (
  <Screen title="SETTINGS" back id="CMN-05">
    <SL title="Account" />
    {['Edit Profile', 'Change Phone Number', 'Change Language', 'Privacy Settings'].map(s => (
      <div key={s} className="flex justify-between py-2.5 border-b border-gray-100 font-mono text-gray-700" style={{ fontSize: 10 }}>
        <span>{s}</span><span className="text-gray-400">›</span>
      </div>
    ))}
    <SL title="Notifications" />
    {[
      { label: 'Push Notifications', on: true },
      { label: 'SMS Alerts', on: true },
      { label: 'Email Updates', on: false },
      { label: 'Marketing Messages', on: false },
    ].map(s => (
      <div key={s.label} className="flex justify-between py-2.5 border-b border-gray-100 font-mono text-gray-700" style={{ fontSize: 10 }}>
        <span>{s.label}</span>
        <div className={`border px-2 py-0.5 font-mono ${s.on ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-400'}`} style={{ fontSize: 8 }}>
          {s.on ? 'ON' : 'OFF'}
        </div>
      </div>
    ))}
    <SL title="Security" />
    {['Biometric Login', 'Change PIN', 'Two-Factor Auth', 'Active Sessions'].map(s => (
      <div key={s} className="flex justify-between py-2.5 border-b border-gray-100 font-mono text-gray-700" style={{ fontSize: 10 }}>
        <span>{s}</span><span className="text-gray-400">›</span>
      </div>
    ))}
    <SL title="Data" />
    <Btn label="DELETE ACCOUNT" variant="danger" />
    <Note>Delete account request queued for 30 days before permanent removal.</Note>
  </Screen>
)

export const Profile = () => (
  <Screen title="MY PROFILE" back id="CMN-06">
    <div className="flex flex-col items-center py-4 border-b border-gray-200 mb-2">
      <div className="relative mb-2">
        <Avatar size={72} label="AO" />
        <div className="absolute bottom-0 right-0 border border-gray-400 bg-white px-1 font-mono" style={{ fontSize: 7 }}>EDIT</div>
      </div>
      <div className="font-mono font-bold text-gray-800" style={{ fontSize: 13 }}>Amaka Okafor</div>
      <div className="font-mono text-gray-400" style={{ fontSize: 9 }}>+234 0800 000 0000</div>
      <Stars n={4} />
      <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>42 Shipments · Member since Jan 2024</div>
    </div>
    <Input label="Full Name" value="Amaka Okafor" />
    <Input label="Email" value="amaka@email.com" />
    <Input label="Phone" value="+234 0800 000 0000" />
    <Input label="City" value="Lagos, Nigeria" />
    <SL title="Roles" />
    <div className="flex gap-1 mb-3">
      <Chip label="SENDER" filled />
      <Chip label="PASSENGER" />
    </div>
    <Btn label="SAVE CHANGES" />
    <Btn label="CHANGE PROFILE PHOTO" variant="secondary" />
  </Screen>
)

export const KYCStatus = () => (
  <Screen title="KYC VERIFICATION" back id="CMN-07">
    <div className="border-2 border-gray-800 p-3 text-center mb-3">
      <div className="font-mono font-bold text-gray-800" style={{ fontSize: 12 }}>✓ VERIFIED</div>
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Your identity has been verified</div>
    </div>
    <SL title="Submitted Documents" />
    {[
      { label: 'National ID', status: 'APPROVED', date: '12 Jan 2024' },
      { label: 'Selfie / Face Match', status: 'APPROVED', date: '12 Jan 2024' },
      { label: 'Proof of Address', status: 'APPROVED', date: '12 Jan 2024' },
    ].map(d => (
      <Card key={d.label}>
        <div className="flex justify-between items-center">
          <div>
            <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>{d.label}</div>
            <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>{d.date}</div>
          </div>
          <Chip label={d.status} filled />
        </div>
      </Card>
    ))}
    <SL title="Driver Documents (if applicable)" />
    {[
      { label: "Driver's License", status: 'APPROVED' },
      { label: 'Vehicle Insurance', status: 'APPROVED' },
      { label: 'Roadworthiness', status: 'PENDING' },
    ].map(d => (
      <Card key={d.label}>
        <div className="flex justify-between items-center">
          <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>{d.label}</div>
          <Chip label={d.status} filled={d.status === 'APPROVED'} />
        </div>
      </Card>
    ))}
    <Btn label="RE-SUBMIT DOCUMENT" variant="secondary" />
    <Note>KYC reviewed within 24 hours. Rejected documents show reason and allow resubmission.</Note>
  </Screen>
)

export const PaymentMethods = () => (
  <Screen title="PAYMENT METHODS" back id="CMN-08">
    <SL title="Saved Cards" />
    {[
      { type: 'VISA', last4: '4521', exp: '04/27', bank: 'GTBank' },
      { type: 'MC', last4: '8801', exp: '11/26', bank: 'Access Bank' },
    ].map(c => (
      <Card key={c.last4}>
        <div className="flex justify-between items-center">
          <div>
            <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>{c.type} ···· {c.last4}</div>
            <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>{c.bank} · Expires {c.exp}</div>
          </div>
          <div className="border border-dashed border-gray-400 px-2 py-1 font-mono text-gray-500" style={{ fontSize: 8 }}>REMOVE</div>
        </div>
      </Card>
    ))}
    <SL title="Bank Accounts" />
    <Card>
      <div className="flex justify-between items-center">
        <div>
          <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>GTBank · 0123456789</div>
          <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>Amaka Okafor</div>
        </div>
        <Chip label="DEFAULT" filled />
      </div>
    </Card>
    <Btn label="+ ADD NEW CARD" variant="secondary" />
    <Btn label="+ ADD BANK ACCOUNT" variant="secondary" />
    <Note>Cards tokenized via Paystack. Bank accounts verified via micro-deposit.</Note>
  </Screen>
)
