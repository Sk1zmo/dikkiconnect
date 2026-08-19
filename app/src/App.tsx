import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from '@/lib/store'
import { AuthProvider, useAuth } from '@/lib/auth'
import { DEMO } from '@/lib/demo'
import { DemoBadge } from '@/components/brand/DemoBadge'
import { ToastProvider } from '@/components/ui'
import { DeviceShell, FlowLayout, RoleLayout, ScrollReset } from '@/components/layout/AppShell'

/* ── Auth ─────────────────────────────────────────────────────────────────── */
const Splash = lazy(() => import('@/pages/auth/Splash'))
const Onboarding = lazy(() => import('@/pages/auth/Onboarding'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Otp = lazy(() => import('@/pages/auth/Otp'))
const Signup = lazy(() => import('@/pages/auth/Signup'))
const RoleSelect = lazy(() => import('@/pages/auth/RoleSelect'))

/* ── Sender ───────────────────────────────────────────────────────────────── */
const SenderHome = lazy(() => import('@/pages/sender/Home'))
const SenderBookings = lazy(() => import('@/pages/sender/Bookings'))
const SenderTrackList = lazy(() => import('@/pages/sender/TrackList'))
const SenderTracking = lazy(() => import('@/pages/sender/Tracking'))
const BookRoute = lazy(() => import('@/pages/sender/BookRoute'))
const BookParcel = lazy(() => import('@/pages/sender/BookParcel'))
const BookHub = lazy(() => import('@/pages/sender/BookHub'))
const BookReview = lazy(() => import('@/pages/sender/BookReview'))
const BookPayment = lazy(() => import('@/pages/sender/BookPayment'))
const BookConfirmed = lazy(() => import('@/pages/sender/BookConfirmed'))
const DropOffQr = lazy(() => import('@/pages/sender/DropOffQr'))

/* ── Traveler ─────────────────────────────────────────────────────────────── */
const TravelerHome = lazy(() => import('@/pages/traveler/Home'))
const TravelerTrips = lazy(() => import('@/pages/traveler/Trips'))
const CreateTrip = lazy(() => import('@/pages/traveler/CreateTrip'))
const TravelerJobs = lazy(() => import('@/pages/traveler/Jobs'))
const JobDetail = lazy(() => import('@/pages/traveler/JobDetail'))
const TravelerScan = lazy(() => import('@/pages/traveler/Scan'))
const HandoffOtp = lazy(() => import('@/pages/traveler/HandoffOtp'))
const Navigate2 = lazy(() => import('@/pages/traveler/Navigation'))
const TravelerKyc = lazy(() => import('@/pages/traveler/Kyc'))

/* ── Passenger ────────────────────────────────────────────────────────────── */
const PassengerSearch = lazy(() => import('@/pages/passenger/Search'))
const RideResults = lazy(() => import('@/pages/passenger/Results'))
const RideDetail = lazy(() => import('@/pages/passenger/RideDetail'))
const RideCheckout = lazy(() => import('@/pages/passenger/Checkout'))
const BoardingOtp = lazy(() => import('@/pages/passenger/BoardingOtp'))
const RideTracking = lazy(() => import('@/pages/passenger/RideTracking'))
const RideComplete = lazy(() => import('@/pages/passenger/RideComplete'))
const PassengerBookings = lazy(() => import('@/pages/passenger/Bookings'))
const Messages = lazy(() => import('@/pages/passenger/Messages'))
const Chat = lazy(() => import('@/pages/passenger/Chat'))

/* ── Hub manager ──────────────────────────────────────────────────────────── */
const HubHome = lazy(() => import('@/pages/hub/Home'))
const HubInventory = lazy(() => import('@/pages/hub/Inventory'))
const HubScan = lazy(() => import('@/pages/hub/Scan'))
const HubIntake = lazy(() => import('@/pages/hub/Intake'))
const HubHandoff = lazy(() => import('@/pages/hub/Handoff'))
const HubReceiver = lazy(() => import('@/pages/hub/ReceiverPickup'))
const HubHistory = lazy(() => import('@/pages/hub/History'))

/* ── Shared ───────────────────────────────────────────────────────────────── */
const Wallet = lazy(() => import('@/pages/common/Wallet'))
const Profile = lazy(() => import('@/pages/common/Profile'))
const EditProfile = lazy(() => import('@/pages/common/EditProfile'))
const Notifications = lazy(() => import('@/pages/common/Notifications'))
const Settings = lazy(() => import('@/pages/common/Settings'))
const Support = lazy(() => import('@/pages/common/Support'))
const HelpCenter = lazy(() => import('@/pages/common/HelpCenter'))
const PaymentMethods = lazy(() => import('@/pages/common/PaymentMethods'))
const NotFound = lazy(() => import('@/pages/common/NotFound'))

/* Operations — a desktop view, outside the phone shell and outside the auth
   gate, because it authenticates with its own server-side key. */
const Ops = lazy(() => import('@/pages/common/Ops'))

export default function App() {
  // Ops renders full-width: it is read on a laptop, not a phone.
  if (location.pathname.startsWith('/ops')) {
    return (
      <Suspense fallback={null}>
        <Routes>
          <Route path="/ops" element={<Ops />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <AuthProvider>
      <AppProvider>
        <DemoBadge />
        <DeviceShell>
        <ToastProvider>
          <ScrollReset />
          <Routes>
            {/* Auth & onboarding */}
            <Route element={<FlowLayout />}>
              <Route path="/" element={<Splash />} />
              <Route path="/auth/onboarding" element={<Onboarding />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/otp" element={<Otp />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/role" element={<RoleSelect />} />
            </Route>

            {/* Everything past this point needs a verified account */}
            <Route element={<RequireAuth />}>

            {/* Sender — tabbed */}
            <Route element={<RoleLayout role="sender" />}>
              <Route path="/sender" element={<SenderHome />} />
              <Route path="/sender/bookings" element={<SenderBookings />} />
              <Route path="/sender/track" element={<SenderTrackList />} />
            </Route>

            {/* Sender — full-bleed flows */}
            <Route element={<FlowLayout />}>
              <Route path="/sender/track/:id" element={<SenderTracking />} />
              <Route path="/sender/book" element={<BookRoute />} />
              <Route path="/sender/book/parcel" element={<BookParcel />} />
              <Route path="/sender/book/hub" element={<BookHub />} />
              <Route path="/sender/book/review" element={<BookReview />} />
              <Route path="/sender/book/payment" element={<BookPayment />} />
              <Route path="/sender/book/confirmed" element={<BookConfirmed />} />
              <Route path="/sender/qr/:id" element={<DropOffQr />} />
            </Route>

            {/* Traveler */}
            <Route element={<RoleLayout role="traveler" />}>
              <Route path="/traveler" element={<TravelerHome />} />
              <Route path="/traveler/trips" element={<TravelerTrips />} />
              <Route path="/traveler/scan" element={<TravelerScan />} />
            </Route>
            <Route element={<FlowLayout />}>
              <Route path="/traveler/jobs" element={<TravelerJobs />} />
              <Route path="/traveler/jobs/:id" element={<JobDetail />} />
              <Route path="/traveler/trips/new" element={<CreateTrip />} />
              <Route path="/traveler/handoff/:mode" element={<HandoffOtp />} />
              <Route path="/traveler/navigate" element={<Navigate2 />} />
              <Route path="/traveler/kyc" element={<TravelerKyc />} />
            </Route>

            {/* Passenger */}
            <Route element={<RoleLayout role="passenger" />}>
              <Route path="/passenger" element={<PassengerSearch />} />
              <Route path="/passenger/bookings" element={<PassengerBookings />} />
              <Route path="/passenger/messages" element={<Messages />} />
            </Route>
            <Route element={<FlowLayout />}>
              <Route path="/passenger/results" element={<RideResults />} />
              <Route path="/passenger/ride/:id" element={<RideDetail />} />
              <Route path="/passenger/checkout/:id" element={<RideCheckout />} />
              <Route path="/passenger/boarding/:id" element={<BoardingOtp />} />
              <Route path="/passenger/tracking/:id" element={<RideTracking />} />
              <Route path="/passenger/complete/:id" element={<RideComplete />} />
              <Route path="/passenger/messages/:id" element={<Chat />} />
            </Route>

            {/* Hub manager */}
            <Route element={<RoleLayout role="hub" />}>
              <Route path="/hub" element={<HubHome />} />
              <Route path="/hub/inventory" element={<HubInventory />} />
              <Route path="/hub/scan" element={<HubScan />} />
              <Route path="/hub/history" element={<HubHistory />} />
            </Route>
            <Route element={<FlowLayout />}>
              <Route path="/hub/intake/:id" element={<HubIntake />} />
              <Route path="/hub/handoff" element={<HubHandoff />} />
              <Route path="/hub/receiver" element={<HubReceiver />} />
            </Route>

            {/* Shared — reachable from every role's tab bar */}
            <Route element={<RoleLayoutForCurrentRole />}>
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route element={<FlowLayout />}>
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/support" element={<Support />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/payment-methods" element={<PaymentMethods />} />
              <Route path="/404" element={<NotFound />} />
            </Route>

            </Route>

            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </ToastProvider>
        </DeviceShell>
      </AppProvider>
    </AuthProvider>
  )
}

/**
 * Auth gate. Without a signed-in account every portal route bounces to the
 * login screen, remembering where you were headed.
 */
function RequireAuth() {
  const { authed } = useAuth()
  const location = useLocation()
  if (!DEMO && !authed) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

/** Wallet and Profile are shared, so the tab bar follows whichever role is active. */
function RoleLayoutForCurrentRole() {
  const { role } = useApp()
  return <RoleLayout role={role} />
}
