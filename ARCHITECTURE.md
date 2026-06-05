# System Architecture Documentation

## Overview

The Finance Collection Management System is a full-stack web application built with React, Node.js, Express, and MongoDB. It's designed to manage loan disbursement and weekly collection tracking for a personal finance collection business.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                          │
│  React App (React Router, Axios, Tailwind CSS)             │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              EXPRESS.JS SERVER (Port 5000)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Routes                            │  │
│  │  /api/auth    /api/customers    /api/payments       │  │
│  └────────────────────┬─────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Middleware (Auth, CORS, etc)              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Controllers                         │  │
│  │  Auth    Customer    Payment                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   Services                          │  │
│  │  PaymentSchedule    Dashboard                       │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ Mongoose ODM
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 MONGODB DATABASE                            │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │   Admin      │   Customer   │   Payment    │            │
│  │   Collection │   Collection │   Collection │            │
│  └──────────────┴──────────────┴──────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Component Structure

### Backend Architecture

#### Models Layer
```
models/
├── Admin.js
│   └── Handles admin authentication credentials
├── Customer.js
│   └── Stores customer loan details
└── Payment.js
    └── Tracks individual weekly payment records
```

#### Controller Layer
```
controllers/
├── authController.js
│   ├── register() - Create new admin user
│   └── login() - Authenticate admin
├── customerController.js
│   ├── addCustomer() - Create new customer loan
│   ├── getAllCustomers() - Fetch all customers
│   ├── getCustomerById() - Get single customer
│   ├── getCustomersByWeekDay() - Filter by collection day
│   ├── searchCustomers() - Search by name/phone
│   ├── updateCustomer() - Modify customer details
│   └── deleteCustomer() - Remove customer and payments
└── paymentController.js
    ├── getPaymentsByCustomer() - Get all payments for a customer
    ├── updatePayment() - Record payment collection
    ├── getPendingPayments() - List unpaid payments
    ├── getOverduePayments() - List past-due payments
    ├── getPaymentsByWeekDay() - Filter payments by day
    ├── getPaymentHistory() - Summary of all payments
    └── getDashboardStats() - Calculate dashboard metrics
```

#### Service Layer
```
services/
├── paymentScheduleService.js
│   ├── generatePaymentSchedule() - Create weekly payment entries
│   └── getNextDueDate() - Calculate next payment date
└── dashboardService.js
    └── getDashboardStats() - Aggregate statistics
```

#### Middleware Layer
```
middleware/
└── auth.js
    └── JWT token verification for protected routes
```

### Frontend Architecture

#### Pages (Route Components)
```
pages/
├── Login.js
│   └── Admin authentication UI
├── Dashboard.js
│   └── Statistics and metrics display
├── Customers.js
│   └── List all customers with CRUD
├── AddCustomer.js
│   └── Form to create new customer
├── CustomerDetails.js
│   └── View customer + payment schedule
├── DayWiseCustomers.js
│   └── Filter and manage payments by day
└── PendingPayments.js
    └── Track pending and overdue payments
```

#### Components (Reusable)
```
components/
├── Layout.js
│   └── Main app layout with sidebar
├── Sidebar.js
│   └── Navigation sidebar with day filters
└── ProtectedRoute.js
    └── Route protection with auth check
```

#### API Integration
```
api/
└── api.js
    ├── Axios instance with JWT interceptor
    ├── authAPI - Auth endpoints
    ├── customerAPI - Customer endpoints
    └── paymentAPI - Payment endpoints
```

## Data Flow

### Customer Creation Flow
```
1. User fills AddCustomer form
2. Frontend validates and sends POST /customers/add
3. Backend creates Customer document
4. paymentScheduleService generates Payment records
5. Returns success with customer ID
6. Frontend redirects to customer details
```

### Payment Update Flow
```
1. User opens CustomerDetails
2. Fetches customer and all related payments
3. User clicks "Update" on a payment
4. Submits received amount and status
5. Backend updates Payment document
6. Backend recalculates Customer totals:
   - totalPaid += receivedAmount
   - remainingBalance = amountGiven - totalPaid
   - loanStatus = "Completed" if remainingBalance <= 0
7. Returns updated payment
8. Frontend refreshes data
```

### Dashboard Stats Flow
```
1. Dashboard.js mounts
2. Calls paymentAPI.getDashboardStats()
3. Backend aggregates from Customer and Payment collections:
   - COUNT(customers)
   - SUM(amountGiven)
   - SUM(totalPaid)
   - SUM(remainingBalance)
   - COUNT(overdue payments)
   - COUNT(active loans)
4. Returns aggregated stats
5. Frontend displays in cards
```

## Database Schema

### Admin Collection
```javascript
{
  _id: ObjectId,
  username: String (unique, lowercase),
  password: String (hashed with bcrypt),
  createdAt: Date
}
```

**Relationships**: None (single admin system)

### Customer Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  wifeCaretaker: String,
  phone: String (10 digits, unique),
  address: String (required),
  amountGiven: Number (required),
  dateGiven: Date (required),
  collectionWeekDay: String (enum: Mon-Sun),
  weeklyEMI: Number (required),
  totalWeeks: Number (required),
  loanStatus: String (enum: Active|Completed|Closed),
  totalPaid: Number (calculated),
  remainingBalance: Number (calculated),
  createdAt: Date
}
```

**Relationships**: One-to-Many with Payment (via _id)

### Payment Collection
```javascript
{
  _id: ObjectId,
  customerId: ObjectId (ref: Customer),
  customerName: String (denormalized for quick access),
  weekNumber: Number (1-52),
  weekDay: String (enum: Mon-Sun),
  dueDate: Date (calculated on creation),
  emiAmount: Number,
  receivedAmount: Number (default: 0),
  receivedDate: Date,
  status: String (enum: Pending|Partial|Paid),
  remarks: String,
  createdAt: Date
}
```

**Relationships**: Many-to-One with Customer

**Indexes Recommended**:
```javascript
// For fast lookups
Payment.index({ customerId: 1 })
Payment.index({ dueDate: 1 })
Payment.index({ weekDay: 1 })
Payment.index({ status: 1 })
Customer.index({ phone: 1 })
Customer.index({ collectionWeekDay: 1 })
```

## Authentication Flow

```
Login Request
    ↓
[authController.login()]
    ↓
Verify credentials (bcrypt compare)
    ↓
Generate JWT token
    ↓
Return token to client
    ↓
Client stores token in localStorage
    ↓
All subsequent requests include "Authorization: Bearer <token>"
    ↓
[auth middleware] verifies token on protected routes
    ↓
Access granted/denied
```

## Payment Schedule Generation Algorithm

```javascript
function getNextDueDate(startDate, targetDay, weeksToAdd) {
  const startDayOfWeek = startDate.getDay();
  const targetDayIndex = daysOfWeek.indexOf(targetDay);
  
  // Calculate days to next occurrence of targetDay
  let daysToAdd = (targetDayIndex - startDayOfWeek + 7) % 7;
  if (daysToAdd === 0 && weeksToAdd === 0) daysToAdd = 7;
  
  // Add weeks
  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + daysToAdd + weeksToAdd * 7);
  
  return dueDate;
}
```

**Example**: If customer takes loan on Monday (Jan 1):
- Week 1 due: Monday, Jan 8
- Week 2 due: Monday, Jan 15
- Week 3 due: Monday, Jan 22
- ... and so on

## API Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Operation successful",
  "status": 200
}
```

### Error Response
```json
{
  "message": "Error description",
  "status": 400/401/500
}
```

## Security Considerations

1. **Authentication**: JWT tokens with expiration (7 days)
2. **Password**: Hashed with bcryptjs (salt rounds: 10)
3. **Authorization**: Protected routes with auth middleware
4. **Input Validation**: Express-validator on all inputs
5. **CORS**: Configured for specific origins
6. **Environment Variables**: Sensitive data in .env
7. **Data Validation**: Mongoose schema validation

## Performance Optimizations

1. **Database Indexing**: On frequently queried fields
2. **Pagination**: Can be added for large datasets
3. **Caching**: Consider Redis for dashboard stats
4. **Lean Queries**: Use `.lean()` for read-only operations
5. **Aggregation Pipeline**: For complex statistics

## Deployment Considerations

### Backend
- Use environment variables for all configs
- Set NODE_ENV=production
- Use a process manager (PM2, forever)
- Enable HTTPS in production
- Set secure CORS origins

### Frontend
- Build for production: `npm run build`
- Serve from CDN or static server
- Implement service workers for offline
- Optimize images and assets

### Database
- Use MongoDB Atlas for managed hosting
- Enable authentication
- Set IP whitelist
- Regular backups
- Monitor performance metrics

## Error Handling

```
Client Error (4xx)
├── 400: Bad Request (validation error)
├── 401: Unauthorized (invalid/missing token)
└── 404: Not Found (resource doesn't exist)

Server Error (5xx)
└── 500: Internal Server Error
```

## Testing Strategy

### Unit Tests (Recommended)
- Model validation
- Utility functions
- Service methods

### Integration Tests
- API endpoints
- Database operations
- Authentication flow

### End-to-End Tests
- Complete user workflows
- UI interactions
- Cross-page navigation

## Future Enhancements

1. **Multi-admin support** with role-based access
2. **Advanced filtering** and reporting
3. **SMS/Email notifications** for collections
4. **Payment receipt** PDF generation
5. **Bulk upload** customer data
6. **Analytics dashboard** with charts
7. **Mobile app** with offline support
8. **Automated reminders** via scheduled jobs
9. **Customer portal** for payment tracking
10. **Multi-currency support** for global use
