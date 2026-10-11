# SHIVIDNIPHEEDU

Official website for **SHIVIDNI PHEEDU**, a Halloween event co-hosted by the Faculty of Commerce and Accountancy, the Faculty of Engineering, and the Faculty of Communication Arts, Chulalongkorn University.

Attendees register, receive a QR ticket, book the **Escape Room** and **Haunted House**, and explore the event from their phones. Staff check people in by scanning QR codes, run each activity's rounds and walk-ins, and export lists to Excel.

---

## Features

### For attendees

| Feature | Description |
| --- | --- |
| **Registration** | 3-step form (event info → personal details → PDPA consent) with inline validation |
| **Email confirmation** | Confirmation email with the QR ticket attached (optional, see [Email](#email-optional)) |
| **Student ID login** | Log in with a student ID, no password. A signed httpOnly cookie (14 days) says who is logged in; identity is checked against the student card at the desk |
| **My Ticket** | QR code for event entry plus live check-in status. Shows the copy saved on the phone first, so it opens with no signal |
| **Escape Room booking** | 3 steps: room rules → pick a round → team of 1–4 (student ID, phone, email per player; names come from registration). 9 rounds, 12 online + 3 walk-in seats each |
| **Haunted House booking** | 3 steps: house rules → pick a round → nickname + phone (faculty, year, email come from registration). 11 rounds, 15 online + 10 walk-in seats, solo, can't be changed |
| **My booking** | Paper note with the check-in window and countdown, big QR ticket, team list. Escape Room leaders change round, remove members or cancel; anyone cancels their own seat. Opens on a new phone from the login alone |
| **Booking emails** | Confirmation with each player's own code and QR, change/cancel notices, and a reminder 10 minutes before check-in opens on event day |
| **Pick a Boo** | 5-question quiz that picks one of 4 boos (boo-pid, boo-ming cash, boo-kworm, boo-ster) and reveals its letter on a result card; the result is saved to the account and shown on the menu |
| **Event Map** | Venue map and student vendor booth list *(content not yet updated for this event)* |
| **Event Schedule** | Main stage line-up from 17:33 (bands, dance, collab), the 19:30 outdoor movie with its poster, and the night's activities |

### For staff (`/admin`)

The password decides which dashboard opens.

- **Registration team** (`/admin`): attendance table with search and stats, camera QR scanner for event entry (works on iPhone Safari), **Download Excel** of every registration
- **Escape Room / Haunted House** (`/admin/escape-room`, `/admin/haunted-house`): five tabs
  - **Check-in**: scan the booking QR or search by name / student ID, inside the round's check-in window only
  - **List**: everyone in each round with their status
  - **Overview**: every round's seats, refreshed every 5 s, Excel export (Haunted House: one sheet per round)
  - **Walk-in**: add walk-ins; a free seat checks them in, otherwise they queue
  - **Rounds**: change a round's seats or close it (not once its check-in has opened)

Missing check-in releases the seat to walk-ins automatically.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, FC Iconic + Monster Fiesta fonts |
| Database | Supabase (PostgreSQL); booking rules live in SQL functions, reminders run on `pg_cron` |
| QR codes | `qrcode` (generate), `jsqr` (scan) |
| Excel export | `exceljs` (loaded on demand in the browser) |
| Email | Nodemailer via Gmail SMTP |
| Hosting | Vercel |

---

## Getting started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io)
- A Supabase project

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up the database

In the Supabase dashboard, open **SQL Editor** and run these files in order (each is safe to re-run):

| File | What it adds |
| --- | --- |
| [`complete-schema.sql`](supabase/complete-schema.sql) | `registrations` table, indexes, policies |
| [`lockdown-registrations.sql`](supabase/lockdown-registrations.sql), [`travel-report.sql`](supabase/travel-report.sql) | Registration access rules, travel report |
| [`booking-schema.sql`](supabase/booking-schema.sql) | Booking tables, views and every booking rule (book, change, cancel, check-in, walk-in), Escape Room data |
| [`haunted-house.sql`](supabase/haunted-house.sql) | Haunted House rounds and its extra fields |
| [`booking-view.sql`](supabase/booking-view.sql) | `booking_view()`: My booking in one call |
| [`reminders.sql`](supabase/reminders.sql) | Check-in reminder emails: the claim function and the event-day `pg_cron` job (needs `CRON_SECRET`, below) |

### 3. Configure environment variables

Create `.env.local` in the project root:

```bash
# Supabase (Dashboard → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Staff passwords, one per group (the password decides which dashboard opens)
ADMIN_PASSWORD=choose-a-strong-password            # registration team (/admin)
ADMIN_PASSWORD_ESCAPE_ROOM=another-strong-password  # /admin/escape-room
ADMIN_PASSWORD_HAUNTED_HOUSE=a-third-password       # /admin/haunted-house

# Optional: confirmation emails
GMAIL_USER=your-account@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Optional: base URL for the login link in emails
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-side key, never expose to the client |
| `ADMIN_PASSWORD` | ✅ | Registration team password. Always set this in production |
| `ADMIN_PASSWORD_ESCAPE_ROOM` / `ADMIN_PASSWORD_HAUNTED_HOUSE` | ➖ | Escape Room / Haunted House staff. Each password must be different |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | ➖ | Without them, registration still works but no email is sent |
| `NEXT_PUBLIC_SITE_URL` | ➖ | Falls back to the Vercel production domain, then `http://localhost:3000` |
| `STUDENT_SESSION_SECRET` | ➖ | Signs the student login cookie. Falls back to `ADMIN_SESSION_SECRET`, then the service role key |
| `CRON_SECRET` | ➖ | Bearer token for `/api/booking/remind`. Copy it from Supabase › Vault › `reminder_cron_secret` |

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
app/
├── page.tsx              # Home: login with student ID
├── registration/         # 3-step registration form
├── menu/                 # Attendee hub after login
├── my-ticket/            # QR ticket + check-in status
├── what-ghost/           # Pick a Boo quiz
├── event-map/            # Venue map + vendor booths
├── schedule/             # Event schedule
├── escape-room/          # Landing, rules, rounds, book, confirmed, my-booking
├── haunted-house/        # The same pages in the Haunted House theme
├── admin/                # Staff: registration dashboard, escape-room/, haunted-house/
├── api/
│   ├── register/         # Create registration, generate QR, send email
│   ├── login/            # Student login: POST logs in, GET who is logged in, DELETE logs out
│   ├── booking/          # state, rounds, book, find, mine, change-round, cancel-*, remove-member, remind
│   ├── staff/            # dashboard, check-in, attendance, walkin, rounds, export, purge
│   ├── admin/login/      # Staff password check
│   └── save-ghost-result/
├── layout.tsx            # Metadata, icons, fonts
└── globals.css           # Theme tokens and shared styles
components/booking/       # Booking kit: BookingPage, Button, StatusNote, BookingTicket, dialogs, …
components/staff/         # Staff dashboard tabs and scanner
lib/                      # Supabase client, sessions, booking helpers, emails
public/brand/             # Event logo and partner logos
supabase/                 # Database schema and booking SQL
docs/                     # booking-api.pdf, promo clips
```

---

## Theme

Colors are defined as tokens in [`app/globals.css`](app/globals.css) and exposed to Tailwind as `halloween-*` utilities.

| Token | Hex | Used for |
| --- | --- | --- |
| Plum | `#24033a` | Background, cards |
| Purple | `#4a3167` | Borders, secondary surfaces |
| Orange | `#ea7b29` | Primary actions, headings |
| Lime | `#bbd03c` | Accents, success states |
| Cream | `#f5eee6` | Text |
| Error | `#ff6b5b` | Validation and error messages |

The Haunted House pages use the same tokens recoloured under `.theme-haunted` (blood red, bone, maroon).

Fonts: **FC Iconic** for body and Thai text, **Monster Fiesta** for display headings.

---

**Contact:** Instagram [@shividni.pheedu](https://www.instagram.com/shividni.pheedu/)

คณะพาณิชยศาสตร์และการบัญชี × คณะวิศวกรรมศาสตร์ × คณะนิเทศศาสตร์ · จุฬาลงกรณ์มหาวิทยาลัย
