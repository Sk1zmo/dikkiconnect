import { useState } from 'react'
import {
  Bell,
  DownloadSimple,
  Globe,
  Lock,
  MapPin,
  Moon,
  ShieldCheck,
  Trash,
  Vibrate,
} from '@phosphor-icons/react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  Card,
  ConfirmDialog,
  Group,
  ListRow,
  Note,
  Select,
  Switch,
  useToast,
} from '@/components/ui'
import { APP_VERSION, BRAND } from '@/lib/brand'
import { TIER_META } from '@/lib/notifications'
import { requestNotificationPermission, setNotifyPrefs, useNotificationPermission, useNotifyPrefs } from '@/lib/push'

export default function Settings() {
  const toast = useToast()

  const prefs = useNotifyPrefs()
  const permission = useNotificationPermission()
  const push = prefs.contextual
  const sms = prefs.email
  const marketing = prefs.marketing
  const setPush = (v: boolean) => setNotifyPrefs({ contextual: v })
  const setSms = (v: boolean) => setNotifyPrefs({ email: v })
  const setMarketing = (v: boolean) => setNotifyPrefs({ marketing: v })
  const [haptics, setHaptics] = useState(true)
  const [location, setLocation] = useState(true)
  const [shareTrips, setShareTrips] = useState(true)
  const [language, setLanguage] = useState('en')
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <Screen>
      <TopBar back title="Settings" />

      <ScreenBody>
        {/* Notifications */}
        <p className="mb-2.5 px-1 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          Notifications
        </p>
        <Card className="flex flex-col gap-4">
          <Switch
            checked
            onChange={() => {}}
            disabled
            label={TIER_META.critical.label}
            description={`${TIER_META.critical.hint}. These are the app doing its job, so they cannot be switched off.`}
          />
          <div className="h-px bg-ink-100" />
          <Switch
            checked={push}
            onChange={setPush}
            label={TIER_META.contextual.label}
            description={TIER_META.contextual.hint}
          />
          <div className="h-px bg-ink-100" />
          <Switch
            checked={sms}
            onChange={setSms}
            label="Email copies"
            description="A copy of every custody update to your inbox. OTPs go there regardless."
          />
          <div className="h-px bg-ink-100" />
          <Switch
            checked={marketing}
            onChange={setMarketing}
            label={TIER_META.marketing.label}
            description={`${TIER_META.marketing.hint}. Never more than one a week.`}
          />
        </Card>

        {/* App */}
        <p className="mt-6 mb-2.5 px-1 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          App
        </p>
        <Card className="flex flex-col gap-4">
          <Select
            label="Language"
            value={language}
            onChange={setLanguage}
            options={[
              { value: 'en', label: 'English' },
              { value: 'kn', label: 'ಕನ್ನಡ · Kannada' },
              { value: 'hi', label: 'हिन्दी · Hindi' },
              { value: 'ta', label: 'தமிழ் · Tamil' },
              { value: 'te', label: 'తెలుగు · Telugu' },
            ]}
          />
          <div className="h-px bg-ink-100" />
          <Switch
            checked={haptics}
            onChange={setHaptics}
            label="Haptic feedback"
            description="Subtle vibration on taps and confirmations"
          />
          <div className="h-px bg-ink-100" />
          <Switch
            checked={false}
            onChange={() => toast.info('Dark mode', 'Landing in the next release.')}
            label="Dark mode"
            description="Coming soon"
          />
        </Card>

        {/* Privacy */}
        <p className="mt-6 mb-2.5 px-1 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          Privacy & safety
        </p>
        <Card className="flex flex-col gap-4">
          <Switch
            checked={location}
            onChange={setLocation}
            label="Location access"
            description="Needed to find nearby hubs and track deliveries"
          />
          <div className="h-px bg-ink-100" />
          <Switch
            checked={shareTrips}
            onChange={setShareTrips}
            label="Auto-share rides"
            description="Send a live trip link to your emergency contact when a ride starts"
          />
        </Card>

        <Group className="mt-3">
          <ListRow
            icon={<ShieldCheck size={17} />}
            title="Data & privacy"
            subtitle="What we collect and why"
            onClick={() => toast.info('Privacy policy', 'Opening in your browser…')}
            chevron
          />
          <ListRow
            icon={<DownloadSimple size={17} />}
            title="Download my data"
            subtitle="A copy of everything, emailed to you"
            onClick={() => toast.success('Request received', 'We will email your archive within 48 hours.')}
            chevron
          />
          <ListRow
            icon={<Lock size={17} />}
            title="Aadhaar & KYC records"
            subtitle="Managed by our licensed KYC partner"
            onClick={() =>
              toast.info('KYC records', 'Stowza stores only a masked reference token.')
            }
            chevron
          />
        </Group>

        {/* Permissions status */}
        <p className="mt-6 mb-2.5 px-1 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          Device permissions
        </p>
        <Group>
          <ListRow
            icon={<MapPin size={17} />}
            iconTone={location ? 'success' : 'danger'}
            title="Location"
            value={location ? 'Allowed' : 'Blocked'}
            valueTone={location ? 'success' : 'danger'}
          />
          <ListRow
            icon={<Bell size={17} />}
            iconTone={permission === 'granted' ? 'success' : permission === 'denied' ? 'danger' : 'neutral'}
            title="Notifications"
            subtitle={
              permission === 'denied'
                ? 'Blocked in your phone’s settings — custody updates stay in the inbox'
                : permission === 'prompt'
                  ? 'Tap to allow custody updates on the lock screen'
                  : undefined
            }
            value={permission === 'granted' ? 'Allowed' : permission === 'denied' ? 'Blocked' : permission === 'prompt' ? 'Not yet' : 'n/a'}
            valueTone={permission === 'granted' ? 'success' : permission === 'denied' ? 'danger' : undefined}
            onClick={permission === 'prompt' ? () => void requestNotificationPermission() : undefined}
            chevron={permission === 'prompt'}
          />
          <ListRow icon={<Globe size={17} />} iconTone="success" title="Camera" value="Allowed" valueTone="success" />
          <ListRow icon={<Vibrate size={17} />} iconTone="neutral" title="Contacts" value="Not requested" />
        </Group>

        {/* Danger zone */}
        <p className="mt-6 mb-2.5 px-1 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          Danger zone
        </p>
        <Group>
          <ListRow
            icon={<Trash size={17} />}
            iconTone="danger"
            title="Delete my account"
            subtitle="Permanently removes your data"
            onClick={() => setDeleteOpen(true)}
            chevron
          />
        </Group>

        <Note tone="neutral" icon={<Moon size={15} />} className="mt-6">
          {BRAND.name} {APP_VERSION} · pilot build · Bangalore ↔ Mysore
        </Note>
      </ScreenBody>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false)
          toast.warn('Deletion scheduled', 'Your account will be removed in 30 days. Sign in to cancel.')
        }}
        tone="danger"
        icon={<Trash size={26} />}
        title="Delete your account?"
        body="This removes your profile, bookings and payment methods after a 30-day grace period. Active parcels must be delivered first."
        confirmLabel="Delete account"
      />
    </Screen>
  )
}
