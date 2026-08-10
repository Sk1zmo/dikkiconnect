import { Screen, Input, Btn, Divider, ImgBox, OTPInput, SL, Note, Spinner } from './primitives'

export const Splash = () => (
  <div className="flex flex-col h-full bg-white items-center justify-center">
    <ImgBox width={80} height={80} label="APP ICON" />
    <div className="font-mono font-bold tracking-widest mt-2" style={{ fontSize: 14 }}>PARCELGO</div>
    <div className="font-mono text-gray-400 mt-1" style={{ fontSize: 9 }}>Logistics & Intercity Carpool</div>
    <Divider />
    <Spinner label="INITIALIZING..." />
    <div className="absolute bottom-4 font-mono text-gray-300" style={{ fontSize: 8 }}>v2.1.0 · © 2025 ParcelGo Ltd</div>
  </div>
)

export const Onboarding = () => (
  <div className="flex flex-col h-full bg-white">
    <div className="flex justify-end px-4 pt-3">
      <span className="font-mono text-gray-400 border border-gray-300 px-2 py-0.5" style={{ fontSize: 9 }}>SKIP</span>
    </div>
    <ImgBox height={200} label="ONBOARDING ILLUSTRATION · SCREEN 1 / 3" />
    <div className="px-4 flex flex-col flex-1">
      <div className="flex gap-1 justify-center mb-4">
        <div className="bg-gray-800" style={{ width: 16, height: 4 }} />
        <div className="bg-gray-300" style={{ width: 8, height: 4 }} />
        <div className="bg-gray-300" style={{ width: 8, height: 4 }} />
      </div>
      <div className="font-mono font-bold text-center mb-2" style={{ fontSize: 13 }}>Send Parcels Across Cities</div>
      <div className="font-mono text-gray-500 text-center mb-4" style={{ fontSize: 9, lineHeight: 1.6 }}>
        Connect with verified intercity travelers to deliver your packages safely, affordably, and on time.
      </div>
      <Btn label="NEXT →" />
      <Btn label="ALREADY HAVE AN ACCOUNT" variant="ghost" />
    </div>
    <Note>Swipe left/right to navigate. Dots indicate current step. SKIP jumps to Login.</Note>
  </div>
)

export const OnboardingSlide2 = () => (
  <div className="flex flex-col h-full bg-white">
    <div className="flex justify-end px-4 pt-3">
      <span className="font-mono text-gray-400 border border-gray-300 px-2 py-0.5" style={{ fontSize: 9 }}>SKIP</span>
    </div>
    <ImgBox height={200} label="ONBOARDING ILLUSTRATION · SCREEN 2 / 3" />
    <div className="px-4 flex flex-col flex-1">
      <div className="flex gap-1 justify-center mb-4">
        <div className="bg-gray-300" style={{ width: 8, height: 4 }} />
        <div className="bg-gray-800" style={{ width: 16, height: 4 }} />
        <div className="bg-gray-300" style={{ width: 8, height: 4 }} />
      </div>
      <div className="font-mono font-bold text-center mb-2" style={{ fontSize: 13 }}>Earn as a Traveler</div>
      <div className="font-mono text-gray-500 text-center mb-4" style={{ fontSize: 9, lineHeight: 1.6 }}>
        Traveling between cities? Carry parcels on your route and earn real money every trip.
      </div>
      <Btn label="NEXT →" />
      <Btn label="← BACK" variant="secondary" />
    </div>
  </div>
)

export const OnboardingSlide3 = () => (
  <div className="flex flex-col h-full bg-white">
    <ImgBox height={200} label="ONBOARDING ILLUSTRATION · SCREEN 3 / 3" />
    <div className="px-4 flex flex-col flex-1">
      <div className="flex gap-1 justify-center mb-4">
        <div className="bg-gray-300" style={{ width: 8, height: 4 }} />
        <div className="bg-gray-300" style={{ width: 8, height: 4 }} />
        <div className="bg-gray-800" style={{ width: 16, height: 4 }} />
      </div>
      <div className="font-mono font-bold text-center mb-2" style={{ fontSize: 13 }}>Book Intercity Rides</div>
      <div className="font-mono text-gray-500 text-center mb-4" style={{ fontSize: 9, lineHeight: 1.6 }}>
        Find affordable seats on intercity routes with verified drivers and real-time tracking.
      </div>
      <Btn label="GET STARTED" />
      <Btn label="SIGN IN" variant="secondary" />
    </div>
  </div>
)

export const Login = () => (
  <Screen title="SIGN IN" id="AUTH-03">
    <div className="flex flex-col items-center py-4">
      <ImgBox width={52} height={52} label="LOGO" />
      <div className="font-mono font-bold tracking-widest mt-1 mb-0.5" style={{ fontSize: 12 }}>WELCOME BACK</div>
      <div className="font-mono text-gray-400" style={{ fontSize: 9 }}>Sign in to your account</div>
    </div>
    <SL title="Phone Number" />
    <div className="flex mb-3 border border-gray-400">
      <div className="border-r border-gray-300 px-2 py-2 font-mono text-gray-600 shrink-0" style={{ fontSize: 10 }}>+234 ▾</div>
      <div className="flex-1 px-2 py-2 font-mono text-gray-500" style={{ fontSize: 10 }}>0800 000 0000</div>
    </div>
    <Btn label="SEND OTP" />
    <Divider label="OR CONTINUE WITH" />
    <Btn label="GOOGLE" variant="secondary" />
    <Btn label="APPLE" variant="secondary" />
    <Divider />
    <div className="text-center font-mono text-gray-400" style={{ fontSize: 9 }}>
      New user? <span className="text-gray-700 underline">Register here</span>
    </div>
    <Note>Phone field auto-focuses. Country code picker → bottom sheet. OTP sent via SMS/WhatsApp.</Note>
  </Screen>
)

export const Register = () => (
  <Screen title="CREATE ACCOUNT" back id="AUTH-04">
    <Input label="Full Name" placeholder="Amaka Okafor" />
    <Input label="Phone Number" placeholder="0800 000 0000" />
    <Input label="Email (optional)" placeholder="amaka@email.com" />
    <Input label="Referral Code (optional)" placeholder="PARCEL2025" />
    <SL title="Gender" />
    <div className="flex gap-2 mb-3">
      {['Male', 'Female', 'Prefer not to say'].map(g => (
        <div key={g} className="border border-gray-400 px-2 py-1 font-mono text-gray-600" style={{ fontSize: 9 }}>{g}</div>
      ))}
    </div>
    <Btn label="CREATE ACCOUNT" />
    <div className="text-center font-mono text-gray-400 mt-2" style={{ fontSize: 8 }}>
      By registering you agree to our Terms & Privacy Policy
    </div>
  </Screen>
)

export const OTPVerification = () => (
  <Screen title="VERIFY OTP" back id="AUTH-05">
    <div className="py-4 text-center">
      <div className="font-mono font-bold mb-1" style={{ fontSize: 11 }}>Enter Verification Code</div>
      <div className="font-mono text-gray-500" style={{ fontSize: 9 }}>OTP sent to <strong>+234 0800 000 0000</strong></div>
      <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>Valid for 5 minutes</div>
    </div>
    <OTPInput digits={6} />
    <div className="text-center font-mono text-gray-400 mb-4" style={{ fontSize: 9 }}>
      Resend in <span className="font-bold text-gray-700">00:45</span>
    </div>
    <Btn label="VERIFY" />
    <Btn label="RESEND OTP" variant="secondary" />
    <Btn label="CHANGE NUMBER" variant="ghost" />
    <Note>Auto-submits on 6th digit. 3 wrong attempts → 15 min lockout. Biometric auth shown on re-login.</Note>
  </Screen>
)

export const RoleSelect = () => (
  <Screen title="CHOOSE ROLE" id="AUTH-06">
    <div className="text-center py-3">
      <div className="font-mono font-bold mb-1" style={{ fontSize: 12 }}>How will you use ParcelGo?</div>
      <div className="font-mono text-gray-400" style={{ fontSize: 9 }}>You can switch roles anytime from profile</div>
    </div>
    {[
      { icon: '□', label: 'SENDER', sub: 'Send packages between cities' },
      { icon: '◎', label: 'TRAVELER / DRIVER', sub: 'Carry parcels on your trips and earn' },
      { icon: '▶', label: 'PASSENGER', sub: 'Book intercity rides' },
      { icon: '◈', label: 'HUB MANAGER', sub: 'Manage a parcel collection point' },
    ].map(r => (
      <div key={r.label} className="border border-gray-300 flex items-center gap-3 px-3 py-3 mb-2">
        <div className="font-mono text-gray-400 text-xl shrink-0">{r.icon}</div>
        <div className="flex-1">
          <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>{r.label}</div>
          <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>{r.sub}</div>
        </div>
        <div className="font-mono text-gray-400" style={{ fontSize: 14 }}>›</div>
      </div>
    ))}
    <Note>Role sets bottom nav, dashboard, and available features. Multiple roles supported.</Note>
  </Screen>
)
