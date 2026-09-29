# SHIVIDTIDPHEE 2025 - Halloween Event Website

Halloween event website with registration, quiz game, QR check-in system, and admin dashboard.

## Features

### For Attendees
- **Registration**: 3-step registration form with PDPA consent
- **Email Confirmation**: Automatic email with QR code ticket
- **User Dashboard**: Login with student ID to access:
  - QR Code for check-in
  - Ghost Quiz (10 questions, 7 ghost type results)
  - Event Map
  - Event Schedule

### For Admins
- **Admin Dashboard**: Password-protected admin panel with:
  - Real-time attendance table
  - Column show/hide functionality
  - QR Code scanner for check-in
  - iPhone Safari compatible

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **QR Code**: qrcode, html5-qrcode
- **Email**: Resend
- **Deployment**: Vercel

## Setup Instructions

### 1. Database Setup (Supabase)

1. Go to your Supabase project: https://urvwkdhoyciaedujwzhj.supabase.co
2. Navigate to SQL Editor
3. Run the SQL script from `supabase/schema.sql`

### 2. Email Setup (Resend)

1. Sign up for Resend: https://resend.com
2. Get your API key
3. Add to `.env.local`:
   ```
   RESEND_API_KEY=your_resend_api_key
   ```

### 3. Environment Variables

Already configured in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD` (default: halloween2025)

Optional:
- `NEXT_PUBLIC_SITE_URL` (for email links, defaults to localhost:3000)
- `RESEND_API_KEY` (for sending emails)

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Add Event Images

Place your event images in the `public` folder:
- `public/event-map.jpg` - Event layout map
- `public/event-schedule.jpg` - Event schedule

Then update the dashboard page to display these images.

## Pages Structure

```
/                    - Home page with event info
/registration        - 3-step registration form (isolated, no nav)
/login              - Student login page (isolated, no nav)
/dashboard          - User dashboard (4 tabs: QR, Quiz, Map, Schedule)
/admin              - Admin dashboard (attendance table + QR scanner)
/game               - Public ghost quiz (accessible from main nav)
/layout             - Public event map
/schedule           - Public event schedule
```

## Admin Access

- URL: `/admin`
- Password: set `ADMIN_PASSWORD` in `.env.local` (and in the Vercel dashboard for production)

## Exporting Registrations

Supabase is the single source of truth for registrations. In `/admin` → Attendance Table,
click **ดาวน์โหลด Excel** to download every registration as an `.xlsx` file.

## Deployment to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Database Schema

### registrations table

- `id` (UUID, primary key)
- `created_at` (timestamp)
- `first_name` (text)
- `last_name` (text)
- `email` (text, unique)
- `student_id` (text)
- `department` (text)
- `qr_code` (text, unique)
- `attended` (boolean, default false)
- `attended_at` (timestamp, nullable)

## Customization

### Theme Colors (in `app/globals.css`)

- `--halloween-dark`: #1a0f0f (background)
- `--halloween-charcoal`: #2d2424 (cards)
- `--halloween-orange`: #c17850 (primary)
- `--halloween-purple`: #6b5b7a (accent)
- `--halloween-cream`: #f5f1e8 (text)

### Ghost Quiz Results

Edit the `ghostTypes` object in `app/dashboard/page.tsx` to customize:
- Ghost names
- Descriptions
- Themes
- Add images if needed

## Support

For issues or questions:
- IG: @shividtidphee
- Email: Contact event organizers

---

Built with ❤️ for SHIVIDTIDPHEE 2025
คณะพาณิชยศาสตร์และการบัญชี X คณะวิศวกรรมศาสตร์
