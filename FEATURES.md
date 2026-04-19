# REHWAS — Complete Feature List

> **REHWAS** is India's broker-free rental platform connecting tenants with verified landlords across Bengaluru, Pune & Mumbai. Built with React + TypeScript + Vite, powered by Supabase.

---

## 🏠 Platform Overview

| Aspect | Detail |
|---|---|
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | TailwindCSS 3 (with Backdrop Blur & Glassmorphism) |
| **Backend** | Supabase (Auth, DB, Storage, Realtime) |
| **Maps** | Leaflet.js + React-Leaflet (with Auto-centering & Custom Price Pins) |
| **State** | TanStack React Query, Custom Hooks, Realtime Pub/Sub |
| **Logic** | @chenglou/pretext (Precise Text Measurement) |
| **Deployment** | Vercel |
| **Target** | Mobile-first, responsive web app |

---

## 1. 🔐 Authentication & Onboarding

### Email OTP Login
- Passwordless authentication via Supabase email OTP
- 6-digit verification code with auto-resend countdown (60s)
- Numeric-only input enforcement for OTP field

### Role-Based Onboarding
- **Step 0 — Role Selection:** User picks between "Find a Home" (Tenant) or "List Property" (Landlord) with distinct visual cards
- **Step 1 — Email Input:** Email address entry with validation
- **Step 2 — OTP Verification:** Code entry with resend capability
- **Step 3 — Profile Setup:** First-time users provide full name and confirm role
- Automatic redirect post-login: Landlords → Dashboard, Tenants → Discover

### Auth State Management (`useAuth` Hook)
- Global `AuthProvider` context wrapping the entire app
- Persistent session via Supabase `onAuthStateChange` listener
- Profile auto-fetch on login
- `isLandlord` derived boolean for role-gating
- Functions: `signInWithPhone`, `signInWithEmail`, `verifyOtp`, `signOut`, `updateProfile`

---

## 2. 🏡 Landing Page (Home)

### Hero Section
- Bold value proposition: "Find your perfect room in India — no broker, no hassle."
- Two primary CTAs: **Browse Rooms** and **List My Property**
- Animated statistics counters with easeOutQuad easing:
  - 2,400+ Rooms Listed
  - 8,000+ Happy Tenants
  - ₹0 Broker Fee

### How It Works — Tenants
1. **Search on the Map** — Filter by city, rent, and type
2. **Chat with Landlord** — Direct in-app communication
3. **Move In** — Verified listings and digital rent receipts

### How It Works — Landlords
1. **List in 5 Minutes** — Add photos, set rent, drop a pin
2. **Find Tenants** — Receive visit requests and chat securely
3. **Manage Everything** — KhataBook-style rent ledger and digital receipts

### Feature Highlights
- **Smart Map Discovery** — Visual locality-based room browsing
- **Rent Ledger** — Digital tracking of rent, electricity, and arrears
- **Verified Listings** — KYC-linked landlords and community reviews

### Cities Section
- Clickable city cards with live Unsplash imagery:
  - Bengaluru (1,200+ listings)
  - Pune (850+ listings)
  - Mumbai (350+ listings)
- Animated image zoom-in on hover

### Global Header (`Header` Component)
- **Smart Navigation:** Dynamic CTAs based on role (Landlords see "Management", Tenants see "Discover").
- **Auth-Aware Brand:** Brand logo links to Home or Dashboard depending on session.
- **User Identity:** Integrated Profile avatar displaying `avatar_url` or initials.
- **Mobile responsiveness:** Collapsible hamburger menu with slide-in animations.
- **Aesthetic:** Sticky placement with `backdrop-blur-md` glass effect.

---

## 3. 🔍 Room Discovery (Discover Page)

### Dual-View Layout
- **List View** — Scrollable room card feed (left panel)
- **Map View** — Interactive Leaflet map with room markers (right panel)
- Mobile: Toggle tabs between List 📋 and Map 🗺️
- Desktop: Side-by-side split layout (400–450px list | flex map)

### Search & Filtering
- **Real-time search bar** — Filter by locality, area, or keywords
- **FilterPanel Component** with URL-synced parameters:
  - City selector (Bengaluru, Pune, Mumbai, Delhi)
  - Min/Max rent range (₹)
  - Room type (All, 1BHK, 2BHK, PG, Studio)
  - Furnished toggle (Any, Furnished, Unfurnished)
  - Gender preference (Any, Male Only, Female Only)
- Client-side + server-side hybrid filtering
- Filter state persisted in URL search params

### Mobile Filter Drawer
- Slide-up bottom sheet with backdrop blur
- Full filter form in a scrollable drawer
- 85% max viewport height

### Loading Skeletons
- Animated shimmer placeholders for room cards during data fetch

### Interactive Map (`MapView` Component)
- **Visual Price Pins:** Custom `L.divIcon` markers displaying rent in "k" format (e.g., ₹15.5k) with hover scale effects.
- **MapAutoCenter Logic:** Automatically centers and zooms using `flyTo` for single results or `flyToBounds` for multiple results (1.5s animation).
- **MapResizer:** Ensures map container recalculates size on layout shifts or view toggles.
- **Custom Popups:** CSS-modified Leaflet popups with zero padding, rounded corners, and backdrop-blur close buttons.
- **Zero-State Map:** Custom SVG view for when rooms have missing geolocation data.

### Room Cards (`RoomCard` Component)
- **Multi-State Rendering:** Standard card for feeds vs. Compact card for map popups.
- **Status Badges:** "Available Now" badge with animated pulse dot.
- **Smart Amenity Icons:** Maps list titles (Wifi, AC, TV, etc.) to specific icons with hover tooltips.
- **Feature Overflow:** Displays top 4 amenities with a " +X " indicator for additional items.
- **Verified Status:** Prominent "Verified" badge with Shield icon for trusted listings.

### The Pulse — Local Tips
- Horizontal scrollable neighborhood tip cards
- Verified resident tips for areas like HSR Layout, Indiranagar, Whitefield, Koramangala
- Color-coded by locality

### 🛡️ Verified Trust Era
- **Aadhaar-Linked KYC:** Real-time identity verification simulation for instant trust.
- **Verification Badging:** Verified status badges on landlord profiles and room cards.
- **Tenant Rent Transport:** Digital "Rental Passport" generation containing verifiable payment history and Bhoomi Scores.
- **Cities Adding Soon** — Waitlist cards for Hyderabad, NCR, Chennai with grayscale images.

---

## 4. 📋 Room Detail Page

### Photo Gallery
- Full-width hero image (350px mobile / 500px desktop)
- Overlapping thumbnail strip with active state ring
- Photo index badge (e.g., "2 / 5")
- Click-to-switch between photos

### Room Header
- Room title, locality, city
- Price display: `₹XX,XXX / month`
- Status badges: Room Type, Furnished/Unfurnished, Available Now (animated pulse dot)

### Bhoomi Score 2.0 (Asset Intelligence)
- **Numeric Scoring Model:** Dynamic 300-900 scale (standardized credit-style) based on rental ledger history.
- **Intelligence Factors:** Payment consistency, tenure length, identity verification, and property amenities.
- **Elite Status:** Automated "Elite Tier" badging for users/listings with 750+ score.

### Locality Intelligence 2.0 (Commute Predictor)
- **Interactive CommuteWidget:** Real-time peak-hour travel estimation between properties and user-provided destinations.
- **Multi-Modal Data:** Support for Car, Bike, and Public Transit calculation logic.
- **Map Correlation:** "Commute Mode" toggle on the Discovery Map that visualizes travel times for every listing instantly.
- **Hub Proximity:** Metadata tracking for nearest Metro and Bus hubs.

### Amenities Grid
- Icon-mapped amenity list using Material Symbols
- Auto-icon detection for WiFi, AC, Parking, Gym, Lift, Kitchen, etc.
- Hover effects

### Location Mini-Map
- Static Leaflet map with custom marker
- Dragging and zoom disabled for clean display
- Address display with map icon

### Landlord Profile Card
- Avatar (initial or uploaded photo)
- Full name and membership date
- **KYC Verified badge** — "Vetted by REHWAS"
- Two action buttons: **Book a Visit** and **Chat with Landlord**

### Market Watch (Price Context)
- Average rent ranges by room type in locality
- "Competitive Listing" indicator with trend icon

### Safety Tip
- Inline warning: "Never pay a security deposit without visiting in person."

### Similar Rooms
- Up to 3 related room cards from same city and type

### Book a Visit Modal
- Date picker (no Sundays)
- Time window selection: Morning (9-12), Afternoon (12-4), Evening (4-7)
- Optional message field
- Sends request as a message to landlord via Supabase
- Bottom sheet on mobile, centered popup on desktop

### Chat Drawer
- Slide-in panel from right with backdrop
- Full `ChatWindow` component embedded
- Closeable via X button or backdrop click

### Sticky Bottom Bar (Mobile)
- Fixed bottom price display + "Book Visit" button
- Glassmorphism styling with backdrop blur

### Share Functionality
- One-click URL copy to clipboard

---

## 5. 💬 Real-Time Chat (`ChatWindow`)

### Messaging Engine
- Bi-directional real-time messaging via Supabase Realtime (Postgres Changes)
- Channel subscription per room ID
- Optimistic UI updates — message appears instantly before DB confirmation
- Duplicate prevention for optimistic + realtime entries

### Message Layout
- **Pretext library integration** for precise text measurement
- Dynamic bubble sizing based on `prepare()` + `layout()` calculations
- Single-line messages: `rounded-full` pill style with inline timestamp
- Multi-line messages: `rounded-2xl` style with timestamp below
- Max bubble width: 70% of container

### Chat Features
- **Precise Layout Engine:** Uses `@chenglou/pretext` for pixel-perfect text measurement and bubble sizing.
- **Dynamic Bubble Radius:** Smart switching between `rounded-full` (single line) and `rounded-2xl` (multiple lines) based on text measurement.
- **Date Separation:** Structurally grouped by date (Today, Yesterday, Date) with sticky header labels.
- Enter to send, Shift+Enter for newline
- Online status indicator (green dot)
- Responsive container width tracking via ResizeObserver

---

## 6. ➕ Add Room — 4-Step Wizard

### Step 1: Basic Info
- Room title (text input)
- Room type selector (1BHK, 2BHK, PG, Studio) — chip-style buttons
- Monthly rent (₹) with currency prefix
- City dropdown (Bengaluru, Pune, Mumbai, Delhi, Hyderabad)
- Locality / Area
- Full address (textarea)
- Available from (date picker)
- Gender preference (Any, Male Only, Female Only)

### Step 2: Amenities & Details
- Description textarea
- Furnished toggle switch
- Floor number and total floors
- **17 Amenities** — pill-style multi-select:
  WiFi, RO Water, AC, Power Backup, 24hr Security, CCTV, Parking, Gym, Lift, Gas Pipeline, Washing Machine, Cooking Allowed, Pet Friendly, Geyser, Inverter, Modular Kitchen, Balcony

### Step 3: Location
- Interactive Leaflet map with click-to-pin
- **Draggable marker** for fine-tuning position
- "Use my current location" — Browser Geolocation API
- Live latitude/longitude display
- Default: Bengaluru center (12.9716, 77.5946)

### Step 4: Photos
- Drag-and-drop file upload area
- Supported formats: JPG, PNG, WebP
- Maximum 8 photos per listing
- **Cover photo badge** on first image
- Drag-to-reorder photos
- Individual photo removal with X button
- Upload progress bar with percentage

### Wizard Navigation
- Desktop: Visual step progress bar with numbered circles and check marks
- Mobile: Text-based "Step X of 4" with linear progress bar
- Per-step validation with error display
- Back/Next navigation

### Submission Flow
- Photos uploaded to Supabase Storage (`room-photos` bucket)
- Public URLs generated and stored
- Room record inserted with all metadata
- Success screen with room preview card and navigation to listing/dashboard

### Access Control
- Route protected: Only landlord-role users can access
- Tenants are redirected to `/discover` with error toast

---

## 7. 📊 Landlord Dashboard

### Dashboard Header
- Personalized greeting: "Good morning, [Name]! 🏠"
- "Add New Room" primary action button

### Statistics Cards (4-column grid)
| Card | Value | Icon |
|---|---|---|
| Total Rooms | Count | 🏠 |
| Occupied | Count | 🔑 |
| Vacant | Count | 🚪 |
| Rent This Month | ₹Amount | 💰 |
- Each card has a trend indicator (↗ 2%)
- Hover scale animation

### Tab Navigation
Four tabs with icon + label:
1. **My Rooms** 🏠
2. **Tenants** 👥
3. **Rent Ledger** 📖
4. **Reminders** 🔔

---

### Tab 1: My Rooms
- Grid display of landlord's room cards
- **Hover management overlay** with actions:
  - ✏️ **Edit Room** — Navigate to edit form
  - 🔑 **Toggle Vacancy** — Mark as occupied/vacant
  - 🗑️ **Delete Room** — Soft-delete with confirmation
- Empty state with CTA to add first room

### Tab 2: Tenants
- **Add Tenant Modal:**
  - Room selector (vacant rooms only)
  - Tenant name, phone, rent amount, move-in date
  - Auto-creates tenant record, marks room occupied
  - Auto-generates 6 months of ledger entries
- **Tenant Table:**
  - Name, phone, room assignment, move-in date, rent amount
  - **Export Dossier** — Print-ready Digital Estate Dossier
  - **End Tenancy** — Marks tenant as past, room as vacant

### Tab 3: KhataBook (Rent Ledger)
- **Matrix Visualization:** Tenants plotted against the last 6 months for rapid overview.
- **Color-Coded Health:** Cells styled by status (Emerald: Paid, Orange: Partial, Rose: Unpaid).
- **Advanced Cell Breakdown:** Each cell displays a breakdown of Base Rent vs. Utility Charge.
- **Interactive Management Modal:**
  - Edit Base Rent, Utility, and internal Notes per month.
  - Quick "Mark as Paid" action with current date automation.
- **PDF/Print Engine:** Specialized `@media print` CSS for generating clean, professional physical ledger reports.

### Tab 4: Reminders
- Unpaid dues cards for current month
- **WhatsApp Reminder** — One-click pre-filled WhatsApp message:
  - `"Hi [Name], your rent of ₹[Amount] for [Month] is due. Please pay at your earliest. - REHWAS"`
  - Direct `wa.me` link with URL-encoded message
- "All Clear" empty state when no dues pending

---

## 8. ⚡ Urja — Shared Meter Utility Splitter

### Bulk Utility Billing Modal
- Total building bill amount input
- Billing month selector (last 6 months)
- Tenant checkbox selector with room labels
- **Live per-tenant share calculation** displayed in a featured card
- Animated loading spinner during split calculation
- Updates `utility_amount` field on each tenant's ledger row

### Split Strategy
- Equal headcount-based division: `Total Bill ÷ Selected Tenants`
- Per-tenant amount rounded to nearest rupee

---

## 10. 🛂 Tenant Rent Transport (Rental Passport)

### Digital Rental Passport
- **Verifiable Credential:** A premium, printable resume (DigitalCertificate) of rental history.
- **Score Portability:** Tenants can carry their Bhoomi Score from one rental to the next.
- **Landlord Trust:** Guaranteed financial standing certificates to bypass high security deposits.
- **Verification Hash:** Secure document footprint for integrity.

---

## 10. 🗺️ Map Features

### Room Discovery Map
- OpenStreetMap tiles
- Room markers at GPS coordinates
- Popup summaries on marker interaction

### Add Room Map
- Click-to-pin location selection
- Draggable marker for precision
- Browser geolocation integration
- Live coordinate readout

### Room Detail Mini-Map
- Static display with custom marker
- Zoom and drag disabled
- Subtle desaturation filter

---

## 11. 🔧 Technical Architecture

### Custom Hooks
| Hook | Purpose |
|---|---|
| `useAuth` | Authentication state, OTP flow, profile management |
| `useRooms` | Room CRUD, filtered queries, soft-delete |
| `useLedger` | Rent ledger management, payment tracking, utility splits |

### Data Models
| Model | Key Fields |
|---|---|
| `Profile` | id, full_name, phone, role (landlord/tenant), kyc_verified |
| `Room` | id, landlord_id, title, rent_amount, room_type, city, locality, amenities[], photos[], bhoomi_score, utility_billing_type |
| `Tenant` | id, room_id, landlord_id, tenant_profile_id, rent_amount, move_in_date, status |
| `RentLedger` | id, tenant_id, landlord_id, month, amount, utility_amount, arrears, status (paid/unpaid/partial) |
| `Message` | id, room_id, sender_id, receiver_id, content, created_at |

### Key Components
| Component | Purpose |
|---|---|
| `Header` | Global navigation bar |
| `RoomCard` | Room listing card (reused across Discover, Dashboard, Detail) |
| `FilterPanel` | URL-synced room search filters |
| `MapView` | Leaflet map with room markers |
| `ChatWindow` | Real-time messaging with pretext layout |
| `RentLedgerTable` | Tabular rent tracking with status management |
| `DigitalDossier` | Print-optimized tenant profile |

### Routing
| Path | Page | Access |
|---|---|---|
| `/` | Home (Landing) | Public |
| `/discover` | Room Discovery | Public |
| `/room/:id` | Room Detail | Public |
| `/login` | Authentication | Public |
| `/add-room` | Add Room Wizard | Landlord Only |
| `/dashboard` | Landlord Dashboard | Landlord Only |

---

## 12. 📱 Mobile-First Design

- All interactive elements enforce `min-h-[44px]` touch targets
- Mobile-specific tab navigation (List/Map toggle)
- Bottom sheet modals on mobile (full-screen popups become slide-up sheets)
- Sticky bottom action bar on Room Detail
- Hamburger menu for mobile navigation
- Filter drawer as bottom sheet overlay
- Horizontal scroll with snap for tip cards and city previews
- Responsive grid breakpoints: `md:` and `lg:`

---

## 13. 🎨 Design System

- **Color Palette:** Emerald-based brand, Indigo accents, Slate neutrals
- **Typography:** Bold/Black weights, tight tracking, uppercase micro-labels
- **Border Radius:** 2xl–3xl for cards, full for pills and avatars
- **Glassmorphism:** `backdrop-blur-xl`, `bg-white/80` on headers and overlays
- **Shadows:** Multi-layer colored shadows (e.g., `shadow-brand/20`)
- **Animations:** CSS transitions, scale on active, rotate on hover, `animate-pulse`, `animate-spin`
- **Icons:** Lucide React + Google Material Symbols

---

## 14. 🔮 Planned / Coming Soon

- ✅ Verified Tenant Profiles (Aadhaar-linked verification)
- 🏙️ City Expansion: Hyderabad, NCR (Delhi), Chennai
- 📊 Advanced Bhoomi Score with community reviews
- 🔔 Automated rent reminders (push notifications)
- 📄 Digital rent receipts (PDF export)
- 🔍 AI-powered room recommendations

---

*Last updated: April 19, 2026*
