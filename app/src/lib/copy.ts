/* ═══════════════════════════════════════════════════════════════════════════
   Microcopy — the voice, and every line the edge states say.

   The voice, in five rules:

     1. Say what happened, in the first sentence. Not "Oops!", not "Uh-oh":
        "Your connection dropped." A person with a parcel in a stranger's car
        wants a fact before a feeling.
     2. Say what to do next, and make that the button. If there is nothing to
        do, say when it will be over.
     3. Loading tells you what it is doing, not that it is doing something.
        "Finding the closest hubs" beats "Loading" every time, because a wait
        you understand is a wait you tolerate.
     4. Personality lives in empties and successes — the moments nobody is
        anxious. Errors and anything touching money, custody or OTPs stay
        plain. A joke on a payment failure reads as not taking it seriously.
     5. One idea per line, no exclamation marks, contractions welcome. Written
        for somebody reading at a door, on a bus, in the sun.

   Everything below is data so the tone cannot drift screen by screen; the
   components under components/ui read from here, and a screen with a state
   these do not cover adds its line here rather than inline.
   ═══════════════════════════════════════════════════════════════════════════ */

import { BRAND } from './brand'

/* ── Loading: "what is happening" and, where it helps, "what to expect" ─── */

export type LoadingContext =
  | 'app'
  | 'screen'
  | 'search'
  | 'hubs'
  | 'rides'
  | 'map'
  | 'booking'
  | 'payment'
  | 'verify'
  | 'code'
  | 'tracking'
  | 'wallet'
  | 'messages'
  | 'photos'

export const LOADING: Record<LoadingContext, { line: string; sub?: string }> = {
  app: { line: 'Getting things ready' },
  screen: { line: 'One moment' },
  search: { line: 'Finding cars already going your way' },
  hubs: { line: 'Finding the closest hubs', sub: 'Measured along the road, not as the crow flies' },
  rides: { line: 'Checking who is driving that route' },
  map: { line: 'Drawing the route' },
  booking: { line: 'Reserving your space', sub: 'Confirming the hub, then holding the price' },
  payment: { line: 'Talking to your bank', sub: 'Don’t close the app — this takes a few seconds' },
  verify: { line: 'Checking that code' },
  code: { line: 'Sending your code', sub: 'It goes to your inbox, not by SMS' },
  tracking: { line: 'Catching up with your parcel' },
  wallet: { line: 'Adding it up' },
  messages: { line: 'Fetching the conversation' },
  photos: { line: 'Uploading the handover photo', sub: 'This is your proof, so we wait for it' },
}

/* ── Quotes: the line under the mark while you wait ─────────────────────────
   TIPS teach; these do not. A quote's whole job is to make three hundred
   milliseconds of nothing feel like part of the product rather than a gap in
   it, so each one is short enough to finish reading at a glance — nine words
   is the ceiling — and says something true about how this network works.

   They are grouped by what is being waited for, because a line about shared
   fuel under a payment spinner is noise. Every loading context maps to a
   family; the family is chosen at random within itself, so the same wait
   twice is rarely the same line twice.
   ═══════════════════════════════════════════════════════════════════════════ */

export type QuoteFamily = 'parcel' | 'ride' | 'payment' | 'hub' | 'auth' | 'general'

export const QUOTES: Record<QuoteFamily, string[]> = {
  parcel: [
    'Somebody’s boot is already going your way.',
    'Empty space is the cheapest thing on the road.',
    'Your parcel is hitching a ride, not booking one.',
    'One car. Two errands.',
    'Nothing new is on the road because of you.',
  ],
  ride: [
    'Same road, split fare.',
    'Four seats. Finally, four people.',
    'The road is cheaper when it is shared.',
    'Someone is driving there anyway.',
  ],
  payment: [
    'Money moves slower than parcels.',
    'Counting it twice, so you don’t have to.',
    'Banks keep their own hours.',
  ],
  hub: [
    'A shelf, a scan, a signature.',
    'Every parcel sleeps somewhere.',
    'Custody is a chain, not a promise.',
  ],
  auth: ['Six digits between you and the road.', 'Checking it’s really you.'],
  general: ['Move more. Together.', 'Store. Travel. Freely.', 'Getting out of your way.'],
}

/** Which family of quotes a given wait draws from. */
export const QUOTE_FAMILY: Record<LoadingContext, QuoteFamily> = {
  app: 'general',
  screen: 'general',
  search: 'ride',
  hubs: 'hub',
  rides: 'ride',
  map: 'ride',
  booking: 'parcel',
  payment: 'payment',
  verify: 'auth',
  code: 'auth',
  tracking: 'parcel',
  wallet: 'payment',
  messages: 'general',
  photos: 'hub',
}

/* ── Empty: nothing here, and what would put something here ─────────────── */

export type EmptyKind =
  | 'parcels'
  | 'parcels-done'
  | 'rides'
  | 'rides-done'
  | 'trips'
  | 'jobs'
  | 'search'
  | 'search-results'
  | 'notifications'
  | 'messages'
  | 'wallet'
  | 'inventory'
  | 'history'
  | 'places'
  | 'articles'
  | 'generic'

export const EMPTY: Record<EmptyKind, { title: string; body: string; action?: string }> = {
  parcels: {
    title: 'Nothing on the road yet',
    body: 'Book your first parcel and it will show up here, with every checkpoint as it happens.',
    action: 'Book a parcel',
  },
  'parcels-done': {
    title: 'No deliveries closed yet',
    body: 'Delivered parcels move here with their full custody chain — handy if anything is ever disputed.',
  },
  rides: {
    title: 'No seat booked yet',
    body: 'Someone is already driving your route. Find them and split the fuel.',
    action: 'Find a ride',
  },
  'rides-done': {
    title: 'No trips taken yet',
    body: 'Your past rides and their receipts will collect here.',
  },
  trips: {
    title: 'You haven’t posted a trip',
    body: 'Post the drive you are already making. Parcels and passengers find you, not the other way round.',
    action: 'Post a trip',
  },
  jobs: {
    title: 'Nothing matches those filters',
    body: 'Loosen a filter or two — parcels come and go through the day.',
    action: 'Clear filters',
  },
  search: {
    title: 'Where are you headed?',
    body: 'Pick two cities and a day. We will show you who is already driving that way.',
  },
  'search-results': {
    title: 'Nobody is driving that yet',
    body: 'Try the day before or after, or leave a request and we will tell you the moment a car is posted.',
    action: 'Try another day',
  },
  notifications: {
    title: 'All quiet',
    body: 'Custody updates, OTPs and ETAs land here the moment they happen. Nothing needs you right now.',
  },
  messages: {
    title: 'No conversations yet',
    body: 'Once you book a ride you can message the driver here — for the gate code, the landmark, the “I’m outside”.',
  },
  wallet: {
    title: 'Nothing has moved yet',
    body: 'Top up once and pay for parcels and rides in a tap. Refunds land here too.',
    action: 'Add money',
  },
  inventory: {
    title: 'Shelves are clear',
    body: 'Every parcel that comes through the counter is logged here until a traveler carries it on.',
  },
  history: {
    title: 'No history yet',
    body: 'Completed hand-offs and pickups are kept here, OTP by OTP.',
  },
  places: {
    title: 'No saved places',
    body: 'Save home and work once and never type the flat number again.',
    action: 'Add a place',
  },
  articles: {
    title: 'No article covers that',
    body: 'Try a shorter search, or ask us directly — a person answers within the hour.',
    action: 'Message support',
  },
  generic: {
    title: 'Nothing here yet',
    body: 'When there is, it will be here.',
  },
}

/* ── Errors: plain, specific, and always with a way out ─────────────────── */

export type ErrorKind = 'crash' | 'chunk' | 'network' | 'server' | 'timeout' | 'payment' | 'action' | 'permission-camera' | 'permission-location' | 'maintenance' | 'notfound'

export const ERROR: Record<ErrorKind, { title: string; body: string; action: string; secondary?: string }> = {
  crash: {
    title: 'Something went wrong on our side',
    body: 'That screen hit an error it could not recover from. Nothing you booked is affected.',
    action: 'Try again',
    secondary: 'Go home',
  },
  chunk: {
    title: `A newer ${BRAND.name} is ready`,
    body: 'The app updated while you were using it and this screen belongs to the old version. A reload picks up the new one.',
    action: 'Reload',
  },
  network: {
    title: 'You’re offline',
    body: 'We are showing what we last synced. Anything you do now will send once you are back.',
    action: 'Try again',
  },
  server: {
    title: 'We couldn’t reach the server',
    body: 'It is on our side, not yours. Give it a moment and try again — your booking is safe.',
    action: 'Try again',
  },
  timeout: {
    title: 'That took too long',
    body: 'The connection is slow enough that we stopped waiting. Try again, or move somewhere with better signal.',
    action: 'Try again',
  },
  payment: {
    title: 'Payment didn’t go through',
    body: 'Your bank declined or timed out. You have not been charged. Try again, or pay another way.',
    action: 'Try again',
    secondary: 'Pay another way',
  },
  action: {
    title: 'That didn’t save',
    body: 'Check your connection and try once more. Nothing was changed.',
    action: 'Try again',
  },
  'permission-camera': {
    title: 'Camera access is off',
    body: 'Scanning a parcel’s QR needs the camera. Allow it in your phone’s settings, or type the parcel ID instead.',
    action: 'Type the ID',
  },
  'permission-location': {
    title: 'Location is off',
    body: 'Without it we cannot snap you to the nearest hub. Allow it in settings, or type your address.',
    action: 'Type an address',
  },
  maintenance: {
    title: 'Back in a few minutes',
    body: `${BRAND.name} is being updated. Parcels already on the road are unaffected; bookings resume shortly.`,
    action: 'Check again',
  },
  notfound: {
    title: 'This road doesn’t go anywhere',
    body: 'The page moved, or the link was typed by someone in a hurry. Nothing of yours is lost.',
    action: 'Take me home',
    secondary: 'Report a broken link',
  },
}

/* ── Network banners ────────────────────────────────────────────────────── */

export const NETWORK = {
  offline: 'You’re offline — showing your last synced data',
  slow: 'Slow connection — things may take a moment',
  back: 'Back online',
}

/* ── Tips: a small true thing to read while you wait ────────────────────
   Shown under a loader only once the wait has lasted a beat (a quick load
   never shows one — a tip you cannot finish reading is worse than none), and
   rotated so a long wait is not one line staring back. Each is a fact about
   how the network works, not a slogan. */

export const TIPS: string[] = [
  'Every hand-off is an OTP and a photo. That chain is yours to keep, even after delivery.',
  'The car carrying your parcel was already making the trip. Nothing new is on the road because of you.',
  'Hub to hub is the cheapest way to send. Door to door pays for the detour.',
  'Declared value is capped at ₹5,000 — that is what the insurance covers.',
  'A traveler needs an Aadhaar-verified account to carry parcels, and a licence check to carry people.',
  'Hubs hold a parcel for 24 hours. After that the slot is released and you are told.',
  'Your receiver gets their own OTP. Nobody collects a parcel by knowing the sender.',
  'Rides are cost-shared, not a taxi: the fare is the fuel and tolls, split.',
  'Location is used only while a trip or parcel is in progress. Background tracking is off.',
  'Refunds land in the wallet first, so a cancelled booking is money you can use straight away.',
]

/* ── Success: earned, short, and pointing at what is next ───────────────── */

export const SUCCESS = {
  booked: { title: 'Booked', body: 'Your parcel has a car. Drop it at the hub and the rest is on us.' },
  paid: { title: 'Paid', body: 'The receipt is in your wallet.' },
  handed: { title: 'Handed over', body: 'Custody moved, OTP verified. You can put the phone away.' },
  delivered: { title: 'Delivered', body: 'Loop closed. Thanks for trusting a stranger’s boot.' },
  rideDone: { title: 'You’re there', body: 'Fuel split, driver rated. Same again next week?' },
  saved: { title: 'Saved', body: 'That will be here next time.' },
  signedOut: { title: 'Signed out', body: 'See you on the road.' },
}
