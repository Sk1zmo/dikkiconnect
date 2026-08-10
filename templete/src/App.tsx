import { useState, type ReactNode } from 'react'

import * as Auth from './wf/Auth'
import * as Sender from './wf/Sender'
import * as Traveler from './wf/Traveler'
import * as Passenger from './wf/Passenger'
import * as Hub from './wf/HubManager'
import * as Admin from './wf/Admin'
import * as Common from './wf/Common'
import * as States from './wf/States'
import * as Modals from './wf/Modals'
import * as Lib from './wf/ComponentLib'

type ScreenType = 'mobile' | 'admin'
type ScreenDef = { id: string; label: string; component: () => ReactNode; type: ScreenType }
type Group = { id: string; label: string; count: number; screens: ScreenDef[] }

const GROUPS: Group[] = [
  {
    id: 'auth', label: 'AUTHENTICATION', count: 0,
    screens: [
      { id: 'splash', label: 'Splash Screen', component: Auth.Splash, type: 'mobile' },
      { id: 'onboarding-1', label: 'Onboarding · Slide 1', component: Auth.Onboarding, type: 'mobile' },
      { id: 'onboarding-2', label: 'Onboarding · Slide 2', component: Auth.OnboardingSlide2, type: 'mobile' },
      { id: 'onboarding-3', label: 'Onboarding · Slide 3', component: Auth.OnboardingSlide3, type: 'mobile' },
      { id: 'login', label: 'Login', component: Auth.Login, type: 'mobile' },
      { id: 'register', label: 'Register', component: Auth.Register, type: 'mobile' },
      { id: 'otp-verify', label: 'OTP Verification', component: Auth.OTPVerification, type: 'mobile' },
      { id: 'role-select', label: 'Role Selection', component: Auth.RoleSelect, type: 'mobile' },
    ],
  },
  {
    id: 'sender', label: 'SENDER FLOW', count: 0,
    screens: [
      { id: 'snd-home', label: 'Home', component: Sender.Home, type: 'mobile' },
      { id: 'snd-book1', label: 'Book · Step 1 · Cities', component: Sender.BookStep1, type: 'mobile' },
      { id: 'snd-book2', label: 'Book · Step 2 · Parcel', component: Sender.BookStep2, type: 'mobile' },
      { id: 'snd-estimate', label: 'Price Estimate', component: Sender.PriceEstimate, type: 'mobile' },
      { id: 'snd-hub', label: 'Choose Hub', component: Sender.ChooseHub, type: 'mobile' },
      { id: 'snd-payment', label: 'Payment', component: Sender.Payment, type: 'mobile' },
      { id: 'snd-confirmed', label: 'Booking Confirmed', component: Sender.BookingConfirmed, type: 'mobile' },
      { id: 'snd-qr', label: 'Drop-off QR Code', component: Sender.QRDropOff, type: 'mobile' },
      { id: 'snd-tracking', label: 'Tracking Screen', component: Sender.Tracking, type: 'mobile' },
      { id: 'snd-bookings', label: 'Bookings List', component: Sender.BookingsList, type: 'mobile' },
      { id: 'snd-wallet', label: 'Wallet', component: Sender.SenderWallet, type: 'mobile' },
      { id: 'snd-profile', label: 'Profile', component: Sender.SenderProfile, type: 'mobile' },
    ],
  },
  {
    id: 'traveler', label: 'TRAVELER FLOW', count: 0,
    screens: [
      { id: 'trv-dashboard', label: 'Dashboard', component: Traveler.TravelerDashboard, type: 'mobile' },
      { id: 'trv-trip1', label: 'Create Trip · Route', component: Traveler.CreateTripRoute, type: 'mobile' },
      { id: 'trv-trip2', label: 'Create Trip · Details', component: Traveler.CreateTripDetails, type: 'mobile' },
      { id: 'trv-publish', label: 'Review & Publish', component: Traveler.PublishTrip, type: 'mobile' },
      { id: 'trv-parcels', label: 'Available Parcel Jobs', component: Traveler.AvailableParcels, type: 'mobile' },
      { id: 'trv-accept', label: 'Parcel Accept', component: Traveler.ParcelAccept, type: 'mobile' },
      { id: 'trv-scan', label: 'Scan QR (Hub Pickup)', component: Traveler.ScanQR, type: 'mobile' },
      { id: 'trv-otp', label: 'Enter OTP', component: Traveler.EnterOTP, type: 'mobile' },
      { id: 'trv-pickup-confirmed', label: 'Pickup Confirmed', component: Traveler.PickupConfirmed, type: 'mobile' },
      { id: 'trv-navigation', label: 'Route Navigation', component: Traveler.RouteNavigation, type: 'mobile' },
      { id: 'trv-dropoff', label: 'Drop-off Scan', component: Traveler.DropOffScan, type: 'mobile' },
      { id: 'trv-wallet', label: 'Wallet & Earnings', component: Traveler.TravelerWallet, type: 'mobile' },
    ],
  },
  {
    id: 'passenger', label: 'PASSENGER FLOW', count: 0,
    screens: [
      { id: 'psg-search', label: 'Search Ride', component: Passenger.SearchRide, type: 'mobile' },
      { id: 'psg-results', label: 'Ride Results', component: Passenger.RideResults, type: 'mobile' },
      { id: 'psg-detail', label: 'Ride Detail', component: Passenger.RideDetail, type: 'mobile' },
      { id: 'psg-payment', label: 'Confirm & Pay', component: Passenger.PassengerPayment, type: 'mobile' },
      { id: 'psg-otp', label: 'Boarding OTP', component: Passenger.BoardingOTP, type: 'mobile' },
      { id: 'psg-tracking', label: 'Live Tracking', component: Passenger.LiveTracking, type: 'mobile' },
      { id: 'psg-complete', label: 'Trip Complete', component: Passenger.TripComplete, type: 'mobile' },
      { id: 'psg-rate', label: 'Rate Driver', component: Passenger.RateDriver, type: 'mobile' },
      { id: 'psg-bookings', label: 'My Bookings', component: Passenger.PassengerBookings, type: 'mobile' },
    ],
  },
  {
    id: 'hub', label: 'HUB MANAGER FLOW', count: 0,
    screens: [
      { id: 'hub-dashboard', label: 'Dashboard', component: Hub.HubDashboard, type: 'mobile' },
      { id: 'hub-intake-scan', label: 'Parcel Intake · Scan', component: Hub.ParcelIntakeScan, type: 'mobile' },
      { id: 'hub-intake-details', label: 'Parcel Intake · Details', component: Hub.ParcelIntakeDetails, type: 'mobile' },
      { id: 'hub-camera', label: 'Capture Photos', component: Hub.ParcelIntakeCamera, type: 'mobile' },
      { id: 'hub-inventory', label: 'Inventory', component: Hub.Inventory, type: 'mobile' },
      { id: 'hub-traveler-otp', label: 'Traveler Pickup · OTP', component: Hub.TravelerPickupOTP, type: 'mobile' },
      { id: 'hub-traveler-release', label: 'Traveler Pickup · Release', component: Hub.TravelerPickupRelease, type: 'mobile' },
      { id: 'hub-receiver-otp', label: 'Receiver Pickup · OTP', component: Hub.ReceiverPickupOTP, type: 'mobile' },
      { id: 'hub-delivered', label: 'Delivered Confirmation', component: Hub.Delivered, type: 'mobile' },
      { id: 'hub-history', label: 'History & Reports', component: Hub.HubHistory, type: 'mobile' },
    ],
  },
  {
    id: 'admin', label: 'ADMIN WEB', count: 0,
    screens: [
      { id: 'adm-dashboard', label: 'Dashboard', component: Admin.AdminDashboard, type: 'admin' },
      { id: 'adm-users', label: 'Users List', component: Admin.AdminUsers, type: 'admin' },
      { id: 'adm-user-detail', label: 'User Detail', component: Admin.AdminUserDetail, type: 'admin' },
      { id: 'adm-drivers', label: 'Drivers List', component: Admin.AdminDrivers, type: 'admin' },
      { id: 'adm-driver-detail', label: 'Driver Detail + KYC', component: Admin.AdminDriverDetail, type: 'admin' },
      { id: 'adm-trips', label: 'Trips', component: Admin.AdminTrips, type: 'admin' },
      { id: 'adm-parcels', label: 'Parcels', component: Admin.AdminParcels, type: 'admin' },
      { id: 'adm-timeline', label: 'Parcel Timeline', component: Admin.AdminParcelTimeline, type: 'admin' },
      { id: 'adm-payments', label: 'Payments & Settlement', component: Admin.AdminPayments, type: 'admin' },
      { id: 'adm-disputes', label: 'Disputes', component: Admin.AdminDisputes, type: 'admin' },
      { id: 'adm-analytics', label: 'Analytics', component: Admin.AdminAnalytics, type: 'admin' },
      { id: 'adm-settings', label: 'Settings', component: Admin.AdminSettings, type: 'admin' },
    ],
  },
  {
    id: 'common', label: 'COMMON SCREENS', count: 0,
    screens: [
      { id: 'cmn-notifications', label: 'Notifications', component: Common.Notifications, type: 'mobile' },
      { id: 'cmn-wallet', label: 'Wallet', component: Common.CommonWallet, type: 'mobile' },
      { id: 'cmn-chat', label: 'Support Chat', component: Common.SupportChat, type: 'mobile' },
      { id: 'cmn-help', label: 'Help Center', component: Common.HelpCenter, type: 'mobile' },
      { id: 'cmn-settings', label: 'Settings', component: Common.Settings, type: 'mobile' },
      { id: 'cmn-profile', label: 'Profile', component: Common.Profile, type: 'mobile' },
      { id: 'cmn-kyc', label: 'KYC Status', component: Common.KYCStatus, type: 'mobile' },
      { id: 'cmn-payments', label: 'Payment Methods', component: Common.PaymentMethods, type: 'mobile' },
    ],
  },
  {
    id: 'states', label: 'STATE SCREENS', count: 0,
    screens: [
      { id: 'sta-loading', label: 'Loading / Spinner', component: States.LoadingScreen, type: 'mobile' },
      { id: 'sta-skeleton', label: 'Skeleton Loader', component: States.SkeletonLoader, type: 'mobile' },
      { id: 'sta-no-trips', label: 'Empty · No Trips', component: States.NoTrips, type: 'mobile' },
      { id: 'sta-no-parcels', label: 'Empty · No Parcels', component: States.NoParcels, type: 'mobile' },
      { id: 'sta-no-drivers', label: 'Empty · No Drivers', component: States.NoDrivers, type: 'mobile' },
      { id: 'sta-no-notif', label: 'Empty · No Notifications', component: States.NoNotifications, type: 'mobile' },
      { id: 'sta-empty-wallet', label: 'Empty Wallet', component: States.EmptyWallet, type: 'mobile' },
      { id: 'sta-offline', label: 'Offline', component: States.OfflineScreen, type: 'mobile' },
      { id: 'sta-payment-fail', label: 'Payment Failed', component: States.PaymentFailed, type: 'mobile' },
      { id: 'sta-otp-wrong', label: 'OTP Incorrect', component: States.OTPIncorrect, type: 'mobile' },
      { id: 'sta-location', label: 'Location Disabled', component: States.LocationDisabled, type: 'mobile' },
      { id: 'sta-network', label: 'Network Error', component: States.NetworkError, type: 'mobile' },
    ],
  },
  {
    id: 'modals', label: 'MODALS & OVERLAYS', count: 0,
    screens: [
      { id: 'mod-confirm', label: 'Confirm Booking', component: Modals.ConfirmBooking, type: 'mobile' },
      { id: 'mod-cancel-booking', label: 'Cancel Booking', component: Modals.CancelBooking, type: 'mobile' },
      { id: 'mod-cancel-ride', label: 'Cancel Ride', component: Modals.CancelRide, type: 'mobile' },
      { id: 'mod-parcel', label: 'Parcel Details Modal', component: Modals.ParcelDetailsModal, type: 'mobile' },
      { id: 'mod-driver', label: 'Driver Details Modal', component: Modals.DriverDetailsModal, type: 'mobile' },
      { id: 'mod-rating', label: 'Rating Modal', component: Modals.RatingModal, type: 'mobile' },
      { id: 'mod-otp', label: 'OTP Modal', component: Modals.OTPModal, type: 'mobile' },
      { id: 'mod-scanner', label: 'QR Scanner Modal', component: Modals.QRScannerModal, type: 'mobile' },
      { id: 'mod-camera', label: 'Photo Capture Modal', component: Modals.PhotoCaptureModal, type: 'mobile' },
      { id: 'mod-pay-success', label: 'Payment Success', component: Modals.PaymentSuccessModal, type: 'mobile' },
      { id: 'mod-pay-fail', label: 'Payment Failed', component: Modals.PaymentFailedModal, type: 'mobile' },
      { id: 'mod-sheet', label: 'Quick Actions Sheet', component: Modals.QuickActionsSheet, type: 'mobile' },
    ],
  },
  {
    id: 'components', label: 'COMPONENT LIBRARY', count: 0,
    screens: [
      { id: 'lib-components', label: 'Full Component Library', component: Lib.ComponentLibrary, type: 'mobile' },
    ],
  },
]

// Set counts
GROUPS.forEach(g => { g.count = g.screens.length })
const TOTAL_SCREENS = GROUPS.reduce((sum, g) => sum + g.screens.length, 0)

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-start pt-4">
      <div
        className="relative overflow-hidden bg-white"
        style={{
          width: 375,
          height: 720,
          border: '2px solid #4b5563',
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        <div
          className="absolute top-0 left-1/2 bg-gray-600 z-10"
          style={{ width: 80, height: 6, borderRadius: 3, transform: 'translateX(-50%)', marginTop: 4 }}
        />
        <div className="h-full overflow-hidden" style={{ paddingTop: 2 }}>
          {children}
        </div>
      </div>
      <div className="mt-2 font-mono text-gray-400" style={{ fontSize: 8 }}>375 × 720 · MOBILE</div>
    </div>
  )
}

function DesktopFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col" style={{ minWidth: 900, maxWidth: 1100 }}>
      <div className="border-2 border-gray-500" style={{ borderRadius: 6, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <div className="bg-gray-200 px-3 py-1.5 flex items-center gap-2 border-b border-gray-300">
          <div className="flex gap-1.5">
            {['#e5e7eb', '#e5e7eb', '#e5e7eb'].map((c, i) => (
              <div key={i} className="border border-gray-300 rounded-full" style={{ width: 10, height: 10, background: c }} />
            ))}
          </div>
          <div className="flex-1 bg-white border border-gray-300 px-2 py-0.5 font-mono text-gray-500" style={{ fontSize: 8 }}>
            https://admin.parcelgo.com
          </div>
        </div>
        <div style={{ height: 600, overflow: 'hidden' }}>
          {children}
        </div>
      </div>
      <div className="mt-2 font-mono text-gray-400" style={{ fontSize: 8 }}>DESKTOP · ADMIN WEB</div>
    </div>
  )
}

export default function App() {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['auth']))
  const [activeScreen, setActiveScreen] = useState<ScreenDef>(GROUPS[0].screens[0])

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectScreen = (screen: ScreenDef, groupId: string) => {
    setActiveScreen(screen)
    setOpenGroups(prev => new Set([...prev, groupId]))
  }

  const ScreenContent = activeScreen.component

  return (
    <div className="flex h-full" style={{ fontFamily: "'Space Mono', monospace" }}>

      {/* Sidebar */}
      <div
        className="flex flex-col bg-gray-900 overflow-y-auto shrink-0"
        style={{ width: 240, borderRight: '1px solid #374151' }}
      >
        {/* Header */}
        <div className="px-3 py-3 border-b border-gray-800">
          <div className="font-mono font-bold text-white" style={{ fontSize: 11 }}>PARCELGO</div>
          <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>UX Wireframe System</div>
          <div className="font-mono text-gray-600 mt-0.5" style={{ fontSize: 7 }}>{TOTAL_SCREENS} screens · All Roles</div>
        </div>

        {/* Groups */}
        {GROUPS.map(group => (
          <div key={group.id}>
            <button
              className="w-full flex items-center justify-between px-3 py-2 border-b border-gray-800 text-left"
              style={{ background: 'transparent' }}
              onClick={() => toggleGroup(group.id)}
            >
              <div className="font-mono text-gray-400 font-bold" style={{ fontSize: 8 }}>
                {openGroups.has(group.id) ? '▼' : '▶'} {group.label}
              </div>
              <div className="font-mono text-gray-600" style={{ fontSize: 7 }}>{group.count}</div>
            </button>
            {openGroups.has(group.id) && (
              <div>
                {group.screens.map(screen => (
                  <button
                    key={screen.id}
                    className="w-full text-left px-4 py-1.5 border-b border-gray-800 font-mono"
                    style={{
                      fontSize: 9,
                      background: activeScreen.id === screen.id ? '#374151' : 'transparent',
                      color: activeScreen.id === screen.id ? '#fff' : '#9ca3af',
                      borderLeft: activeScreen.id === screen.id ? '2px solid #9ca3af' : '2px solid transparent',
                    }}
                    onClick={() => selectScreen(screen, group.id)}
                  >
                    {screen.label}
                    <span className="ml-1 text-gray-600" style={{ fontSize: 7 }}>
                      {screen.type === 'admin' ? '[WEB]' : '[MOB]'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Footer */}
        <div className="mt-auto px-3 py-3 border-t border-gray-800">
          <div className="font-mono text-gray-600" style={{ fontSize: 7 }}>
            Low-fidelity · Grayscale<br />
            UX Blueprint v1.0<br />
            © 2025 ParcelGo
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#EFEFEB' }}>
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 py-2 border-b border-gray-300 bg-white shrink-0"
          style={{ minHeight: 44 }}
        >
          <div>
            <div className="font-mono font-bold text-gray-800" style={{ fontSize: 10 }}>
              {activeScreen.label}
            </div>
            <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>
              Screen #{activeScreen.id} · {activeScreen.type === 'admin' ? 'Desktop / Admin Web' : 'Mobile · iOS & Android'}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-mono text-gray-400" style={{ fontSize: 8 }}>
              {activeScreen.type === 'mobile' ? '375 × 720' : '1280 × 720'}
            </div>
            <div className={`font-mono border px-2 py-0.5 ${activeScreen.type === 'admin' ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-400 text-gray-600'}`} style={{ fontSize: 7 }}>
              {activeScreen.type === 'admin' ? 'DESKTOP' : 'MOBILE'}
            </div>
          </div>
        </div>

        {/* Viewer */}
        <div className="flex-1 overflow-auto flex items-start justify-center" style={{ padding: '24px 32px' }}>
          {activeScreen.type === 'mobile' ? (
            <PhoneFrame>
              <ScreenContent />
            </PhoneFrame>
          ) : (
            <DesktopFrame>
              <ScreenContent />
            </DesktopFrame>
          )}
        </div>

        {/* Bottom info bar */}
        <div
          className="flex items-center justify-between px-6 py-1.5 border-t border-gray-300 bg-white shrink-0 font-mono text-gray-400"
          style={{ fontSize: 7 }}
        >
          <span>PARCELGO WIREFRAME SYSTEM · UX BLUEPRINT</span>
          <span>{TOTAL_SCREENS} SCREENS · 5 ROLES · GRAYSCALE ONLY</span>
          <span>SPACE MONO · TAILWIND CSS</span>
        </div>
      </div>
    </div>
  )
}
