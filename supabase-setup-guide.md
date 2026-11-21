# SlotWise AI Booking Platform - Supabase Backend Configuration Guide

This guide details how to configure the backend database, authentication, and realtime booking synchronization for the **SlotWise** application using **Supabase** (PostgreSQL).

---

## 🚀 Quick Setup Overview

SlotWise includes a hybrid **Dual-Mode Data Engine**:
1. **Live Supabase Mode**: Connects directly to your Supabase PostgreSQL database, supporting real-time slot synchronization, RLS policies, and SQL procedures.
2. **Instant Fallback Mock Engine**: Operates immediately out of the box with realistic providers, slots, and appointments persisted to browser storage until your credentials are added.

---

## Step 1: Create a Supabase Project

1. Visit [https://supabase.com](https://supabase.com) and sign in or create a free account.
2. Click **New Project**.
3. Fill in the project details:
   - **Name**: `slotwise-booking-platform` (or your preferred name)
   - **Database Password**: Set a strong password (save it safely)
   - **Region**: Choose the closest geographic region to your users
4. Click **Create new project** and wait 1–2 minutes for your database to provision.

---

## Step 2: Run the Database Migration SQL

1. In your Supabase Project dashboard, open the left sidebar and click **SQL Editor**.
2. Click **New query** (or the **+** button).
3. Copy the entire contents of the `schema.sql` file located in this project:
   - Path: `schema.sql`
4. Paste the SQL script into the query box.
5. Click **Run** (or press `Ctrl + Enter` / `Cmd + Enter`).

### What `schema.sql` Creates:
- **`providers`**: Stores specialist information, titles, bios, photo URLs, hourly rates, and categories.
- **`services`**: Specific consultation offerings per provider (e.g., Routine Health Checkup, Precision Cut, Biomechanical Assessment).
- **`slots`**: Dynamic calendar timeslots (morning, afternoon, evening) with boolean `is_available` locks.
- **`appointments`**: Confirmed and pending bookings with client details, fees, and encrypted video meeting links.
- **`profiles`**: User profiles with preference modes (in-person vs. virtual).
- **`chat_messages`**: Conversational AI assistant transcripts and parsed intent JSON.
- **`book_appointment_slot(...)` RPC**: An atomic PostgreSQL stored procedure that validates slot availability and reserves it without race conditions.
- **Row Level Security (RLS)**: Preconfigured permissive read/write policies for frictionless testing and public discovery.

---

## Step 3: Retrieve Your Supabase API Credentials

1. In your Supabase dashboard, click **Project Settings** (gear icon at the bottom of the left sidebar).
2. Navigate to **API**.
3. Under **Project URL**, copy the `URL` (e.g., `https://xyzabcdefghijklmnop.supabase.co`).
4. Under **Project API keys**, copy the `anon` / `public` key (starts with `eyJhbGciOi...`).

---

## Step 4: Link Supabase in SlotWise

You can connect your Supabase database in two easy ways:

### Option A: Directly in the SlotWise App UI (Recommended)
1. Open SlotWise in your browser (`index.html`).
2. Click the **Profile** tab in the bottom navigation bar.
3. Scroll to the **Supabase Cloud Backend Hub** section.
4. Paste your **Project URL** and **Anon Public Key**.
5. Click **Save & Connect**.
6. The connection indicator will turn vibrant neon green (`● Supabase Live Connected`).
7. Click **Seed Initial Providers to Supabase** to populate your brand-new tables with 6 specialists and live calendars with 1 click!

### Option B: Environment Configuration (.env & env.js)
SlotWise comes pre-configured to read from `.env` and `env.js`.
Your project credentials:
```env
SUPABASE_URL=https://hkesnwooqxpoeiyprufu.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xGcXsul7pi2SRCZmxrdJWA_rp21D7Zx
```
When opening `index.html` in the browser, `env.js` automatically passes these variables to the runtime engine.

### Option C: Local Config Pre-fill via Console
```javascript
localStorage.setItem('slotwise_supabase_config', JSON.stringify({
  url: 'https://YOUR_PROJECT_REF.supabase.co',
  anonKey: 'YOUR_SUPABASE_ANON_KEY'
}));
window.location.reload();
```

---

## Step 5: Verify Live Synchronization

1. In the **Discover** or **Providers** tab, select a provider (e.g. *Dr. Aarav Mehta*).
2. Choose a date and time slot (e.g. *03:30 PM*).
3. Click **Continue to Confirmation** -> **Confirm & Reserve**.
4. Check your Supabase dashboard under **Table Editor** -> `appointments`:
   - You will see the new row instantly created with matching fee, date, and user details!
   - In the `slots` table, the corresponding slot will be updated to `is_available = false`.

---

## 🛡️ Production & Security Enhancements

When preparing for production deployment with real user logins:
1. **Enable Supabase Auth**: Turn on Email OTP, Google OAuth, or Apple Sign-In in **Authentication** -> **Providers**.
2. **Refine RLS Policies**: Replace the permissive `true` policies with `auth.uid() = user_id` so clients can only read and manage their own appointment records.
3. **Automate Reminders**: Add a Supabase Edge Function with Cron (pg_net) to dispatch SMS / Email notifications 2 hours prior to scheduled appointment times.
