# AuctionHub

[![CI](https://github.com/saitejdot/AuctionHub/actions/workflows/ci.yml/badge.svg)](https://github.com/saitejdot/AuctionHub/actions/workflows/ci.yml)

A full-stack MERN online auction platform with real-time bidding, role-based access control, email notifications, and Razorpay payment processing.

---

## Features

- **Authentication** — JWT in httpOnly cookies, register/login/logout, role-based (buyer, seller, admin)
- **Auctions** — Create listings with images, set starting price, minimum bid increment, and end time
- **Live Bidding** — Real-time bids via Socket.IO with atomic concurrent bid protection
- **Queue Scheduler** — BullMQ + Redis for close-auction, ending-soon, payment-timeout jobs
- **Notifications** — In-app via Socket.IO + database; email via Nodemailer
- **Payments** — Razorpay integration with signature verification
- **Transactions** — Recorded on payment completion, visible to buyer and seller
- **Admin** — Platform stats, user management (block/unblock), auction management (cancel), all transactions

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS, Lucide React |
| Backend | Node.js 20, Express.js |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| Queue | BullMQ + Redis |
| Auth | JWT (httpOnly cookie) |
| Images | Cloudinary + Multer |
| Email | Nodemailer (SMTP / Gmail) |
| Payments | Razorpay |

---

## Project Structure

```
AuctionHub/
├── .github/
│   └── workflows/ci.yml   # GitHub Actions — build & lint
├── server/                # Express backend
│   ├── config/            # DB, Redis, Cloudinary setup
│   ├── controllers/       # Route handlers
│   ├── middleware/        # auth, upload, errorHandler
│   ├── models/            # Mongoose schemas
│   ├── queues/            # BullMQ queue + worker
│   ├── routes/            # Express routers
│   ├── scripts/           # seedAdmin.js
│   ├── services/          # emailService, notificationService
│   ├── socket/            # socketHandler.js
│   ├── utils/             # sendResponse.js
│   ├── .env.example       # ← copy to .env and fill in
│   ├── Procfile
│   └── server.js
└── client/                # React + Vite frontend
    ├── public/
    │   └── _redirects     # SPA routing for Netlify
    ├── src/
    │   ├── api/           # axios instance
    │   ├── components/    # shared UI components
    │   ├── context/       # Auth, Socket, Notification contexts
    │   ├── hooks/         # useCountdown
    │   ├── pages/         # all page components
    │   └── utils/         # formatCurrency, formatDate
    ├── .env.example       # ← copy to .env and fill in
    └── vercel.json        # SPA rewrites for Vercel
```

---

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- Cloudinary account
- Razorpay account (test keys)
- Gmail account with an App Password

### Installation

```bash
# Clone the repository
git clone https://github.com/saitejdot/AuctionHub.git
cd AuctionHub

# Install all dependencies
npm run install:all
# or manually:
cd server && npm install
cd ../client && npm install
```

### Environment Setup

```bash
# Server
cp server/.env.example server/.env

# Client
cp client/.env.example client/.env
```

Fill in `server/.env` — see the table below for each variable.

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string (64+ chars) |
| `JWT_EXPIRE` | e.g. `7d` |
| `COOKIE_EXPIRE_DAYS` | e.g. `7` |
| `REDIS_URL` | Redis URL (local: `redis://localhost:6379`) |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `RAZORPAY_KEY_ID` | Razorpay test/live key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay test/live key secret |
| `SMTP_HOST` | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | e.g. `587` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Gmail App Password (not your login password) |
| `SMTP_FROM` | Display name + address |
| `ADMIN_EMAIL` | Seeded admin email |
| `ADMIN_PASSWORD` | Seeded admin password |
| `CLIENT_URL` | e.g. `http://localhost:5173` |

Fill in `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
```

### Seed Admin Account

```bash
cd server
node scripts/seedAdmin.js
```

### Run Development Servers

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:5000/api  
- Health check: http://localhost:5000/api/health

---

## Deployment

### Stack

| Service | Platform |
|---------|----------|
| Frontend | [Vercel](https://vercel.com) (free) |
| Backend | [Render](https://render.com) (free) |
| Redis | [Upstash](https://console.upstash.com) (free) |
| Database | MongoDB Atlas (free M0 cluster) |

---

### 1 — Upstash Redis

1. Go to [console.upstash.com](https://console.upstash.com) → **Create Database**
2. Choose a region close to your Render region
3. Copy the **Redis URL** (starts with `rediss://`) — you'll need it for the backend env vars

---

### 2 — Deploy Backend on Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo: `saitejdot/AuctionHub`
3. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Node Version**: `20`
4. Add all environment variables from `server/.env.example`:
   - Set `NODE_ENV=production`
   - Set `REDIS_URL` to your Upstash Redis URL
   - Set `CLIENT_URL` to your Vercel frontend URL (add after step 3, or update after deploying frontend)
5. Click **Deploy** — note your Render URL (e.g. `https://auctionhub-api.onrender.com`)

> **Note**: Render free tier spins down after inactivity. The first request after sleep may take ~30 seconds.

---

### 3 — Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import `saitejdot/AuctionHub`
2. Configure:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variables:
   ```
   VITE_API_URL=https://auctionhub-api.onrender.com/api
   VITE_SOCKET_URL=https://auctionhub-api.onrender.com
   VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
   ```
4. Click **Deploy** — note your Vercel URL (e.g. `https://auctionhub.vercel.app`)

---

### 4 — Update Backend CORS

Go back to Render → your service → **Environment** and update:

```
CLIENT_URL=https://auctionhub.vercel.app
```

Redeploy if Render doesn't do it automatically.

---

### 5 — Seed Admin on Production

In Render's **Shell** tab (or via SSH):

```bash
node scripts/seedAdmin.js
```

---

## API Reference

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/auctions          ?page&limit&status&category&search
GET    /api/auctions/:id
POST   /api/auctions          (seller)
PUT    /api/auctions/:id      (seller, pre-bid)
DELETE /api/auctions/:id      (seller, pre-bid)

POST   /api/bids
GET    /api/bids/auction/:id

POST   /api/payments/order
POST   /api/payments/verify
GET    /api/payments/:auctionId

GET    /api/transactions/buyer
GET    /api/transactions/seller

GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all

GET    /api/admin/stats
GET    /api/admin/users
PATCH  /api/admin/users/:id/block
PATCH  /api/admin/users/:id/unblock
GET    /api/admin/auctions
PATCH  /api/admin/auctions/:id/cancel
GET    /api/admin/transactions
```

---

## Auction Lifecycle

```
Draft → Live → Ended → Payment Pending → Sold
                    ↘ Payment Expired (24h timeout)
                    ↘ Cancelled (admin action)
```

---

## Bid Rules

- `bid >= currentHighestBid + minBidIncrement`
- Atomic MongoDB `findOneAndUpdate` prevents concurrent bid race conditions
- Sellers cannot bid on their own auctions
- Only buyers can place bids

---

## License

Built as an academic project demonstration.
