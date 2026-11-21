# SlotWise - AI Autonomous Booking Platform & Concierge

SlotWise is a futuristic, high-contrast, kinetic dark UI booking platform designed for instant specialist matching and calendar synchronization. Built using the **Cyber Obsidian Kinetic** design system, it features real-time slot selection, an autonomous conversational booking agent, telehealth video call simulation, end-to-end **Supabase (PostgreSQL)** backend integration, and a **Google Gemini AI Engine** for autonomous website navigation and 24/7 intelligent customer support.

---

## 🌟 Key Features

1. **Google Gemini AI Engine & Autonomous Navigation**:
   - **Gemini API Integration**: Direct REST API integration with Google Gemini (`gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro`).
   - **Autonomous Website Navigation**: The AI understands natural language intent and autonomously navigates the user throughout the website:
     - Home / Discover Console (`view-discover`)
     - Specialists Directory with category/keyword search (`view-providers`)
     - Specialist Profile & live booking calendar (`view-details`)
     - My Bookings dashboard (`view-bookings`)
     - Settings, Database & Gemini Hub (`view-profile`)
   - **24/7 Customer Support Agent**:
     - Instant policy answers: 100% free cancellation guarantee, zero penalties, transparent $30-$180 specialist pricing, specialist credential verification, and browser-based WebRTC HD video consultations.
     - Support Ticket Generation (`SW-XXXX`) with SLA tracking and 1-click status management in the Profile tab.
     - Live human support escalation to Sarah Miller (SlotWise Customer Ops).
   - **Interactive Action Buttons**: Responses feature 1-tap action buttons for instant slot reservation, telehealth room launch, support ticket viewing, and page switching.
   - **Resilient Built-in Smart Fallback Engine**: If no Gemini API key is configured or when offline, the agent automatically runs on its built-in rule and NLP engine without breaking.
   - **Omnipresent Floating AI Trigger**: Easily access the AI concierge from any page on desktop and mobile.

2. **Discover / Home Landing**:
   - Hero command console with instant service search, in-person vs. virtual visit toggle, and geo-location picker.
   - SlotWise AI Helper banner widget with quick chat activation.
   - Interactive 3-step "How It Works" carousel.
   - Featured Specialists horizontal card scroller with rating stars and live availability pills.
   - Telemetry metrics with animated count-up counters (99.4% On-time rate, 15k+ Bookings, 4.9 Avg rating).
   - Trending Fast Slots drawer preview with 1-tap quick booking.

3. **Specialist & Provider Discovery**:
   - Instant search across doctor, salon, fitness, automotive, and therapy categories.
   - Category filter pills (General Health, Wellness, Beauty, Fitness, Automotive).
   - Smart ranking selector (Smart Ranked by AI, Highest Rated, Lowest Fee).
   - Quick View bottom sheet preview modal with verified practitioner credentials.

4. **Provider Details & Interactive Slot Booking**:
   - Provider profile hero card with bio, board certifications, and verified badge.
   - Service selector chips with duration and pricing.
   - Dynamic 7-day horizontal calendar date strip with animated selection glow.
   - Smart AI Suggested Slot notification with 1-click slot picker.
   - Grouped time slots (Morning, Afternoon, Evening) with available, booked, and active states.
   - Sticky bottom summary sheet with real-time fee calculation.
   - Booking confirmation modal with patient name, email, and visit notes.

5. **My Bookings & Telehealth Hub**:
   - Tabbed view of Upcoming vs. Past appointments.
   - Real-time status badges (`Confirmed`, `Completed`, `Cancelled`).
   - 1-click **Join HD Call** launching an encrypted virtual telehealth room simulation with doctor stream and user picture-in-picture.
   - Reschedule and Cancel actions that update live database state and release slots.

6. **Supabase Cloud Backend Hub & Settings**:
   - In-app Supabase configuration console to input Project URL and Anon Key.
   - Live PostgreSQL connection status indicator.
   - 1-click **Seed Providers Data** button to populate a new Supabase database.
   - Copyable `schema.sql` migration script with Row Level Security (RLS) policies and atomic `book_appointment_slot` RPC function.

---

## 🔑 Configuring Your Google Gemini API Key

You can configure your Gemini API Key in two ways:

### Option 1: In the Web Application (Recommended)
1. Open SlotWise in your browser.
2. Click the **Key icon** or **Gemini Ready** status pill in the top-right of the **AI Assist** tab, or open the **Profile** tab.
3. Paste your Gemini API key (starts with `AIzaSy...`).
4. Select your preferred model (`gemini-1.5-flash`, `gemini-2.0-flash`, or `gemini-1.5-pro`).
5. Click **Test Ping** to verify connectivity with Google's API in real-time.
6. Click **Save & Activate**.

### Option 2: Pre-configure via `env.js` or `.env`
Open `env.js` and set:
```javascript
window.__ENV__ = {
  ...
  GEMINI_API_KEY: "AIzaSyYourActualGeminiApiKeyHere"
};
```

> **Need a Gemini API Key?** You can get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## 📂 Project Structure

```
slotwise-app/
├── index.html               # Main unified web application
├── gemini-client.js         # Google Gemini API & Autonomous Navigator engine
├── supabase-client.js       # Dual-mode database engine (Supabase PostgreSQL + Resilient local fallback)
├── env.js                   # Client environment configuration
├── .env.example             # Environment variable template
├── schema.sql               # Complete Supabase PostgreSQL schema, RLS policies, & seed data
├── supabase-setup-guide.md  # Step-by-step Supabase database configuration guide
├── README.md                # Project documentation
└── mockups/                 # Original reference HTML mockups and design assets
```

---

## 🚀 How to Run the Application

SlotWise is a client-side web application and **does not require Node.js or `npm`**. All libraries (Tailwind CSS, Supabase, Google Fonts) load via CDN.

You can launch and interact with the application immediately using any of these methods:

### Method 1: Instant Browser Launch (Recommended)
Run this command directly in your PowerShell terminal:
```powershell
start index.html
```
*(Or double-click `start.bat` or `index.html` in Windows File Explorer)*

### Method 2: Local HTTP Server (Zero Dependencies)
Run the native PowerShell web server included in this repository:
```powershell
.\serve.ps1
```
This starts a local development server at `http://localhost:5000` and automatically opens it in your default browser.

---

The application is completely functional out of the box using its resilient local storage engine. To link your live Supabase database or Google Gemini API key, navigate to the **Profile** tab or click the **Key icon** in the AI Assist header.

---

## 🗄️ Supabase Database Configuration

For complete instructions on creating a free Supabase project, executing the SQL schema, and configuring the backend, refer to [supabase-setup-guide.md](file:///C:/Users/Faiza/.gemini/antigravity/scratch/slotwise-app/supabase-setup-guide.md).
