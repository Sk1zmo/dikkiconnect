import { Screen, Btn, Note, EmptyState, Spinner, SL } from './primitives'

export const LoadingScreen = () => (
  <Screen title="LOADING" id="STA-01">
    <div className="py-4">
      <Spinner label="LOADING YOUR DATA..." />
      <div className="flex flex-col gap-2 mt-4">
        {[100, 70, 100, 50, 80].map((w, i) => (
          <div key={i} className="bg-gray-200 animate-pulse" style={{ height: 14, width: `${w}%`, borderRadius: 2 }} />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        {[1, 2].map(i => (
          <div key={i} className="flex-1 border border-gray-200 p-3">
            <div className="bg-gray-200 mb-2" style={{ height: 12, width: '60%' }} />
            <div className="bg-gray-200" style={{ height: 20, width: '80%' }} />
          </div>
        ))}
      </div>
    </div>
    <Note>Skeleton screens preferred over spinners for content-heavy pages. Animate opacity 0.4–1.</Note>
  </Screen>
)

export const SkeletonLoader = () => (
  <Screen title="SKELETON LOADING" id="STA-02">
    <div className="py-2">
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-full bg-gray-200" style={{ width: 40, height: 40 }} />
        <div className="flex-1">
          <div className="bg-gray-200 mb-1" style={{ height: 12, width: '60%' }} />
          <div className="bg-gray-200" style={{ height: 10, width: '40%' }} />
        </div>
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="border border-gray-200 p-3 mb-2">
          <div className="flex justify-between mb-2">
            <div className="bg-gray-200" style={{ height: 12, width: '50%' }} />
            <div className="bg-gray-200" style={{ height: 12, width: '20%' }} />
          </div>
          <div className="bg-gray-200 mb-1" style={{ height: 10, width: '80%' }} />
          <div className="bg-gray-200" style={{ height: 10, width: '40%' }} />
        </div>
      ))}
    </div>
    <Note>Skeleton exactly mirrors final layout. Pulsing animation via CSS keyframes.</Note>
  </Screen>
)

export const NoTrips = () => (
  <Screen title="MY TRIPS" id="STA-03">
    <EmptyState
      icon="◎"
      title="No trips yet"
      sub="You haven't created any trips. Start by creating your first intercity trip."
    />
    <Btn label="CREATE FIRST TRIP" />
    <Btn label="BROWSE AVAILABLE ROUTES" variant="secondary" />
    <Note>Empty state with CTA. Shown when user has zero history. Different CTAs per role.</Note>
  </Screen>
)

export const NoParcels = () => (
  <Screen title="MY PARCELS" id="STA-04">
    <EmptyState
      icon="□"
      title="No parcels found"
      sub="You haven't sent any parcels yet. Book your first delivery now."
    />
    <Btn label="BOOK A PARCEL" />
    <Btn label="LEARN HOW IT WORKS" variant="ghost" />
  </Screen>
)

export const NoDrivers = () => (
  <Screen title="AVAILABLE DRIVERS" id="STA-05">
    <EmptyState
      icon="◎"
      title="No drivers available"
      sub="No trips on this route yet for the selected date. Try a different date or route."
    />
    <Btn label="CHANGE DATE" />
    <Btn label="CHANGE ROUTE" variant="secondary" />
    <Btn label="GET NOTIFIED WHEN AVAILABLE" variant="ghost" />
    <Note>Offer notification subscription for route/date when no results exist.</Note>
  </Screen>
)

export const NoNotifications = () => (
  <Screen title="NOTIFICATIONS" id="STA-06">
    <EmptyState
      icon="○"
      title="No notifications"
      sub="You're all caught up! Notifications will appear here."
    />
    <Note>Shown when inbox is empty. No CTA needed. Refresh on pull-down.</Note>
  </Screen>
)

export const EmptyWallet = () => (
  <Screen title="WALLET" id="STA-07">
    <div className="border-2 border-dashed border-gray-400 p-4 text-center mb-4">
      <div className="font-mono text-gray-300 mb-1" style={{ fontSize: 9 }}>AVAILABLE BALANCE</div>
      <div className="font-mono font-bold text-gray-400" style={{ fontSize: 28 }}>₦ 0.00</div>
    </div>
    <EmptyState
      icon="◇"
      title="Your wallet is empty"
      sub="Add funds to pay for bookings and services."
    />
    <Btn label="ADD FUNDS" />
    <Btn label="REDEEM PROMO CODE" variant="secondary" />
  </Screen>
)

export const OfflineScreen = () => (
  <Screen title="NO CONNECTION" id="STA-08">
    <div className="flex flex-col items-center py-10">
      <div className="border-2 border-dashed border-gray-400 flex items-center justify-center mb-4" style={{ width: 72, height: 72, fontSize: 32 }}>
        ✗
      </div>
      <div className="font-mono font-bold text-gray-600 mb-1" style={{ fontSize: 12 }}>YOU'RE OFFLINE</div>
      <div className="font-mono text-gray-400 text-center mb-2" style={{ fontSize: 9, lineHeight: 1.6 }}>
        No internet connection detected. Check your WiFi or mobile data and try again.
      </div>
    </div>
    <SL title="Available Offline" />
    {['View active booking QR codes', 'View boarding OTP', 'View last loaded tracking status'].map(f => (
      <div key={f} className="font-mono text-gray-600 py-1.5 border-b border-gray-100" style={{ fontSize: 9 }}>✓ {f}</div>
    ))}
    <div className="mt-4">
      <Btn label="TRY AGAIN" />
    </div>
    <Note>QR codes and OTPs cached for offline access. Syncs when reconnected.</Note>
  </Screen>
)

export const PaymentFailed = () => (
  <Screen title="PAYMENT FAILED" id="STA-09">
    <div className="flex flex-col items-center py-6">
      <div className="border-2 border-dashed border-gray-500 flex items-center justify-center mb-3" style={{ width: 64, height: 64, fontSize: 28 }}>
        ✗
      </div>
      <div className="font-mono font-bold text-gray-700 mb-1" style={{ fontSize: 13 }}>PAYMENT FAILED</div>
      <div className="font-mono text-gray-500 text-center mb-1" style={{ fontSize: 9 }}>Your payment could not be processed.</div>
      <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>Reason: Insufficient funds · Error: PAY-E042</div>
    </div>
    <div className="border border-gray-300 p-3 mb-3">
      <div className="font-mono font-bold text-gray-700 mb-1" style={{ fontSize: 10 }}>What to do next:</div>
      {['Check your card balance', 'Try a different payment method', 'Fund your ParcelGo wallet', 'Contact your bank'].map(s => (
        <div key={s} className="font-mono text-gray-500 py-1" style={{ fontSize: 9 }}>→ {s}</div>
      ))}
    </div>
    <Btn label="TRY AGAIN" />
    <Btn label="USE DIFFERENT METHOD" variant="secondary" />
    <Btn label="CONTACT SUPPORT" variant="ghost" />
    <Note>Booking NOT confirmed. No charge made. Log error ref for support.</Note>
  </Screen>
)

export const OTPIncorrect = () => (
  <Screen title="OTP ERROR" id="STA-10">
    <div className="flex flex-col items-center py-6">
      <div className="border-2 border-dashed border-gray-500 flex items-center justify-center mb-3" style={{ width: 56, height: 56, fontSize: 24 }}>
        !
      </div>
      <div className="font-mono font-bold text-gray-700 mb-1" style={{ fontSize: 12 }}>INCORRECT OTP</div>
      <div className="font-mono text-gray-500 text-center mb-1" style={{ fontSize: 9 }}>The code you entered is incorrect.</div>
      <div className="font-mono text-red-900 bg-red-50 border border-dashed border-red-200 px-3 py-1 mt-1" style={{ fontSize: 8 }}>
        2 attempts remaining before lockout
      </div>
    </div>
    <div className="flex justify-center gap-2 my-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="border-2 border-dashed border-gray-400 flex items-center justify-center font-mono" style={{ width: 32, height: 40, fontSize: 12, color: '#9ca3af' }}>
          ×
        </div>
      ))}
    </div>
    <Btn label="TRY AGAIN" />
    <Btn label="RESEND OTP" variant="secondary" />
    <Note>After 3 failures: 15-minute lockout with countdown. Show lockout reason clearly.</Note>
  </Screen>
)

export const LocationDisabled = () => (
  <Screen title="LOCATION NEEDED" id="STA-11">
    <div className="flex flex-col items-center py-8">
      <div className="border-2 border-dashed border-gray-400 flex items-center justify-center mb-3" style={{ width: 64, height: 64, fontSize: 28 }}>
        ⊕
      </div>
      <div className="font-mono font-bold text-gray-700 mb-1" style={{ fontSize: 12 }}>LOCATION DISABLED</div>
      <div className="font-mono text-gray-500 text-center mb-4" style={{ fontSize: 9, lineHeight: 1.6 }}>
        ParcelGo needs your location to find nearby hubs, drivers, and provide accurate tracking.
      </div>
    </div>
    <div className="border border-gray-300 p-3 mb-3">
      <div className="font-mono font-bold text-gray-700 mb-1" style={{ fontSize: 9 }}>To enable location:</div>
      {['1. Open your phone Settings', '2. Go to Apps → ParcelGo', '3. Tap Location → Allow'].map(s => (
        <div key={s} className="font-mono text-gray-500 py-1" style={{ fontSize: 9 }}>{s}</div>
      ))}
    </div>
    <Btn label="ENABLE LOCATION" />
    <Btn label="ENTER LOCATION MANUALLY" variant="secondary" />
    <Note>Manual entry fallback for city/area. Location required for live tracking features.</Note>
  </Screen>
)

export const NetworkError = () => (
  <Screen title="NETWORK ERROR" id="STA-12">
    <div className="flex flex-col items-center py-8">
      <div className="border-2 border-dashed border-gray-400 flex items-center justify-center mb-3" style={{ width: 64, height: 64, fontSize: 28 }}>
        ⚡
      </div>
      <div className="font-mono font-bold text-gray-700 mb-1" style={{ fontSize: 12 }}>SOMETHING WENT WRONG</div>
      <div className="font-mono text-gray-500 text-center mb-1" style={{ fontSize: 9 }}>We couldn't reach our servers.</div>
      <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>Error: NET-503 · Server temporarily unavailable</div>
    </div>
    <Btn label="RETRY" />
    <Btn label="CONTACT SUPPORT" variant="ghost" />
    <Note>Exponential backoff retry. Show cached data if available. Log error ID for debugging.</Note>
  </Screen>
)
