# AuctionHub — Final Implementation Plan (v3)

> This document supersedes all previous versions. All architecture decisions are locked. Development begins after this plan is copied to the project folder.

---

## Architecture Decision Summary

| Topic | Decision |
|-------|----------|
| Styling | Tailwind CSS |
| Icons | Lucide React (no emojis anywhere, ever) |
| UI philosophy | Clean, minimalist, professional |
| UI states | Every major page: Loading / Empty / Error / Success |
| State management | Context API + useReducer (no Redux) |
| JWT storage | httpOnly cookie (backend sets, frontend never reads) |
| AuthContext content | user, isAuthenticated, loading, login/logout/refreshUser |
| Axios config | `withCredentials: true` on every request |
| Auction scheduler | BullMQ + Redis (delayed jobs) |
| Email notifications | Nodemailer — modular `emailService.js` adapter |
| In-app notifications | DB record + Socket.IO push |
| Bid rule | `bid >= currentHighestBid + minBidIncrement` |
| First bid rule | `bid >= startingPrice + minBidIncrement` |
| Concurrent bids | Atomic MongoDB `findOneAndUpdate` with condition check |
| Admin creation | Seeded via script, no public route |
| Automated tests | None in Phase 1 |
| API format | `{ success, message, data }` — consistent across all routes |
| Logging | `express-async-handler` + global error handler, no `console.log` spam |
| Pagination | Default 12, max 50 (`?page=1&limit=12`) |
| Search scope | Auction: title, description, category |
| Image rules | JPG/JPEG/PNG/WEBP, max 5 files, max 5 MB each |
| Implementation order | Incremental: backend + frontend per feature (15 phases) |

---

## Auction Lifecycle

```
Draft → Live → Ended → Payment Pending → Sold
                    ↘ Payment Expired (24h timeout)
                    ↘ Cancelled (admin action)
```

### States

| Status | Description |
|--------|-------------|
| `draft` | Created but auction period not started |
| `live` | Auction is open for bidding |
| `ended` | Deadline passed, transitioning to payment |
| `payment_pending` | Highest bidder notified, awaiting payment (max 24h) |
| `sold` | Payment verified, transaction recorded |
| `payment_expired` | Winner did not pay within 24 hours |
| `cancelled` | Admin cancelled the auction |

### BullMQ Jobs Per Auction

| Job | Scheduled At | Action |
|-----|-------------|--------|
| `close-auction` | `endTime` | Mark ended → payment_pending, notify winner/seller |
| `ending-soon` | `endTime - 1 hour` | Notify all active bidders via email |
| `payment-timeout` | `endTime + 24 hours` | If not `sold`, mark `payment_expired`, notify |

---

## Concurrent Bid Protection

```js
// In bidController.js — atomic update with pre-condition
const minimumRequired = auction.currentHighestBid + auction.minBidIncrement;

const updated = await Auction.findOneAndUpdate(
  {
    _id: auctionId,
    status: 'live',
    currentHighestBid: auction.currentHighestBid, // snapshot check
  },
  {
    $set: {
      currentHighestBid: bidAmount,
      highestBidder: req.user._id,
    },
    $inc: { bidCount: 1 },
  },
  { new: true }
);

if (!updated) {
  // Another bid landed between our read and write
  throw new Error('Bid is no longer valid. Please try again.');
}
```

This guarantees that two simultaneous bids of ₹10,500 on a ₹10,000 auction result in exactly one winner and one rejection — without locks or transactions.

---

## Authorization Matrix

| Action | Buyer | Seller | Admin | Blocked |
|--------|-------|--------|-------|---------|
| Register / Login | ✓ | ✓ | — | ✗ |
| Browse auctions | ✓ | ✓ | ✓ | ✓ (view only) |
| Create auction | ✗ | ✓ | ✗ | ✗ |
| Edit auction (pre-bid) | ✗ | Own only | ✗ | ✗ |
| Delete auction (pre-bid) | ✗ | Own only | ✗ | ✗ |
| Place bid | ✓ | ✗ (own) | ✗ | ✗ |
| Make payment | Winner only | ✗ | ✗ | ✗ |
| Cancel auction | ✗ | ✗ | ✓ | ✗ |
| Block/unblock users | ✗ | ✗ | ✓ | — |

**Blocked user enforcement**: `protect` middleware checks `user.isBlocked` after JWT verification and returns `403 Account suspended` before any route handler runs.

---

## Database Schemas & Indexes

### User
```
name, email (unique index), password (hashed),
role (buyer | seller | admin), avatar,
isBlocked (default: false), createdAt
```

### Auction
```
title, description, images[], category,
seller (ref, index), startingPrice,
currentHighestBid, highestBidder (ref),
minBidIncrement, startTime, endTime (index),
status (index), bidCount (default: 0), createdAt

Compound index: { status, endTime }
Index: { seller }
Index: { category }
Text index: { title, description, category }   ← for search
```

### Bid
```
auction (ref), bidder (ref), amount, timestamp

Compound index: { auction: 1, timestamp: -1 }
```

### Payment
```
auction (ref), buyer (ref), seller (ref), amount,
razorpayOrderId, razorpayPaymentId (unique index),
razorpaySignature, status (pending | completed | failed),
createdAt
```

### Transaction
```
auction (ref), buyer (ref), seller (ref),
amount, payment (ref), createdAt
```

### Notification
```
recipient (ref, index), type, message,
auction (ref, optional), isRead (index, default: false),
createdAt

Compound index: { recipient: 1, isRead: 1 }
```

---

## Standard API Response Format

All controllers use this shape — no exceptions.

```json
// Success
{
  "success": true,
  "message": "Auction created successfully",
  "data": { ... }
}

// Success + pagination
{
  "success": true,
  "message": "Auctions fetched",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 87,
    "pages": 8
  }
}

// Error (handled by global errorHandler middleware)
{
  "success": false,
  "message": "Bid amount is below minimum required"
}
```

A helper `sendResponse(res, statusCode, message, data, pagination)` utility will be created in `utils/sendResponse.js`.

---

## Pagination Standard

```
GET /api/auctions?page=1&limit=12&status=live&category=electronics&search=watch

Default page  = 1
Default limit = 12
Max limit     = 50 (clamped server-side)
```

Applied to: auctions, bids, notifications, transactions, admin user list.

---

## Search

Auction search uses MongoDB text index on `title`, `description`, `category`.

```js
// In auctionController
if (search) {
  query.$text = { $search: search };
}
```

No other fields are searched.

---

## Image Upload Rules

Validated by `middleware/upload.js` before Cloudinary upload:
- Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`
- Max files per auction: **5**
- Max file size: **5 MB each** (enforced via Multer `limits.fileSize`)
- Rejected uploads return `400` with a clear error message.

---

## Authentication Architecture

### Backend
- JWT signed and set as httpOnly, sameSite: strict cookie.
- `protect` middleware reads cookie, verifies JWT, loads user from DB, checks `isBlocked`.

### Frontend (Critical)
- **Frontend never sees, stores, or manages the JWT.**
- Axios instance configured with `withCredentials: true`.
- `AuthContext` stores only:
  ```js
  {
    user: null | { _id, name, email, role, avatar },
    isAuthenticated: false,
    loading: true,
    login(credentials),
    logout(),
    refreshUser()   // calls GET /api/auth/me to rehydrate after page reload
  }
  ```
- On app mount, `refreshUser()` hits `GET /api/auth/me`. If cookie is valid → user is set. If not → user is null.
- No `localStorage`, no `sessionStorage` for auth data.

---

## Notification Service Architecture

```
notificationService.js
  createAndDeliverNotification(userId, type, message, auctionId?)
    ├── 1. Save to Notifications collection
    ├── 2. socket.to(`user:${userId}`).emit('notification:new', notification)
    └── 3. emailService.sendEmail({ to, subject, html })

emailService.js
  sendEmail({ to, subject, html })
    └── Nodemailer transporter (SMTP)
    // To swap provider: only this file changes
```

### Email Trigger Events

| Event | Who Gets Email |
|-------|---------------|
| Auction won | Winner |
| Auction ended — no win | All non-winning bidders |
| Auction ending soon (1 hr) | All active bidders |
| Payment successful | Buyer + Seller |
| Auction cancelled | All bidders |
| Payment expired | Seller (winner missed deadline) |
| Account blocked | Blocked user (optional) |

---

## Folder Structure (Final)

```
AuctionHub/
├── IMPLEMENTATION_PLAN.md     ← copy of this plan
├── STATUS.md                  ← development progress tracker
│
├── server/
│   ├── config/
│   │   ├── db.js
│   │   ├── cloudinary.js
│   │   └── redis.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── auctionController.js
│   │   ├── bidController.js
│   │   ├── paymentController.js
│   │   ├── transactionController.js
│   │   ├── notificationController.js
│   │   ├── userController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Auction.js
│   │   ├── Bid.js
│   │   ├── Payment.js
│   │   ├── Transaction.js
│   │   └── Notification.js
│   ├── queues/
│   │   ├── auctionQueue.js
│   │   └── auctionProcessor.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── auctionRoutes.js
│   │   ├── bidRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── userRoutes.js
│   │   └── adminRoutes.js
│   ├── services/
│   │   ├── notificationService.js
│   │   ├── emailService.js
│   │   └── auctionService.js
│   ├── socket/
│   │   └── socketHandler.js
│   ├── scripts/
│   │   └── seedAdmin.js
│   ├── utils/
│   │   └── sendResponse.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── client/
    ├── public/
    └── src/
        ├── api/
        │   └── axios.js
        ├── components/
        │   ├── common/
        │   │   ├── Navbar.jsx
        │   │   ├── Footer.jsx
        │   │   ├── ProtectedRoute.jsx
        │   │   ├── LoadingSpinner.jsx
        │   │   ├── EmptyState.jsx
        │   │   └── ErrorMessage.jsx
        │   ├── auction/
        │   │   ├── AuctionCard.jsx
        │   │   ├── AuctionForm.jsx
        │   │   ├── AuctionStatusBadge.jsx
        │   │   ├── CountdownTimer.jsx
        │   │   └── ImageGallery.jsx
        │   ├── bidding/
        │   │   ├── BidPanel.jsx
        │   │   └── BidHistory.jsx
        │   ├── payment/
        │   │   └── PaymentButton.jsx
        │   └── notifications/
        │       ├── NotificationBell.jsx
        │       └── NotificationItem.jsx
        ├── context/
        │   ├── AuthContext.jsx
        │   ├── SocketContext.jsx
        │   └── NotificationContext.jsx
        ├── hooks/
        │   ├── useCountdown.js
        │   └── useNotifications.js
        ├── pages/
        │   ├── HomePage.jsx
        │   ├── auth/
        │   │   ├── LoginPage.jsx
        │   │   └── RegisterPage.jsx
        │   ├── auctions/
        │   │   ├── AuctionsPage.jsx
        │   │   └── AuctionDetailPage.jsx
        │   ├── buyer/
        │   │   ├── BuyerDashboard.jsx
        │   │   └── WinsPage.jsx
        │   ├── seller/
        │   │   ├── SellerDashboard.jsx
        │   │   ├── CreateAuctionPage.jsx
        │   │   └── EditAuctionPage.jsx
        │   ├── payment/
        │   │   └── PaymentPage.jsx
        │   ├── notifications/
        │   │   └── NotificationsPage.jsx
        │   └── admin/
        │       ├── AdminDashboard.jsx
        │       ├── AdminUsersPage.jsx
        │       ├── AdminAuctionsPage.jsx
        │       └── AdminTransactionsPage.jsx
        ├── utils/
        │   ├── formatCurrency.js
        │   └── formatDate.js
        ├── App.jsx
        ├── main.jsx
        └── index.css
```

---

## Implementation Phases

| Phase | Scope | Verification |
|-------|-------|-------------|
| 1 | Project Setup (scaffolding, deps, env) | Both servers start |
| 2 | Database Models (all 6 schemas + indexes) | Models load without error |
| 3 | Auth Backend (register, login, logout, /me, protect middleware) | Postman/curl verified |
| 4 | Auth Frontend (Login, Register, AuthContext, ProtectedRoute) | Browser end-to-end |
| 5 | Auction Backend (CRUD, upload, pagination, search) | Postman verified |
| 6 | Auction Frontend (list page, detail page, seller create/edit) | Browser end-to-end |
| 7 | Live Bidding Backend (bid endpoint, validation, atomic update) | Postman verified |
| 8 | Live Bidding Frontend (BidPanel, BidHistory, Socket.IO) | Browser end-to-end |
| 9 | Queue Scheduler (BullMQ: close-auction, ending-soon, payment-timeout) | Timing verified |
| 10 | Notification System (DB + socket + Nodemailer email) | Email received |
| 11 | Payment Processing (Razorpay order + verify + status) | Test payment verified |
| 12 | Transaction Management (record, buyer/seller views) | Data visible in UI |
| 13 | Admin Module (users, auctions, transactions, stats) | All admin actions work |
| 14 | Final Integration (cross-module, regression) | Full workflow end-to-end |
| 15 | Cleanup, Documentation, README | README complete |

---

## Environment Variables

### `server/.env.example`
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/auctionhub
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRE=7d
COOKIE_EXPIRE_DAYS=7

REDIS_URL=redis://localhost:6379

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=AuctionHub <no-reply@auctionhub.com>

ADMIN_EMAIL=admin@auctionhub.com
ADMIN_PASSWORD=Admin@12345
ADMIN_NAME=Super Admin

CLIENT_URL=http://localhost:5173
```

### `client/.env.example`
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=
```

---

## Full API Reference

```
Auth
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/logout
  GET    /api/auth/me

Users
  GET    /api/users/profile
  PUT    /api/users/profile

Auctions
  GET    /api/auctions              ?page&limit&status&category&search
  GET    /api/auctions/:id
  POST   /api/auctions              (seller)
  PUT    /api/auctions/:id          (seller, pre-bid only)
  DELETE /api/auctions/:id          (seller, pre-bid only)

Bids
  POST   /api/bids                  (buyer, live auction)
  GET    /api/bids/auction/:id      ?page&limit

Payments
  POST   /api/payments/order        (winner, payment_pending status)
  POST   /api/payments/verify       (winner)
  GET    /api/payments/:auctionId

Transactions
  GET    /api/transactions/buyer    ?page&limit
  GET    /api/transactions/seller   ?page&limit

Notifications
  GET    /api/notifications         ?page&limit
  PATCH  /api/notifications/:id/read
  PATCH  /api/notifications/read-all

Admin
  GET    /api/admin/stats
  GET    /api/admin/users           ?page&limit
  PATCH  /api/admin/users/:id/block
  PATCH  /api/admin/users/:id/unblock
  GET    /api/admin/auctions        ?page&limit&status
  PATCH  /api/admin/auctions/:id/cancel
  GET    /api/admin/transactions    ?page&limit
```

---

## Verification Workflow (Per Phase)

1. Start both servers
2. Open `http://localhost:5173` in browser
3. Verify the feature as an end user
4. Check browser console — zero errors
5. Check terminal — zero unhandled exceptions
6. Fix all issues before proceeding
7. Regression: confirm previously working features still work
8. Deliver progress report (features, files, APIs, bugs, next phase)

---

## Backend Dependencies

```json
{
  "dependencies": {
    "express": "^4.18",
    "mongoose": "^8",
    "bcryptjs": "^2.4",
    "jsonwebtoken": "^9",
    "cookie-parser": "^1.4",
    "cors": "^2.8",
    "helmet": "^7",
    "express-rate-limit": "^7",
    "dotenv": "^16",
    "express-async-handler": "^1.2",
    "multer": "^1.4",
    "cloudinary": "^2",
    "multer-storage-cloudinary": "^4",
    "socket.io": "^4",
    "bullmq": "^5",
    "ioredis": "^5",
    "razorpay": "^2",
    "nodemailer": "^6"
  },
  "devDependencies": {
    "nodemon": "^3"
  }
}
```

## Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "axios": "^1",
    "socket.io-client": "^4",
    "lucide-react": "^0.400"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "tailwindcss": "^3",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}
```
