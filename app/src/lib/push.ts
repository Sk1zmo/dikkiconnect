import { useEffect, useState, useSyncExternalStore } from 'react'
import type { NotificationItem } from './types'
import { tierOf, type NotificationTier } from './notifications'

/* ═══════════════════════════════════════════════════════════════════════════
   Delivery — how a notification reaches the phone.

   lib/notifications decides WHAT is said and how loud it may be; this file
   decides WHERE it lands:

     · App in the foreground → a live alert slides in at the top of the shell
       (LiveAlerts in components/layout). It is the Zepto/Rapido move: the
       thing that just happened is shown where you are looking, tap to go.
     · App in the background or closed → the operating system's tray, via
       Capacitor's local notifications on Android/iOS and the Notifications
       API on the web. Same title, same body, tap opens the same screen.
     · A future moment (the drop-off window closing, a pickup approaching)
       → scheduled with the OS, so it fires with the app killed.

   Preferences gate the two softer tiers (Settings); the custody tier is
   always delivered — those are the app doing its job. Permission is asked
   with a reason, once, after the first booking, never on launch.

   Remote push (a server waking the phone) is the same pipe with a different
   trigger; it needs FCM/APNs keys, which this build does not carry. Every
   call here would stay as is.
   ═══════════════════════════════════════════════════════════════════════════ */

const PREF_KEY = 'waypool.notify'

export interface NotifyPrefs {
  contextual: boolean
  marketing: boolean
  /** A copy of custody updates to the inbox — nothing to do with delivery here. */
  email: boolean
}

const DEFAULT_PREFS: NotifyPrefs = { contextual: true, marketing: false, email: true }

let prefs: NotifyPrefs = (() => {
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(localStorage.getItem(PREF_KEY) ?? '{}') as Partial<NotifyPrefs>) }
  } catch {
    return DEFAULT_PREFS
  }
})()
const prefListeners = new Set<() => void>()

export function setNotifyPrefs(patch: Partial<NotifyPrefs>) {
  prefs = { ...prefs, ...patch }
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs))
  } catch {
    /* in-memory only */
  }
  prefListeners.forEach((l) => l())
}

export function useNotifyPrefs(): NotifyPrefs {
  return useSyncExternalStore(
    (l) => {
      prefListeners.add(l)
      return () => prefListeners.delete(l)
    },
    () => prefs,
    () => prefs,
  )
}

const allowed = (tier: NotificationTier) =>
  tier === 'critical' || (tier === 'contextual' ? prefs.contextual : prefs.marketing)

/* ── Permission ─────────────────────────────────────────────────────────── */

export type Permission = 'granted' | 'denied' | 'prompt' | 'unsupported'

const isNative = () => Boolean((window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.())

export async function notificationPermission(): Promise<Permission> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const { display } = await LocalNotifications.checkPermissions()
      return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt'
    } catch {
      return 'unsupported'
    }
  }
  if (!('Notification' in window)) return 'unsupported'
  const p = Notification.permission
  return p === 'granted' ? 'granted' : p === 'denied' ? 'denied' : 'prompt'
}

export async function requestNotificationPermission(): Promise<Permission> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const { display } = await LocalNotifications.requestPermissions()
      return display === 'granted' ? 'granted' : 'denied'
    } catch {
      return 'unsupported'
    }
  }
  if (!('Notification' in window)) return 'unsupported'
  const p = await Notification.requestPermission()
  return p === 'granted' ? 'granted' : p === 'denied' ? 'denied' : 'prompt'
}

/** Live permission state, re-read when the tab regains focus (the user may have changed it in settings). */
export function useNotificationPermission() {
  const [state, setState] = useState<Permission>('prompt')
  useEffect(() => {
    let alive = true
    const read = () => notificationPermission().then((p) => alive && setState(p))
    read()
    window.addEventListener('focus', read)
    return () => {
      alive = false
      window.removeEventListener('focus', read)
    }
  }, [])
  return state
}

/* ── Foreground: live alerts ────────────────────────────────────────────── */

export const LIVE_ALERT_EVENT = 'waypool:alert'

export function pushLiveAlert(item: NotificationItem) {
  window.dispatchEvent(new CustomEvent<NotificationItem>(LIVE_ALERT_EVENT, { detail: item }))
}

/* ── Background: the OS tray ────────────────────────────────────────────── */

/** Numeric ids for the OS: a stable hash of the string id, so re-raising replaces. */
const numericId = (id: string) => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h) % 2_000_000_000
}

async function toTray(item: NotificationItem, at?: Date) {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const { display } = await LocalNotifications.checkPermissions()
      if (display !== 'granted') return
      await LocalNotifications.schedule({
        notifications: [
          {
            id: numericId(item.id),
            title: item.title,
            body: item.body,
            extra: { href: item.href ?? '/notifications', tier: tierOf(item) },
            schedule: at ? { at, allowWhileIdle: true } : undefined,
            channelId: tierOf(item) === 'critical' ? 'custody' : 'general',
          },
        ],
      })
    } catch {
      /* no tray on this platform; the inbox still has it */
    }
    return
  }
  if (at || !('Notification' in window) || Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    const opts: NotificationOptions = { body: item.body, tag: item.id, icon: '/apple-touch-icon.png', badge: '/icon-maskable.png', data: { href: item.href } }
    if (reg) await reg.showNotification(item.title, opts)
    else new Notification(item.title, opts)
  } catch {
    /* blocked or unsupported: the inbox still has it */
  }
}

/**
 * The one entry point the store calls. Foreground → live alert; background →
 * tray. Both go through the tier preferences.
 */
export function deliver(item: NotificationItem) {
  if (!allowed(tierOf(item))) return
  if (document.visibilityState === 'visible') pushLiveAlert(item)
  else void toTray(item)
}

/** A notification for later — fires from the OS whether the app is open or not. */
export function scheduleFor(at: Date, item: NotificationItem) {
  if (!allowed(tierOf(item))) return
  if (at.getTime() <= Date.now()) return deliver(item)
  void toTray(item, at)
}

/** Cancel anything scheduled for a booking that no longer needs it. */
export async function cancelScheduled(ids: string[]) {
  if (!isNative()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id: numericId(id) })) })
  } catch {
    /* nothing scheduled */
  }
}

/* ── Boot: channels, and what a tap does ────────────────────────────────── */

/**
 * Called once at start. Creates the Android channels (custody is
 * high-importance with sound; general is default) and routes a tap on a
 * tray notification to the screen it names.
 */
export async function initPush(navigate: (href: string) => void) {
  if (!isNative()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.createChannel({
      id: 'custody',
      name: 'Custody & payments',
      description: 'Parcels changing hands, OTPs and money — always on',
      importance: 5,
      visibility: 1,
      vibration: true,
    })
    await LocalNotifications.createChannel({
      id: 'general',
      name: 'Timely updates & offers',
      description: 'Pickup windows, matches on your route, occasional offers',
      importance: 3,
      visibility: 1,
    })
    await LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
      const href = (notification.extra as { href?: string } | undefined)?.href
      if (href) navigate(href)
    })
  } catch {
    /* plugin missing on this platform */
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Remote push — the server waking the phone.

   Everything above is triggered by this device. That covers the foreground
   alert and anything scheduled in advance, and it covers nothing at all for
   the case that matters most: a sender whose parcel is taken in at a hub
   three hours after they closed the app. They find out when they next open
   it, which for a fortnight-long test is the difference between engaged
   testers and silent ones.

   This registers the device with FCM and hands the token to the server. It
   is deliberately separate from `initPush`: permission for a remote push is
   asked after the first booking, with a reason, not on first launch when
   there is nothing to notify anybody about.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Registers for remote push and tells the server where to find this phone. */
export async function registerRemotePush(
  sendToken: (token: string, platform: string) => Promise<void>,
  navigate: (href: string) => void,
): Promise<'registered' | 'denied' | 'unavailable'> {
  if (!isNative()) return 'unavailable'
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    const existing = await PushNotifications.checkPermissions()
    const granted =
      existing.receive === 'granted'
        ? existing
        : await PushNotifications.requestPermissions()
    if (granted.receive !== 'granted') return 'denied'

    /* The token arrives asynchronously, on an event, which is why this
       cannot simply return it. */
    await PushNotifications.addListener('registration', (t) => {
      void sendToken(t.value, 'android')
    })

    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const href = (action.notification.data as { href?: string } | undefined)?.href
      if (href) navigate(href)
    })

    await PushNotifications.register()
    return 'registered'
  } catch {
    /* Plugin not installed, or no Firebase config in this build. Local
       notifications keep working either way. */
    return 'unavailable'
  }
}
