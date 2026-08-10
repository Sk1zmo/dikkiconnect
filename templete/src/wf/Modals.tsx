import {
  ModalOverlay, Btn, Row, Note, Divider, OTPInput,
  CameraFrame, Stars, Avatar, Sheet, StatusBar,
} from './primitives'

// All modals are shown as full-screen overlays with a dimmed background

export const ConfirmBooking = () => (
  <ModalOverlay title="CONFIRM BOOKING">
    <Row label="Route" value="Lagos → Abuja" />
    <Row label="Service" value="Standard · 2–3 days" />
    <Row label="Drop-off Hub" value="Yaba Hub, Lagos" />
    <Row label="Weight" value="2.5 kg" />
    <Divider />
    <Row label="TOTAL AMOUNT" value="₦ 3,700" border={false} />
    <div className="mt-4">
      <Btn label="CONFIRM & PAY ₦ 3,700" />
      <Btn label="CANCEL" variant="ghost" />
    </div>
    <Note>Tapping outside modal = dismiss (with confirm prompt if payment started).</Note>
  </ModalOverlay>
)

export const CancelBooking = () => (
  <ModalOverlay title="CANCEL BOOKING">
    <div className="font-mono text-gray-600 mb-3" style={{ fontSize: 9, lineHeight: 1.6 }}>
      Are you sure you want to cancel order <strong>PG-1043</strong>? This action cannot be undone.
    </div>
    <div className="border border-gray-300 p-2 mb-3">
      <div className="font-mono font-bold text-gray-700 mb-1" style={{ fontSize: 9 }}>Refund Policy:</div>
      <div className="font-mono text-gray-500" style={{ fontSize: 8, lineHeight: 1.6 }}>
        • Cancelled before drop-off: Full refund (2–5 business days)<br />
        • Cancelled after drop-off: No refund if traveler assigned<br />
        • Wallet top-ups are non-refundable
      </div>
    </div>
    <Btn label="YES, CANCEL BOOKING" variant="danger" />
    <Btn label="KEEP BOOKING" variant="secondary" />
  </ModalOverlay>
)

export const CancelRide = () => (
  <ModalOverlay title="CANCEL RIDE">
    <div className="font-mono text-gray-600 mb-3" style={{ fontSize: 9 }}>
      Cancelling your ride with <strong>Emeka Okafor</strong> (Lagos → Abuja · 13 Jan).
    </div>
    <div className="font-mono text-gray-500 mb-2" style={{ fontSize: 8 }}>Reason for cancellation (required):</div>
    <div className="space-y-1 mb-3">
      {['Change of plans', 'Found a cheaper option', 'Driver not responding', 'Emergency', 'Other'].map(r => (
        <div key={r} className="flex items-center gap-2 border border-gray-300 px-2 py-1.5 font-mono" style={{ fontSize: 9 }}>
          <div className="border border-gray-400 rounded-full shrink-0" style={{ width: 12, height: 12 }} />
          <span className="text-gray-700">{r}</span>
        </div>
      ))}
    </div>
    <Btn label="CANCEL RIDE" variant="danger" />
    <Btn label="KEEP BOOKING" />
    <Note>Cancellation fee of ₦500 applies within 30 minutes of departure.</Note>
  </ModalOverlay>
)

export const ParcelDetailsModal = () => (
  <ModalOverlay title="PARCEL DETAILS · PG-1044">
    <Row label="Category" value="Electronics" />
    <Row label="Weight" value="2.5 kg" />
    <Row label="Declared Value" value="₦ 85,000" />
    <Row label="Fragile" value="YES ⚠" />
    <Row label="Sender" value="Amaka Okafor" />
    <Row label="Recipient" value="John Doe, Abuja" />
    <Row label="Current Status" value="IN TRANSIT" />
    <Row label="Traveler" value="Emeka Okafor" border={false} />
    <Divider />
    <Btn label="VIEW FULL TRACKING" />
    <Btn label="CLOSE" variant="ghost" />
  </ModalOverlay>
)

export const DriverDetailsModal = () => (
  <ModalOverlay title="DRIVER PROFILE">
    <div className="flex flex-col items-center mb-3">
      <Avatar size={52} label="EO" />
      <div className="font-mono font-bold text-gray-800 mt-1" style={{ fontSize: 11 }}>Emeka Okafor</div>
      <Stars n={5} />
      <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>128 trips · Verified ✓</div>
    </div>
    <Row label="Vehicle" value="Toyota Camry 2019" />
    <Row label="Plate" value="LOS 234 AA" />
    <Row label="Insurance" value="Valid · Dec 2025" />
    <Row label="Languages" value="English, Igbo" border={false} />
    <Divider />
    <Btn label="CALL DRIVER" />
    <Btn label="REPORT DRIVER" variant="danger" />
    <Btn label="CLOSE" variant="ghost" />
  </ModalOverlay>
)

export const RatingModal = () => (
  <ModalOverlay title="RATE YOUR EXPERIENCE">
    <div className="flex flex-col items-center mb-3">
      <Avatar size={40} label="EO" />
      <div className="font-mono font-bold text-gray-800 mt-1" style={{ fontSize: 10 }}>Emeka Okafor</div>
      <div className="flex gap-1 mt-2 mb-1">
        {[1, 2, 3, 4, 5].map(n => (
          <span key={n} className="text-gray-800" style={{ fontSize: 24 }}>{'★'}</span>
        ))}
      </div>
      <div className="font-mono text-gray-500" style={{ fontSize: 8 }}>Tap to select rating</div>
    </div>
    <div className="border border-gray-400 p-2 mb-3">
      <div className="font-mono text-gray-300" style={{ fontSize: 9, minHeight: 50 }}>Leave a comment (optional)...</div>
    </div>
    <Btn label="SUBMIT RATING" />
    <Btn label="SKIP" variant="ghost" />
  </ModalOverlay>
)

export const OTPModal = () => (
  <ModalOverlay title="ENTER OTP">
    <div className="text-center mb-1">
      <div className="font-mono text-gray-600" style={{ fontSize: 9 }}>OTP sent to <strong>+234 0800 000 0000</strong></div>
      <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>Valid for 10 minutes</div>
    </div>
    <OTPInput digits={4} />
    <Btn label="VERIFY OTP" />
    <Btn label="RESEND OTP" variant="ghost" />
    <Note>4-digit for Hub operations, 6-digit for account auth. OTP visible to user only.</Note>
  </ModalOverlay>
)

export const QRScannerModal = () => (
  <div className="h-full bg-white flex flex-col">
    <StatusBar />
    <div className="flex justify-between items-center px-3 py-2 border-b border-gray-300">
      <div className="font-mono text-gray-400" style={{ fontSize: 10 }}>✕ CLOSE</div>
      <div className="font-mono font-bold" style={{ fontSize: 10 }}>SCAN QR CODE</div>
      <div className="font-mono text-gray-400" style={{ fontSize: 10 }}>?</div>
    </div>
    <div className="flex-1 bg-gray-900 flex flex-col items-center justify-center">
      <div className="relative" style={{ width: 200, height: 200 }}>
        <div className="absolute inset-0 border border-gray-600" />
        <div className="absolute top-0 left-0 border-t-4 border-l-4 border-white" style={{ width: 30, height: 30 }} />
        <div className="absolute top-0 right-0 border-t-4 border-r-4 border-white" style={{ width: 30, height: 30 }} />
        <div className="absolute bottom-0 left-0 border-b-4 border-l-4 border-white" style={{ width: 30, height: 30 }} />
        <div className="absolute bottom-0 right-0 border-b-4 border-r-4 border-white" style={{ width: 30, height: 30 }} />
        <div className="absolute top-1/2 left-0 right-0 bg-gray-400 opacity-60" style={{ height: 2 }} />
      </div>
      <div className="font-mono text-gray-400 mt-4" style={{ fontSize: 9 }}>ALIGN QR CODE WITHIN FRAME</div>
    </div>
    <div className="flex justify-center gap-4 py-3 border-t border-gray-800">
      <div className="flex flex-col items-center font-mono text-gray-400" style={{ fontSize: 8 }}>
        <span style={{ fontSize: 20 }}>⚡</span> FLASH
      </div>
      <div className="border-2 border-white bg-white rounded-full" style={{ width: 52, height: 52 }} />
      <div className="flex flex-col items-center font-mono text-gray-400" style={{ fontSize: 8 }}>
        <span style={{ fontSize: 20 }}>⌨</span> MANUAL
      </div>
    </div>
    <Note>Camera permission prompt shows before opening. Flash toggle. Manual entry fallback.</Note>
  </div>
)

export const PhotoCaptureModal = () => (
  <div className="h-full bg-white flex flex-col">
    <StatusBar />
    <div className="flex justify-between items-center px-3 py-2 border-b border-gray-300">
      <div className="font-mono text-gray-400" style={{ fontSize: 10 }}>✕ CANCEL</div>
      <div className="font-mono font-bold" style={{ fontSize: 10 }}>CAPTURE PHOTO</div>
      <div className="font-mono text-gray-400" style={{ fontSize: 10 }}>GALLERY</div>
    </div>
    <CameraFrame label="PARCEL PHOTO · FRONT VIEW" />
    <div className="px-3 py-2">
      <div className="font-mono text-gray-500 text-center mb-2" style={{ fontSize: 9 }}>
        Photo 1 of 3 · Ensure parcel is clearly visible
      </div>
      <div className="flex justify-center gap-4">
        <div className="flex flex-col items-center font-mono text-gray-500" style={{ fontSize: 8 }}>
          <span style={{ fontSize: 18 }}>⚡</span>FLASH
        </div>
        <div className="border-4 border-gray-800 rounded-full" style={{ width: 56, height: 56 }} />
        <div className="flex flex-col items-center font-mono text-gray-500" style={{ fontSize: 8 }}>
          <span style={{ fontSize: 18 }}>↩</span>RETAKE
        </div>
      </div>
    </div>
    <Note>3 required photos (front, side, top) for parcel intake. Geotagged automatically.</Note>
  </div>
)

export const PaymentSuccessModal = () => (
  <ModalOverlay title="PAYMENT SUCCESSFUL">
    <div className="flex flex-col items-center py-3">
      <div className="border-2 border-gray-800 rounded-full flex items-center justify-center mb-2" style={{ width: 52, height: 52, fontSize: 22 }}>✓</div>
      <div className="font-mono font-bold text-gray-800 mb-0.5" style={{ fontSize: 12 }}>₦ 3,700 PAID</div>
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Transaction ref: TXN-8842</div>
    </div>
    <Row label="Order" value="PG-1043" />
    <Row label="Route" value="Lagos → Abuja" />
    <Row label="Method" value="Wallet" border={false} />
    <div className="mt-3">
      <Btn label="VIEW BOOKING DETAILS" />
      <Btn label="VIEW QR CODE" variant="secondary" />
    </div>
    <Note>Receipt auto-emailed. Booking status updates to "Confirmed" instantly.</Note>
  </ModalOverlay>
)

export const PaymentFailedModal = () => (
  <ModalOverlay title="PAYMENT FAILED">
    <div className="flex flex-col items-center py-3">
      <div className="border-2 border-dashed border-gray-500 flex items-center justify-center mb-2" style={{ width: 52, height: 52, fontSize: 22 }}>✗</div>
      <div className="font-mono font-bold text-gray-700 mb-0.5" style={{ fontSize: 12 }}>PAYMENT FAILED</div>
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>Could not process payment</div>
      <div className="font-mono text-gray-400 mt-0.5" style={{ fontSize: 8 }}>Reason: Insufficient balance · PAY-E042</div>
    </div>
    <Divider />
    <Btn label="TRY AGAIN" />
    <Btn label="USE DIFFERENT METHOD" variant="secondary" />
    <Btn label="CANCEL" variant="ghost" />
    <Note>Booking NOT created. No hold placed. Error code logged for support.</Note>
  </ModalOverlay>
)

// Sheet variant: bottom sheet for quick actions
export const QuickActionsSheet = () => (
  <div className="h-full bg-white flex flex-col">
    <StatusBar />
    <div className="flex-1 bg-gray-900 opacity-40 absolute inset-0" />
    <div className="absolute bottom-0 left-0 right-0">
      <Sheet title="PARCEL PG-1044 · ACTIONS">
        <div className="space-y-1">
          {['View Full Details', 'Share Tracking Link', 'Download QR Code', 'Contact Driver', 'Report Issue', 'Cancel Booking'].map(a => (
            <div key={a} className={`py-2.5 border-b border-gray-100 font-mono ${a === 'Cancel Booking' ? 'text-gray-500' : 'text-gray-800'}`} style={{ fontSize: 10 }}>
              {a === 'Cancel Booking' ? '✗ ' : '› '}{a}
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  </div>
)
