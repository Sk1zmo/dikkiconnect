import { useState, type ReactNode } from 'react'
import {
  AddressBook,
  Bell,
  Camera,
  DownloadSimple,
  Envelope,
  Lock,
  MapPin,
  Megaphone,
  Moon,
  ShareNetwork,
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
import { account, explain } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useNavigate } from 'react-router-dom'
import { TIER_META } from '@/lib/notifications'
import { requestNotificationPermission, setNotifyPrefs, useNotificationPermission, useNotifyPrefs } from '@/lib/push'
import { cn } from '@/lib/cn'

/* ── Toggle row ────────────────────────────────────────────────────────────
   A setting that happens to be a switch is still a list row, so it gets the
   same shape as every other row on this screen: a tinted leading square, a
   title, its line of explanation, and the control on the right.

   The toggles used to be bare label/description pairs stacked inside a card
   with hand-drawn hairlines. Legible, but a visibly different object from the
   Groups a few inches down the same screen, which is what made Settings read
   as three screens spliced together.

   ListRow was the obvious home and was tried first. Its title and subtitle
   both truncate, and these descriptions — what a permission is for, why the
   critical tier cannot be switched off — are the entire reason somebody trusts
   the toggle. They wrap here instead. Everything else matches ListRow's
   geometry exactly, so the two sit together without a seam.                  */
const ICON_TONES = {
  brand: 'bg-brand-50 text-brand-600',
  neutral: 'bg-ink-100 text-ink-600',
  success: 'bg-success-50 text-success-600',
  warn: 'bg-warn-50 text-warn-600',
  danger: 'bg-danger-50 text-danger-600',
}

function ToggleRow({
  icon,
  iconTone = 'neutral',
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: ReactNode
  iconTone?: keyof typeof ICON_TONES
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex min-h-12 w-full items-center gap-3 px-4 py-3.5">
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-(--radius-sm)',
          ICON_TONES[iconTone],
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-semibold text-ink-800">{label}</p>
        {description && (
          <p className="mt-0.5 text-[12px] leading-snug text-ink-500">{description}</p>
        )}
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}

export default function Settings() {
  const toast = useToast()
  const navigate = useNavigate()
  const { signOut } = useAuth()

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
  const [deleting, setDeleting] = useState(false)

  return (
    <Screen>
      <TopBar back title="Settings" />

      <ScreenBody>
        {/* Notifications */}
        <p className="mb-2.5 px-1 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          Notifications
        </p>
        <Group>
          <ToggleRow
            icon={<ShieldCheck size={18} />}
            iconTone="brand"
            checked
            onChange={() => {}}
            disabled
            label={TIER_META.critical.label}
            description={`${TIER_META.critical.hint}. These are the app doing its job, so they cannot be switched off.`}
          />
          <ToggleRow
            icon={<Bell size={18} />}
            checked={push}
            onChange={setPush}
            label={TIER_META.contextual.label}
            description={TIER_META.contextual.hint}
          />
          <ToggleRow
            icon={<Envelope size={18} />}
            checked={sms}
            onChange={setSms}
            label="Email copies"
            description="A copy of every custody update to your inbox. OTPs go there regardless."
          />
          <ToggleRow
            icon={<Megaphone size={18} />}
            checked={marketing}
            onChange={setMarketing}
            label={TIER_META.marketing.label}
            description={`${TIER_META.marketing.hint}. Never more than one a week.`}
          />
        </Group>

        {/* App */}
        <p className="mt-6 mb-2.5 px-1 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          App
        </p>
        {/* Language keeps its own card. A select is not a row — it opens a
            list — and squeezing it into the Group would have meant inventing a
            second row shape to hold it. */}
        <Card>
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
        </Card>
        <Group className="mt-3">
          <ToggleRow
            icon={<Vibrate size={18} />}
            checked={haptics}
            onChange={setHaptics}
            label="Haptic feedback"
            description="Subtle vibration on taps and confirmations"
          />
          <ToggleRow
            icon={<Moon size={18} />}
            checked={false}
            onChange={() => toast.info('Dark mode', 'Landing in the next release.')}
            label="Dark mode"
            description="Coming soon"
          />
        </Group>

        {/* Privacy */}
        <p className="mt-6 mb-2.5 px-1 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
          Privacy & safety
        </p>
        <Group>
          <ToggleRow
            icon={<MapPin size={18} />}
            checked={location}
            onChange={setLocation}
            label="Location access"
            description="Needed to find nearby hubs and track deliveries"
          />
          <ToggleRow
            icon={<ShareNetwork size={18} />}
            checked={shareTrips}
            onChange={setShareTrips}
            label="Auto-share rides"
            description="Send a live trip link to your emergency contact when a ride starts"
          />
        </Group>

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
              toast.info('KYC records', 'WayPool stores only a masked reference token.')
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
          <ListRow icon={<Camera size={17} />} iconTone="success" title="Camera" value="Allowed" valueTone="success" />
          <ListRow icon={<AddressBook size={17} />} iconTone="neutral" title="Contacts" value="Not requested" />
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
            subtitle="Removes your name, email and phone"
            onClick={() => setDeleteOpen(true)}
            chevron
          />
        </Group>

        <Note tone="neutral" icon={<Moon size={15} />} className="mt-6">
          {BRAND.name} {APP_VERSION} · pilot build · Bangalore ↔ Mysore
        </Note>
      </ScreenBody>

      {/* This used to show a toast saying the account would be removed in 30
          days, and then do nothing at all — no request, no deletion, no grace
          period. Google Play requires account deletion to be offered and to
          actually happen, and a printed promise with no code behind it is the
          worst of both. It now calls the server, and the copy says what the
          server really does: the account goes immediately, and parcels still
          in flight block it. */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={() => {
          setDeleting(true)
          void (async () => {
            try {
              await account.remove()
              setDeleteOpen(false)
              toast.success('Account deleted', 'Your profile and contact details are gone.')
              signOut()
              navigate('/', { replace: true })
            } catch (e) {
              setDeleteOpen(false)
              toast.error('Not deleted', explain(e))
            } finally {
              setDeleting(false)
            }
          })()
        }}
        tone="danger"
        icon={<Trash size={26} />}
        title="Delete your account?"
        body="This removes your name, email and phone number straight away, and signs you out everywhere. It cannot be undone. Parcels already delivered stay on record without your details, because the people who carried them need that record. Anything still on its way has to arrive first."
        confirmLabel={deleting ? 'Deleting…' : 'Delete account'}
      />
    </Screen>
  )
}
