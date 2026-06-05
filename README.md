
# Finance Collection Management System

A full-stack web application for managing private finance collection records where money is given to customers and weekly payments are collected manually.

## Tech Stack

- **Frontend**: React 18 + Tailwind CSS + Lucide Icons
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Authentication**: JWT

## Features

### Core Features
- ✅ Admin authentication system
- ✅ Customer management with complete details
- ✅ Automatic weekly payment schedule generation
- ✅ Payment tracking and collection management
- ✅ Day-wise customer classification (Mon-Sun)
- ✅ Dashboard with key statistics
- ✅ Pending and overdue payment tracking
- ✅ Customer search functionality
- ✅ Responsive mobile-friendly UI

### Dashboard Features
- Total customers count
- Total amount given
- Total amount collected
- Pending collections amount
- Overdue payments count
- Active loans count

### Payment Management
- Weekly EMI tracking
- Payment status (Pending/Paid/Partial)
- Receivable amount tracking
- Remarks and notes
- Auto-calculation of remaining balance
- Loan status auto-update

## Folder Structure

```
Collection management/
├── backend/
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Customer.js
│   │   └── Payment.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   └── paymentController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── customer.js
│   │   └── payment.js
│   ├── middleware/
│   │   └── auth.js
│   ├── services/
│   │   ├── paymentScheduleService.js
│   │   └── dashboardService.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── api/
    │   │   └── api.js
    │   ├── components/
    │   │   ├── Layout.js
    │   │   ├── ProtectedRoute.js
    │   │   └── Sidebar.js
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Dashboard.js
    │   │   ├── Customers.js
    │   │   ├── AddCustomer.js
    │   │   ├── CustomerDetails.js
    │   │   ├── DayWiseCustomers.js
    │   │   └── PendingPayments.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    ├── package.json
    ├── tailwind.config.js
    └── postcss.config.js
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to backend folder:
```bash
cd "Collection management/backend"
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finance-collection
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

4. Create initial admin user (optional - run this script):
```bash
node -e "
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const admin = new Admin({ username: 'admin', password: 'admin' });
  await admin.save();
  console.log('Admin created: username=admin, password=admin');
  mongoose.connection.close();
}).catch(err => console.error(err));
"
```

5. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd "Collection management/frontend"
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will open automatically at `http://localhost:3000`

## Usage

### Login
- Navigate to login page
- Default credentials:
  - Username: `admin`
  - Password: `admin`

### Adding a Customer

1. Click "All Customers" in sidebar
2. Click "Add Customer" button
3. Fill in customer details:
   - Name, Wife/Caretaker name
   - Phone number (10 digits)
   - Address
   - Amount given
   - Date given
   - Collection weekday (Mon-Sun)
   - Weekly EMI amount
   - Total weeks for payment
4. Submit - system automatically generates payment schedule

### Managing Payments

1. **View Customer Details**: Click "Details" button in customer list
2. **Update Payment**: 
   - Click "Update" on any payment
   - Enter received amount
   - Select payment status (Pending/Partial/Paid)
   - Save changes
3. **Day-wise Collections**: Click any day in sidebar to see customers and payments for that day
4. **Pending Payments**: View all pending/overdue payments in dedicated section

### Dashboard Statistics

The dashboard displays real-time metrics:
- Total number of customers
- Total amount given to all customers
- Total amount collected from customers
- Pending collection amount
- Overdue payments count
- Active loans count

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new admin
- `POST /api/auth/login` - Admin login

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers/add` - Add new customer
- `GET /api/customers/:id` - Get customer details
- `GET /api/customers/weekday/:day` - Get customers by day
- `GET /api/customers/search?query=` - Search customers
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Payments
- `GET /api/payments/customer/:customerId` - Get customer payments
- `GET /api/payments/history/:customerId` - Get payment history
- `GET /api/payments/weekday/:day` - Get payments by day
- `GET /api/payments/pending/list` - Get pending payments
- `GET /api/payments/overdue/list` - Get overdue payments
- `GET /api/payments/dashboard/stats` - Get dashboard statistics
- `PUT /api/payments/:id` - Update payment

## Database Schema

### Customer
```javascript
{
  name: String,
  wifeCaretaker: String,
  phone: String (10 digits),
  address: String,
  amountGiven: Number,
  dateGiven: Date,
  collectionWeekDay: String (Mon-Sun),
  weeklyEMI: Number,
  totalWeeks: Number,
  loanStatus: String (Active/Completed/Closed),
  totalPaid: Number,
  remainingBalance: Number
}
```

### Payment
```javascript
{
  customerId: ObjectId,
  customerName: String,
  weekNumber: Number,
  weekDay: String,
  dueDate: Date,
  emiAmount: Number,
  receivedAmount: Number,
  receivedDate: Date,
  status: String (Pending/Paid/Partial),
  remarks: String
}
```

## Key Features Implementation

### Automatic Payment Schedule
When a customer is created, the system automatically:
- Generates payment entries for each week
- Calculates due dates based on the collection weekday
- Ensures all payments fall on the same weekday each week
- Creates Pending status for all initial payments

### Remaining Balance Calculation
- Automatically updated when payments are recorded
- Loan status changes to "Completed" when balance reaches 0
- Provides real-time visibility of outstanding amount

### Day-wise Classification
- Customers can be filtered by their collection day
- Shows all pending payments for that day
- Allows quick batch updates during collection rounds

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env file
- Verify connection string format

### Port Already in Use
- Change PORT in .env file
- Or kill the process using the port

### CORS Errors
- Ensure proxy setting in frontend package.json matches backend URL
- Check backend CORS middleware configuration

### Authentication Issues
- Clear localStorage and login again
- Verify JWT_SECRET in .env file

## Future Enhancements

- Excel export functionality
- SMS/Email reminders for overdue payments
- Payment receipt generation
- Monthly reports and analytics
- Customer communication history
- Multi-admin support with role-based access
- Payment receipt PDF generation
- Advanced filtering and sorting options

## License

MIT

## Support

For issues or questions, please refer to the documentation or contact support.
