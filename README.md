# Tota Cake House — Order Management System

Internal order management system for Tota Cake House, Maslandapur, West Bengal.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Google Sheets** as the database via Google Apps Script.

---

## Features

- **New Order Form** — capture all order details with validation
- **Order History** — search, filter, sort all orders
- **Summary Dashboard** — revenue metrics, charts, trends
- **Google Sheets backend** — all data saved to your Google Sheet
- **WhatsApp integration** — one-tap confirmation messages
- **Order receipts** — share via WhatsApp or clipboard
- **Quick status updates** — update status from order cards
- **Mobile-first** — works perfectly on phones

---

## Setup: Google Sheets Integration

### Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Name it **"Tota Cake House Orders"** (or any name you like)
3. The script will auto-create the **"Orders"** tab with headers on first use

### Step 2 — Open Apps Script

1. In your Google Sheet, click **Extensions** in the menu bar
2. Click **Apps Script**
3. A new tab will open with the script editor

### Step 3 — Paste the Code

1. Delete all existing code in the editor (usually a blank `function myFunction() {}`)
2. Open the file `google-apps-script/Code.gs` from this project
3. Copy all the code and paste it into the Apps Script editor
4. Click the **Save** icon (floppy disk) or press `Ctrl+S` / `Cmd+S`

### Step 4 — Deploy as Web App

1. Click **Deploy** (top right) → **New deployment**
2. Click the gear icon next to "Select type" → choose **Web App**
3. Fill in the settings:
   - **Description:** `Tota Cake House OMS`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **Deploy**
5. If prompted, click **Authorize access** and follow the Google sign-in flow
6. Grant the requested permissions (the script needs to access your spreadsheet)

### Step 5 — Copy the Web App URL

1. After deployment, you'll see a **Web App URL** like:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
2. Click **Copy** to copy this URL

### Step 6 — Connect the App

1. Open the Tota Cake House OMS app in your browser
2. Tap the **gear icon** (⚙️) in the top-right header
3. Paste the Web App URL into the input field
4. Tap **Test Connection** — you should see "Connection successful!"
5. Tap **Save**

> ⚠️ **Important:** Every time you edit the Apps Script code, you must create a **New deployment** (not update existing) to get a fresh URL, or use "Manage deployments" to update the existing one.

---

## Running Locally

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Install dependencies

```bash
cd tota-cake-oms
npm install
```

### Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app works best on a mobile screen. Use Chrome DevTools → Toggle device toolbar to simulate a phone.

---

## Deploying to Vercel (Free)

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. Your app will be live at a `.vercel.app` URL.

### Option B — GitHub + Vercel Dashboard

1. Push this project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/tota-cake-oms.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **Add New Project** → Import your repository
4. Keep all default settings → Click **Deploy**
5. Your app is live! Share the URL with your phone and add it to your home screen

### Add to Home Screen (iOS / Android)

1. Open the Vercel URL in Safari (iOS) or Chrome (Android)
2. **iOS:** Tap Share → Add to Home Screen
3. **Android:** Tap the 3-dot menu → Add to Home Screen

The app will work like a native app on your phone.

---

## Google Sheet Column Headers

The script auto-creates these headers in order (row 1):

| Column | Header |
|--------|--------|
| A | Order ID |
| B | Order Date |
| C | Customer Name |
| D | Phone |
| E | Area |
| F | Cake Category |
| G | Occasion |
| H | Flavour |
| I | Size |
| J | Tiers |
| K | Cake Message |
| L | Design Notes |
| M | Delivery Date |
| N | Delivery Time |
| O | Delivery Type |
| P | Delivery Address |
| Q | Total Price |
| R | Advance Paid |
| S | Balance Due |
| T | Payment Mode |
| U | Status |
| V | Referral Source |
| W | Notes |
| X | Saved At |

---

## Troubleshooting

**"Connection failed" when testing:**
- Make sure you deployed as "Execute as: Me" and "Who has access: Anyone"
- Try creating a new deployment and using the new URL
- Check that you granted all permissions during the auth flow

**Orders not showing in History:**
- Tap the refresh button (↺) in the History tab
- Make sure the Google Sheet URL is saved in Settings

**CORS errors in browser console:**
- This is expected during local development if Google Apps Script blocks localhost
- The app works correctly when deployed to Vercel with a real domain

**"Could not save to Google Sheet" error:**
- Check your internet connection
- Verify the Web App URL in Settings is correct and active

---

## Project Structure

```
tota-cake-oms/
├── app/
│   ├── layout.tsx              # Root layout, metadata
│   ├── page.tsx                # Main page with tab navigation
│   ├── globals.css             # Global styles
│   ├── components/
│   │   ├── NewOrderForm.tsx    # Order creation form (5 sections)
│   │   ├── OrderHistory.tsx    # Order list with search/filter
│   │   ├── Summary.tsx         # Dashboard with metrics & charts
│   │   ├── OrderCard.tsx       # Individual order card
│   │   ├── StatusBadge.tsx     # Colored status badge
│   │   ├── SettingsModal.tsx   # Google Sheet URL configuration
│   │   └── Toast.tsx           # Success/error notifications
│   ├── hooks/
│   │   ├── useGoogleSheet.ts   # API calls to Google Apps Script
│   │   └── useOrders.ts        # Order state management
│   ├── types/
│   │   └── order.ts            # TypeScript interfaces
│   └── utils/
│       └── orderHelpers.ts     # ID generation, formatting, WhatsApp
├── google-apps-script/
│   └── Code.gs                 # Complete Apps Script code
├── public/
├── package.json
├── tailwind.config.ts
└── README.md
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Google Apps Script | Backend API |
| Google Sheets | Database |
| Vercel | Hosting (free) |

---

Made with ❤️ for Tota Cake House, Maslandapur
