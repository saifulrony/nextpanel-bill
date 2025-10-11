# NextPanel Billing - Login & Registration System

✅ **Authentication system successfully created!**

## What's Been Created

### Backend Components
- ✅ User registration API endpoint with email validation
- ✅ Login API endpoint with JWT token generation
- ✅ User profile endpoint (get current user)
- ✅ Password hashing with bcrypt
- ✅ JWT authentication with access & refresh tokens
- ✅ Database models for users
- ✅ Pydantic schemas for validation

### Frontend Components
- ✅ Modern login page (`/login`)
- ✅ Registration page (`/register`)
- ✅ Auth context provider for global state management
- ✅ Protected route middleware for dashboard
- ✅ Public route middleware for auth pages
- ✅ Dashboard with user information
- ✅ Navigation component with logout
- ✅ Beautiful UI with Tailwind CSS
- ✅ TypeScript types and interfaces

### Documentation
- ✅ Comprehensive README with API documentation
- ✅ Setup instructions
- ✅ Usage examples
- ✅ Security guidelines
- ✅ Troubleshooting guide

### Testing
- ✅ Automated test script for API endpoints
- ✅ Quick start script for easy setup

## Quick Start

### Option 1: Using the Quick Start Script
```bash
cd /home/saiful/nextPanel/billing
./quick_start.sh
```

### Option 2: Manual Setup

#### Backend
```bash
cd /home/saiful/nextPanel/billing/billing-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/billing
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
DEBUG=True
EOF

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

#### Frontend
```bash
cd /home/saiful/nextPanel/billing/billing-frontend
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8001
EOF

# Start the dev server
npm run dev
```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **Login Page**: http://localhost:3000/login
- **Register Page**: http://localhost:3000/register
- **Dashboard**: http://localhost:3000/dashboard (requires login)

## Test the System

Run the automated test script:
```bash
cd /home/saiful/nextPanel/billing
./test_auth_system.sh
```

This will:
1. Check if backend is running
2. Test user registration
3. Test user login
4. Test getting current user
5. Test authentication with invalid token
6. Test login with wrong password
7. Test duplicate email registration

## Key Features

### Security
- 🔒 Passwords hashed with bcrypt
- 🔑 JWT-based authentication
- ⏱️ Token expiration (15 min for access, 7 days for refresh)
- 🛡️ Protected routes with middleware
- ✅ Input validation with Pydantic

### User Experience
- 📱 Responsive design (mobile & desktop)
- ⚡ Fast page loads with Next.js
- 🎨 Modern UI with Tailwind CSS
- 🔄 Auto-login after registration
- 💾 Persistent sessions with localStorage
- ↩️ Automatic redirects for auth flow

### Developer Experience
- 📝 TypeScript for type safety
- 🎯 React hooks for state management
- 🔧 Hot reload for development
- 📚 Interactive API documentation
- 🧪 Automated testing script

## File Structure

```
billing/
├── AUTH_SYSTEM_README.md          # Comprehensive documentation
├── QUICK_START.md                 # This file
├── quick_start.sh                 # Setup automation script
├── test_auth_system.sh            # Automated testing script
├── billing-backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   └── auth.py           # Auth endpoints
│   │   ├── core/
│   │   │   ├── config.py         # Configuration
│   │   │   ├── database.py       # Database setup
│   │   │   └── security.py       # Security utilities
│   │   ├── models/
│   │   │   └── __init__.py       # User model
│   │   ├── schemas/
│   │   │   └── __init__.py       # Pydantic schemas
│   │   └── main.py               # FastAPI app
│   └── requirements.txt
└── billing-frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/
    │   │   │   ├── layout.tsx    # Auth layout
    │   │   │   ├── login/page.tsx
    │   │   │   └── register/page.tsx
    │   │   ├── (dashboard)/
    │   │   │   ├── layout.tsx    # Dashboard layout
    │   │   │   └── dashboard/page.tsx
    │   │   ├── layout.tsx        # Root layout
    │   │   └── page.tsx          # Landing page
    │   ├── components/
    │   │   ├── auth/
    │   │   │   ├── ProtectedRoute.tsx
    │   │   │   └── PublicRoute.tsx
    │   │   └── dashboard/
    │   │       └── DashboardNav.tsx
    │   ├── contexts/
    │   │   └── AuthContext.tsx   # Auth state management
    │   ├── lib/
    │   │   └── api.ts            # API client
    │   └── types/
    │       └── auth.ts           # TypeScript types
    └── package.json
```

## Usage Examples

### Register a New User
```bash
curl -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "company_name": "Acme Inc"
  }'
```

### Login
```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:8001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Next Steps

1. **Start the application** using the quick start script
2. **Test the authentication** using the test script
3. **Customize the UI** to match your brand
4. **Add more features**:
   - Email verification
   - Password reset
   - 2FA authentication
   - User profile editing
   - Admin panel

## Documentation

For detailed documentation, see:
- [AUTH_SYSTEM_README.md](./AUTH_SYSTEM_README.md) - Complete system documentation
- [Backend API Docs](http://localhost:8001/docs) - Interactive API documentation (when running)

## Support

If you encounter any issues:
1. Check the troubleshooting section in AUTH_SYSTEM_README.md
2. Verify all services are running
3. Check logs for error messages
4. Ensure environment variables are set correctly

## License

MIT License
