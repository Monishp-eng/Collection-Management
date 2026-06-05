# Quick Start Guide

## 1. Start MongoDB

### Option A: Local MongoDB
```bash
# Windows
mongod

# Mac/Linux
mongod
```

### Option B: MongoDB Atlas (Cloud)
Update `.env` file with your cloud connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finance-collection
```

## 2. Backend Setup & Start

```bash
cd backend
npm install
npm start
```

✅ Backend running on `http://localhost:5000`

## 3. Frontend Setup & Start (New Terminal)

```bash
cd frontend
npm install
npm start
```

✅ Frontend opens automatically at `http://localhost:3000`

## 4. Login

Use default credentials:
- **Username**: `admin`
- **Password**: `admin`

## 5. Create Your First Customer

1. Click "All Customers" → "Add Customer"
2. Fill in the form:
   - Name: "John Doe"
   - Wife/Caretaker: "Jane Doe"
   - Phone: "9876543210"
   - Address: "123 Main Street"
   - Amount Given: "10000"
   - Date Given: Today's date
   - Collection Day: "Monday"
   - Weekly EMI: "500"
   - Total Weeks: "20"
3. Click "Add Customer"
4. System auto-generates 20 weekly payment entries

## 6. Track Payments

### View Day-wise Collections
- Click "Monday" in sidebar
- See all customers and payments for Monday
- Click "Update" to record payment

### Update a Payment
1. Go to "All Customers"
2. Click "Details" on a customer
3. Click "Update" on a payment
4. Enter received amount
5. Select status (Pending/Partial/Paid)
6. Click "Save"

### Track Pending Payments
- Click "Pending Payments" in sidebar
- View all pending and overdue payments
- Filter by type (Pending/Overdue)

## 7. Dashboard Overview

The dashboard automatically shows:
- 📊 Total Customers
- 💰 Total Amount Given
- ✅ Total Amount Collected
- ⏳ Pending Collections
- ⚠️ Overdue Payments
- 📈 Active Loans

---

## Common Tasks

### Search for a Customer
1. Go to "All Customers"
2. Use the search box
3. Search by name or phone number

### Delete a Customer
1. Go to "All Customers"
2. Click trash icon on the customer row
3. Confirm deletion (also deletes all payment records)

### Change Collection Day
1. Click customer "Details"
2. Update would need direct API call or extend UI
3. (Future: Add edit customer feature)

---

## Troubleshooting

### "Cannot find module" error
```bash
# In the folder where error occurs
npm install
```

### Port 5000 already in use
Edit `backend/.env`:
```
PORT=5001
```

### Port 3000 already in use
Set environment variable:
```bash
# Windows
set PORT=3001 && npm start

# Mac/Linux
PORT=3001 npm start
```

### MongoDB connection failed
- Check MongoDB is running
- Verify connection string in `.env`
- For cloud: ensure IP whitelist includes your IP

### Login not working
- Check backend is running
- Clear browser cache and cookies
- Verify admin credentials in database

---

## API Testing

### Using curl to test login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

### Add Customer:
```bash
curl -X POST http://localhost:5000/api/customers/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name":"John",
    "phone":"9876543210",
    "address":"123 Main",
    "amountGiven":10000,
    "dateGiven":"2024-01-01",
    "collectionWeekDay":"Monday",
    "weeklyEMI":500,
    "totalWeeks":20
  }'
```

---

## Features at a Glance

| Feature | Location |
|---------|----------|
| Dashboard Stats | `/dashboard` |
| All Customers | `/customers` |
| Add Customer | `/customers` → "Add Customer" button |
| Customer Details | `/customers` → "Details" button |
| Monday Collections | Sidebar → "Monday" |
| Tuesday Collections | Sidebar → "Tuesday" |
| ... (All days) | Sidebar → Day Name |
| Pending Payments | Sidebar → "Pending Payments" |
| Search | `/customers` → Search box |
| Logout | Sidebar → "Logout" |

---

## Next Steps

1. ✅ System is ready to use
2. Add your customers
3. Record payments during collection
4. Monitor dashboard for insights
5. (Optional) Customize to your needs

Enjoy! 🎉
