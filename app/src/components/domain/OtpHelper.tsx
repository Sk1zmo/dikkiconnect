import { ShieldCheck } from '@phosphor-icons/react'
import type { CustodyGate } from '@/lib/custody'

/**
 * The "where do I find this code?" panel under every hand-off OTP input.
 *
 * It used to offer to show the code on this device, because on one phone
 * running a demo there was no second screen to read it off and the code was
 * derived locally anyway. Both halves of that are now gone: the server issues
 * the code to the party holding the parcel and never returns it to the party
 * about to type it. A button here that revealed it would be a button that
 * defeats the checkpoint, so what is left is the only thing this panel can
 * honestly do — name the screen the code is on, and say what is at stake.
 */
export function OtpHelper({ gate, source }: { gate: CustodyGate; source: string }) {
  return (
    <div className="mt-6 rounded-(--radius-lg) border border-ink-200 bg-white p-4">
      <p className="flex items-center gap-2 text-[13px] font-bold text-ink-800">
        <ShieldCheck size={15} className="text-brand-600" />
        Where is this code?
      </p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
        It&apos;s on {source}, and only on there — it was issued to them, not to you. Only that
        code opens this checkpoint.
      </p>
      <p className="mt-2 text-[12.5px] leading-relaxed font-semibold text-ink-700">
        {gate.locked
          ? 'This checkpoint is locked after too many wrong entries. Start the hand-off again.'
          : `${gate.attemptsLeft} attempt${gate.attemptsLeft === 1 ? '' : 's'} left before it locks.`}
      </p>
    </div>
  )
}
