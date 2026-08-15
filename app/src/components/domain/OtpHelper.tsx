import { Eye, KeyRound, ShieldCheck } from 'lucide-react'
import type { OtpGate } from '@/lib/otp'

/**
 * The "where do I find this code?" panel that sits under every handoff OTP
 * input. It names the screen the counterpart is holding, and — because a
 * single device can't show two people two screens at once — will disclose the
 * code on request. The check above it stays strict either way.
 */
export function OtpHelper({ gate, source }: { gate: OtpGate; source: string }) {
  if (gate.revealed) {
    return (
      <div className="anim-fade-in mt-6 rounded-(--radius-lg) border border-brand-100 bg-brand-50/70 p-4">
        <p className="flex items-center gap-2 text-[12px] font-bold tracking-wide text-brand-700 uppercase">
          <KeyRound size={13} /> This parcel&apos;s code
        </p>
        <p className="tabular text-display mt-2 text-[28px] leading-none font-extrabold tracking-[0.14em] text-brand-800">
          {gate.expected}
        </p>
        <p className="mt-2.5 text-[12px] leading-relaxed text-brand-800/80">
          Normally you&apos;d read this off {source}. It still has to be typed in correctly — any
          other code is rejected, and you have {gate.attemptsLeft} attempt
          {gate.attemptsLeft === 1 ? '' : 's'} left.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-(--radius-lg) border border-ink-200 bg-white p-4">
      <p className="flex items-center gap-2 text-[13px] font-bold text-ink-800">
        <ShieldCheck size={15} className="text-brand-600" />
        Where is this code?
      </p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
        It&apos;s on {source}. Only that code opens this checkpoint —{' '}
        {gate.attemptsLeft} attempt{gate.attemptsLeft === 1 ? '' : 's'} left before it locks.
      </p>
      <button
        onClick={gate.reveal}
        className="pressable-sm mt-3 inline-flex items-center gap-2 rounded-full border border-ink-200 px-3.5 py-2 text-[12.5px] font-bold text-ink-700 hover:bg-ink-50"
      >
        <Eye size={14} />
        Show it on this device
      </button>
    </div>
  )
}
