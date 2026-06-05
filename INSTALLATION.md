# Installation & Environment Setup

## Prerequisites

Before starting, ensure you have:

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **MongoDB**
   - Option A: Local MongoDB Community Edition
     - Download: https://www.mongodb.com/try/download/community
     - Start service: `mongod` command
   - Option B: MongoDB Atlas (Cloud)
     - Register: https://www.mongodb.com/cloud/atlas
     - Free tier available

3. **Git** (optional, for version control)
   - Download: https://git-scm.com/

4. **Code Editor** (recommended)
   - VS Code: https://code.visualstudio.com/
   - Or any text editor of your choice

---

## Step-by-Step Installation

### Part 1: MongoDB Setup

#### Option A: Local MongoDB

**Windows:**
1. Download MongoDB Community Edition installer
2. Run installer and follow wizard
3. MongoDB installs as a Windows Service (auto-starts)
4. Verify installation by opening Command Prompt:
   ```bash
   mongod --version
   ```
   MongoDB should be running by default.

**Mac:**
```bash
# Using Homebrew (if installed)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Verify
mongod --version
```

**Linux (Ubuntu):**
```bash
sudo apt-get update
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verify
mongod --version
```

#### Option B: MongoDB Atlas (Recommended for Cloud)

1. Visit: https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a new cluster (free tier available)
4. Get connection string (looks like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database
   ```
5. Update `backend/.env` with this connection string

---

### Part 2: Backend Setup

```bash
# Navigate to backend folder
cd "Collection management/backend"

# Install dependencies
npm install

# (Optional) Initialize admin user
node setup.js

# Start backend server
npm start
```

**Expected Output:**
```
Server running on port 5000
MongoDB connected
```

✅ Backend is ready at `http://localhost:5000`

---

### Part 3: Frontend Setup

**In a NEW terminal window** (keep backend running):

```bash
# Navigate to frontend folder
cd "Collection management/frontend"

# Install dependencies
npm install

# Start frontend development server
npm start
```

**Expected Output:**
- Browser automatically opens
- Frontend available at `http://localhost:3000`
- Shows Finance Collection login page

✅ Frontend is ready at `http://localhost:3000`

---

## First Login

1. Frontend opens at `http://localhost:3000`
2. Enter credentials:
   - **Username:** `admin`
   - **Password:** `admin`
3. Click "Login"
4. Redirects to Dashboard

✅ You're now logged in and ready to use!

---

## Troubleshooting Installation

### Issue: "mongod: command not found"

**Solution:**
- MongoDB not installed or not in PATH
- Install MongoDB Community Edition properly
- Or use MongoDB Atlas (cloud version)

### Issue: "Port 5000 already in use"

**Solution:**
Edit `backend/.env`:
```
PORT=5001
```
Then restart backend with `npm start`

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Windows
set PORT=3001 && npm start

# Mac/Linux
PORT=3001 npm start
```

### Issue: "Cannot find module" errors

**Solution:**
```bash
# In the folder where error occurs
rm -rf node_modules
npm install
npm start
```

### Issue: MongoDB connection failed

**Check:**
1. Is MongoDB running?
   ```bash
   # Windows: Check Services app or Task Manager
   # Mac/Linux:
   ps aux | grep mongod
   ```

2. Is connection string correct?
   - Edit `backend/.env`
   - Verify MONGODB_URI

3. For MongoDB Atlas:
   - Check IP whitelist (allow your IP)
   - Verify username/password
   - Check network connectivity

### Issue: CORS errors in console

**Solution:**
- Ensure backend is running on port 5000
- Check proxy setting in `frontend/package.json`
- Verify CORS is enabled in `backend/server.js`

### Issue: Login fails with "Invalid credentials"

**Solution:**
```bash
# Reset admin user
cd backend
node setup.js
# Creates fresh admin: admin / admin
```

---

## Environment Configuration

### Backend `.env` File

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/finance-collection

# JWT
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRE=7d
```

**For Production:**
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/finance
JWT_SECRET=very_long_random_secret_key_here
JWT_EXPIRE=7d
```

### Frontend Configuration

No `.env` file needed, but `package.json` has proxy:
```json
"proxy": "http://localhost:5000"
```

This forwards API calls to backend.

---

## Development Tools Setup (Optional)

### VS Code Extensions (Recommended)

1. **REST Client** - Test APIs
2. **MongoDB for VS Code** - View database
3. **ES7+ React/Redux/React-Native snippets** - Faster coding
4. **Prettier** - Code formatting
5. **Thunder Client** - API testing

### MongoDB Compass (GUI)

Free tool to view/manage MongoDB:
- Download: https://www.mongodb.com/products/compass
- Connect to `mongodb://localhost:27017`
- View databases, collections, documents

### Postman (API Testing)

Test backend APIs:
- Download: https://www.postman.com/downloads/
- Create requests for `/api/customers`, `/api/payments`, etc.

---

## npm Scripts Reference

### Backend

```bash
npm start        # Start server (default)
npm run dev      # Start with auto-reload (requires nodemon)
```

### Frontend

```bash
npm start        # Start dev server
npm run build    # Create production build
npm test         # Run tests
npm run eject    # Expose configuration (⚠️ irreversible)
```

---

## Running Both Simultaneously

### Option 1: Separate Terminals (Recommended)

**Terminal 1:**
```bash
cd backend
npm start
```

**Terminal 2:**
```bash
cd frontend
npm start
```

### Option 2: Single Terminal (Using &)

```bash
# Windows: Not natively supported, use Option 1

# Mac/Linux:
(cd backend && npm start) & (cd frontend && npm start)
```

---

## Production Deployment Checklist

- [ ] Change JWT_SECRET in backend/.env
- [ ] Set NODE_ENV=production
- [ ] Change MongoDB connection to production database
- [ ] Run `npm run build` in frontend
- [ ] Use process manager for backend (PM2, etc.)
- [ ] Enable HTTPS on server
- [ ] Set up proper CORS origins
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Monitor error logs

---

## Quick Health Check

Verify everything is working:

```bash
# Backend health check
curl http://localhost:5000/api/health

# Expected response:
# {"status":"Server is running"}

# Login test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Expected: JWT token in response
```

---

## Support Resources

- **MongoDB Docs**: https://docs.mongodb.com/
- **Express Docs**: https://expressjs.com/
- **React Docs**: https://react.dev/
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Node.js Docs**: https://nodejs.org/docs/

---

## Summary

✅ **Installation Complete When:**
1. Backend runs on port 5000
2. Frontend runs on port 3000
3. MongoDB is connected
4. Login works with admin/admin
5. Dashboard displays properly

**Enjoy your Finance Collection Management System!** 🎉
