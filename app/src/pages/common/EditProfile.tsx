import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AtSign, Camera, Check, Phone, ShieldCheck, User } from 'lucide-react'
import { Screen, ScreenBody, TopBar } from '@/components/layout/Screen'
import {
  ActionBar,
  Avatar,
  Button,
  Card,
  Field,
  Note,
  Select,
  useToast,
} from '@/components/ui'
import { useApp } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { maskPhone } from '@/lib/format'

export default function EditProfile() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useApp()
  const { updateAccount } = useAuth()

  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [city, setCity] = useState('blr')
  const [saving, setSaving] = useState(false)

  const dirty = name !== user.name || email !== user.email

  const save = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      // Writes through to the account, so the new name shows on every parcel
      // and ride from here on.
      updateAccount({ name, email })
      toast.success('Profile updated')
      navigate('/profile')
    }, 1000)
  }

  return (
    <Screen>
      <TopBar back backTo="/profile" title="Edit profile" />

      <ScreenBody>
        {/* Photo */}
        <div className="flex flex-col items-center py-4">
          <div className="relative">
            <Avatar name={name || 'V'} size={92} />
            <button
              aria-label="Change photo"
              onClick={() => toast.info('Photo', 'Camera and gallery access in the native build.')}
              className="pressable-sm absolute -right-1 -bottom-1 grid size-9 place-items-center rounded-full bg-brand-600 text-white ring-4 ring-ink-50"
            >
              <Camera size={16} />
            </button>
          </div>
          <p className="mt-3 text-[12.5px] text-ink-500">Tap to change your photo</p>
        </div>

        <Card className="mt-2">
          <Field
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            prefix={<User size={15} />}
            hint="This is the name receivers and drivers see"
          />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            prefix={<AtSign size={15} />}
            hint="Invoices and receipts go here"
          />
          <Select
            label="Home city"
            value={city}
            onChange={setCity}
            options={[
              { value: 'blr', label: 'Bangalore, Karnataka' },
              { value: 'mys', label: 'Mysore, Karnataka' },
              { value: 'che', label: 'Chennai, Tamil Nadu' },
            ]}
          />
        </Card>

        {/* Locked fields */}
        <Card className="mt-3">
          <p className="mb-3 text-[12px] font-bold tracking-wide text-ink-400 uppercase">
            Verified details
          </p>
          <div className="flex items-center gap-3 rounded-(--radius-md) bg-ink-50 p-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-(--radius-sm) bg-white text-ink-600 shadow-(--shadow-e1)">
              <Phone size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold tracking-wide text-ink-400 uppercase">
                Mobile number
              </p>
              <p className="tabular mt-0.5 truncate text-[14px] font-bold text-ink-900">
                {maskPhone(user.phone)}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-[10.5px] font-bold text-success-700">
              <ShieldCheck size={11} />
              Verified
            </span>
          </div>
          <button
            onClick={() => toast.info('Change number', 'You will need to verify the new number by OTP.')}
            className="pressable-sm mt-2.5 text-[12.5px] font-bold text-brand-600"
          >
            Change mobile number
          </button>
        </Card>

        <Note tone="neutral" className="mt-3">
          Your KYC name comes from Aadhaar and cannot be edited here. To correct it, re-run
          verification from the Traveler KYC screen.
        </Note>
      </ScreenBody>

      <ActionBar>
        <Button
          block
          size="lg"
          loading={saving}
          disabled={!dirty || !name.trim()}
          onClick={save}
          icon={!saving ? <Check size={18} /> : undefined}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </ActionBar>
    </Screen>
  )
}
