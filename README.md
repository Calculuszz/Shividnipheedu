# SHIVIDNIPHEEDU

Official website for **SHIVIDNI PHEEDU**, a Halloween event co-hosted by the Faculty of Commerce and Accountancy, the Faculty of Engineering, and the Faculty of Communication Arts, Chulalongkorn University.

Attendees register, receive a QR ticket, and explore the event from their phones. Staff check people in by scanning QR codes and can export the full attendee list to Excel.

---

## Features

### For attendees

| Feature | Description |
| --- | --- |
| **Registration** | 3-step form (event info → personal details → PDPA consent) with inline validation |
| **Email confirmation** | Confirmation email with the QR ticket attached (optional, see [Email](#email-optional)) |
| **Student ID login** | Log in with a student ID, no password needed |
| **My Ticket** | QR code for check-in plus live check-in status |
| **Ghost Quiz** | 10 questions, 7 ghost type results |
| **Event Map** | Venue map and student vendor booth list *(content not yet updated for this event)* |
| **Event Schedule** | Main stage timeline and performances *(content not yet updated for this event)* |

### For staff (`/admin`)

- Password-protected dashboard
- Real-time attendance table with search and stats (registered / checked in / played quiz)
- Camera QR scanner for check-in (works on iPhone Safari)
- **Download Excel**: exports every registration to `.xlsx`

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, FC Iconic + Monster Fiesta fonts |
| Database | Supabase (PostgreSQL + Realtime) |
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

In the Supabase dashboard, open **SQL Editor** and run [`supabase/complete-schema.sql`](supabase/complete-schema.sql). This creates the `registrations` table, indexes and policies.

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
├── what-ghost/           # Ghost Quiz
├── event-map/            # Venue map + vendor booths
├── schedule/             # Event schedule
├── admin/                # Staff dashboard (attendance, scanner, Excel export)
├── api/
│   ├── register/         # Create registration, generate QR, send email
│   ├── login/            # Student ID lookup
│   ├── admin/login/      # Admin password check
│   └── save-ghost-result/
├── layout.tsx            # Metadata, icons, fonts
└── globals.css           # Theme tokens and shared styles
components/               # EventName, FieldError, BackButton, LoadingScreen, …
lib/                      # Supabase client, email helper
public/brand/             # Event logo and partner logos
supabase/                 # Database schema
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

Fonts: **FC Iconic** for body and Thai text, **Monster Fiesta** for display headings.
---

**Contact:** Instagram [@shividni.pheedu](https://www.instagram.com/shividni.pheedu/)

คณะพาณิชยศาสตร์และการบัญชี × คณะวิศวกรรมศาสตร์ × คณะนิเทศศาสตร์ · จุฬาลงกรณ์มหาวิทยาลัย
