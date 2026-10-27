# Push notifications — what's built, what you still need

Written for: you, finishing the Firebase setup.

The whole chain is built and deployed. It is inert until one credential
exists, and it says so rather than pretending: `/api/push/register` returns
`deliverable: false` while there is no Firebase service account, so the app
never promises a notification it cannot send.

---

## Done

| | Item | Where |
|---|---|---|
| ✅ | `@capacitor/push-notifications` installed; `POST_NOTIFICATIONS` declared in the APK | verified with `aapt2 dump badging` |
| ✅ | Device registers with FCM on sign-in and sends its token to the server | `src/lib/push.ts` → `registerRemotePush` |
| ✅ | `POST /api/push/register` stores up to 8 devices per account, de-duplicated | re-registering the same token is a no-op |
| ✅ | `DELETE /api/push/register` forgets a device | |
| ✅ | FCM **HTTP v1** sender — JWT signed from a service account, access token cached for the hour | `api/_lib/fcm.ts` |
| ✅ | Dead tokens pruned automatically | FCM's `UNREGISTERED` means that phone is gone; a store that only grows spends its sends on phones that will never answer |
| ✅ | Every custody checkpoint notifies the sender; hand-off and arrival also notify the traveller | `api/_lib/notify.ts` |
| ✅ | Tapping a notification opens the parcel it is about | `href` rides in the data payload |
| ✅ | A failed push can never fail a hand-off | every call is `void`, every error swallowed, and the 40/40 smoke still passes with push unconfigured |
| ✅ | Permission asked **after sign-in**, in context — not on a cold first launch | |

## What only you can do

| | Item | Why |
|---|---|---|
| 🔑 | **Create a Firebase project** at console.firebase.google.com, add an Android app with package `in.waypool.app` | |
| 🔑 | **Download `google-services.json`** → put it at `app/android/app/google-services.json` | Capacitor's Gradle config already applies the plugin only if this file exists, so builds work with or without it |
| 🔑 | **Create a service account** → Project settings → Service accounts → Generate new private key | This is what lets the server send |
| 🔑 | **Add it to Vercel** as one env var | see below |

```powershell
cd app
# Paste the ENTIRE contents of the downloaded JSON when prompted:
vercel env add FCM_SERVICE_ACCOUNT production
vercel --prod
```

The sender handles the `\n` escaping inside the private key itself — env vars
cannot hold real newlines, and without that fix the signer rejects the key
with an error that says nothing about newlines.

## Verifying it works

1. `curl https://dikkiconnect-mail.vercel.app/api/ops -H "X-Ops-Key: <yours>"` —
   no new warning means the service account parsed
2. Sign in on a phone, accept the notification prompt
3. On a second device, take that parcel through a custody step
4. The first phone should buzz within a second or two

If nothing arrives, the event log at `/ops` will show the custody step
succeeded — push failing silently is by design, so the log is where to look.

## Deliberately not done

- **iOS / APNs.** Needs the $99 Apple account and a Mac. The code path is
  shared, so it is a credential away, not a rewrite.
- **Marketing pushes.** The preference toggle exists and is respected for
  local notifications. Nothing sends them, and nothing should until you have
  something worth saying.
- **A notification when a job appears on a traveller's corridor.** The most
  valuable push in the product and the one that needs matching logic that
  does not exist yet.

---

## One thing that changed, that you should know about

Adding push took the API to **13 serverless functions**. Vercel's Hobby plan
allows **12**, and the deploy was rejected.

Rather than pay $20/month today, `POST /api/parcels/claim` was folded into
`POST /api/parcels?claim=1`. Behaviour is identical — the claim race is still
decided by a single atomic `SET NX`, and the smoke test still proves that two
simultaneous claims produce exactly one winner. It is a routing shape traded
for a feature, which is the right way round.

**You are now at the ceiling.** The next route needs Vercel Pro. You will need
it anyway: the Hobby tier is for non-commercial projects, so the moment WayPool
takes real money, $20/month stops being optional.
