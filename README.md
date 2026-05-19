# Participant Registration App

A full-stack event registration and attendance management system for development-sector programmes.

## What the app does

Manages the full participant lifecycle for multi-day events: pre-registration, walk-in registration, attendance signing with digital signatures, QR-based check-in, PDF/certificate export, and cross-event dashboard reporting.

## Main user flows

1. **Admin creates event** → All Events Dashboard → + New Event
2. **Pre-registration** → Admin shares Pre-reg Link → participants fill form before the event
3. **Event day** → Staff open Registration Desk → search by code/name/phone, register walk-ins, sign attendance
4. **Self-service check-in** → Participants scan Check-in QR → enter code → sign
5. **Monitoring** → Attendance Monitor shows who hasn't signed for a given day
6. **Export** → PDF attendance register with signatures, QR cards, certificates (3 templates)

## Pages and their purpose

| File | Purpose |
|---|---|
| `admin.html` | All Events Dashboard — create and manage events |
| `event.html` | Event Admin Panel — one event's participants, exports, actions |
| `index.html` | Pre-Registration Form — public form shared before events |
| `register.html` | Registration Desk — event-day search, walk-in, attendance signing |
| `checkin.html` | Event Check-in — self-service QR scan and sign |
| `unsigned.html` | Attendance Monitor — per-day not-yet-signed list |
| `dashboard.html` | Portfolio Stats — cross-event analytics |
| `edit-event.html` | Edit Event — update event details |
| `edit-participants.html` | Edit Participants — correct participant records |
| `sign.html` | Sign Attendance — individual participant signing |
| `help.html` | Help — per-form guidance |

## Supabase tables

- `events` — event details, signatory info, MEL question
- `participants` — registrant details, code, reg_type
- `attendance` — one row per participant per day, with signature URL

## Required storage bucket

Create a public bucket named `signatures` in Supabase Storage.

## Deployment

- **Production**: `participants-app-five.vercel.app` (metsslbg-stack GitHub → Vercel)
- **Production backup**: `metsslbg-stack.github.io/participants-app`
- **Staging**: `mashiteye.github.io/participants-app`

## Supabase projects

- **Production**: `cpqhljqwxjgscdoepant.supabase.co` (metsslbg-stack)
- **Staging**: `hcdgrdkahowzestlpges.supabase.co` (mashiteye)

## Admin password

Default: `METSSLBG` (SHA-256 hashed in app code). Change before selling.

## External services

- **Email**: Cloudflare Worker (`participants-email.metsslbg.workers.dev`) → Resend API
- **QR codes**: `api.qrserver.com` (free, no key needed)
- **PDF**: jsPDF + jspdf-autotable (CDN)

## Known limitations

- Admin password is app-layer only — no Supabase Auth
- Signatures stored in public bucket (URLs are UUID-based and not guessable)
- Splash screen shows once per browser session via sessionStorage

## Recovery

If the app stops working after a push, check:
1. `github.com/metsslbg-stack/participants-app/actions` — deployment status
2. `supabase.com/dashboard/project/cpqhljqwxjgscdoepant` — table and storage health
3. Browser DevTools Console for JS errors
