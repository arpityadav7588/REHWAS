# REHWAS — Making Bharat's Rentals Better 🏠🇮🇳

REHWAS is a premium, broker-free rental platform designed to bring transparency and efficiency to the Indian urban rental market. It connects tenants with verified landlords across major cities like **Bengaluru, Pune, and Mumbai**, eliminating the middleman and simplifying property management.

---

## 🚀 Key Value Propositions

- **100% Broker-Free:** Direct communication between owners and seekers.
- **Smart Map Discovery:** Visual, locality-based search with real-time price pins and **Commute Predictors**.
- **Aadhaar-Linked Trust:** Instant identity verification (KYC) for landlords and tenants.
- **Bhoomi Score 2.0:** Dynamic 300-900 credit-style scoring based on rental history.
- **Tenant Rent Transport:** Move-in digital certificates (Rental Passports) to bridge trust across properties.
- **KhataBook for Rent:** Advanced digital ledger for landlords to track rent, arrears, and utilities.
- **Urja Utility Splitter:** Automated building-wide utility bill splitting for shared meters.

---

## 📖 Detailed Features

For a deep dive into every page, component, and technical detail, please see:
👉 **[FEATURES.md](./FEATURES.md)**

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** TailwindCSS 3 (Glassmorphism & Mobile-first)
- **Backend:** Supabase (Postgres Database, Auth, Storage, Realtime)
- **Maps:** Leaflet.js
- **State/Query:** TanStack React Query
- **Typography:** @chenglou/pretext (Precise Measurement)

---

## 📂 Project Structure

```bash
d:/Rehwas
├── rehwas/            # Main React + Vite Application
│   ├── src/
│   │   ├── components/ # Reusable UI blocks
│   │   ├── pages/      # Full-page views (Home, Discover, Dashboard, etc.)
│   │   ├── hooks/      # Custom React hooks (useAuth, useLedger, useRooms)
│   │   ├── lib/        # Supabase client & utilities
│   │   └── types/      # TypeScript interfaces
│   ├── public/         # Static assets
│   └── .env.example    # Template for Supabase keys
├── degin.md/           # High-fidelity design specs & mockups
├── FEATURES.md         # Comprehensive feature documentation
└── README.md           # You are here
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn
- A Supabase account

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/rehwas.git

# Navigate to the app directory
cd rehwas/rehwas

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in `rehwas/rehwas/` using the following:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 🔮 Future Roadmap

- [ ] **Verified Profiles:** Aadhaar-linked KYC for 100% trust.
- [ ] **AI Recommendations:** Local school/office commute optimization.
- [ ] **City Expansion:** Launching soon in Hyderabad, Chennai, and NCR.
- [ ] **Automated Reminders:** Direct push notifications for rent dues.

---

Built with ❤️ for Bharat. 
© 2026 REHWAS Technologies. All Rights Reserved.
