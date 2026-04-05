# MegaWin Lottery Platform

A full-stack lottery website built with Next.js 14, PostgreSQL, and Prisma. Features cryptographically verified draws, a token economy, identity verification, and separate player/admin dashboards.

---

## Features

### Player Features
- **Register & Login** — JWT session-based auth
- **ID Verification** — Upload government ID; admin reviews and approves before play is permitted
- **Token Shop** — Purchase token packages to fund ticket purchases
- **Number Picker** — Select 6 numbers manually (1–49) or use Quick Pick
- **Player Dashboard** — View tickets, transaction history, wins, and verification status
- **Results Page** — Browse all past draws, check your tickets against results
- **Live Draw Page** — Animated countdown and ball reveal with cryptographic proof

### Admin Features
- **Admin Dashboard** — Overview of players, draws, pending KYC, and winners
- **KYC Review** — View uploaded ID documents, approve or reject with notes
- **Draw Management** — Create draws, view ticket sales, trigger draws
- **Cryptographic Draw** — Draws run from a pre-committed seed; results are provably fair
- **Winner Verification** — Review winners with cryptographic proof before confirming payout
- **Player Management** — View all players, their transactions, tickets, and wins

### Verification System
Every draw uses a two-phase cryptographic commitment:
1. A random seed is generated and its SHA-256 hash is published before the draw
2. After the draw, the seed is revealed — anyone can verify `SHA256(seed) === published hash`
3. Winning numbers are derived deterministically from the seed using a public algorithm
4. Each winner receives a signed cryptographic proof of their win
5. Admins verify winner identity (KYC) before confirming payout

---

## Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Framework   | Next.js 14 (App Router)       |
| Database    | PostgreSQL                    |
| ORM         | Prisma                        |
| Auth        | JWT via `jose` + HTTP cookies |
| Styling     | Tailwind CSS                  |
| Fonts       | Playfair Display + DM Sans    |
| Icons       | Lucide React                  |
| Payments    | Stripe (configured, simulated) |

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/lottery_db"
JWT_SECRET="your-secret-min-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DRAW_VERIFICATION_SECRET="your-draw-secret"
# Add Stripe keys for real payments
```

### 3. Set up the database
```bash
# Push schema to database
npm run db:push

# Seed with demo data (admin + player accounts, token packages, sample draw)
npm run db:seed
```

### 4. Run the app
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Credentials

| Role   | Email                   | Password        |
|--------|-------------------------|-----------------|
| Admin  | admin@lottery.com       | Admin@123456    |
| Player | player@lottery.com      | Player@123456   |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Home page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── buy-tickets/page.tsx        # Number picker + ticket purchase
│   ├── draw/page.tsx               # Live draw + countdown
│   ├── results/page.tsx            # Past results + ticket checker
│   ├── verify-id/page.tsx          # ID document upload
│   ├── player/
│   │   ├── page.tsx                # Player dashboard
│   │   └── tokens/page.tsx         # Token shop
│   ├── admin/
│   │   ├── page.tsx                # Admin dashboard
│   │   ├── verifications/page.tsx  # KYC review
│   │   ├── draws/
│   │   │   ├── page.tsx            # Draws list
│   │   │   ├── new/page.tsx        # Create draw
│   │   │   └── [id]/page.tsx       # Manage draw + trigger
│   │   ├── players/
│   │   │   ├── page.tsx            # All players
│   │   │   └── [id]/page.tsx       # Player detail + transactions
│   │   └── winners/page.tsx        # Winner verification
│   └── api/
│       ├── auth/{login,register,logout}/
│       ├── verify/submit/
│       ├── tokens/purchase/
│       ├── tickets/purchase/
│       └── admin/{verify-user,draws,winners}/
├── components/
│   ├── ui/Navbar.tsx
│   ├── lottery/{HomeClient,TicketPickerClient,LiveDrawClient,ResultsClient}
│   └── admin/{VerificationReviewClient,DrawManagerClient,AdminPlayersClient,AdminWinnersClient}
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── auth.ts                     # JWT session management
│   ├── draw-verification.ts        # Cryptographic proof system
│   └── utils.ts                    # Helpers
└── middleware.ts                   # Route protection
```

---

## Adding Stripe Payments

The token purchase API at `/api/tokens/purchase` currently simulates payment. To add real Stripe:

1. Add your Stripe keys to `.env.local`
2. Install: `npm install stripe @stripe/stripe-js`
3. Replace the purchase handler with a Stripe PaymentIntent flow
4. Add a webhook at `/api/webhooks/stripe` to handle `payment_intent.succeeded`

---

## Production Notes

- Store `drawSeed` securely before a draw (only publish the hash)
- Use S3 or Cloudinary for ID document storage instead of local filesystem
- Add rate limiting to auth endpoints
- Set up email notifications for KYC approvals and winner alerts
- Enable Stripe webhook signature verification
