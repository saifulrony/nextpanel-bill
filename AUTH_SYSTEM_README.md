# NextPanel Billing - Authentication System

A complete login and registration system for the NextPanel Billing application with FastAPI backend and Next.js frontend.

## Features

### Backend (FastAPI)
- ✅ User registration with email validation
- ✅ Secure password hashing using bcrypt
- ✅ JWT-based authentication (access & refresh tokens)
- ✅ User profile endpoints
- ✅ Protected routes with Bearer token authentication
- ✅ Async PostgreSQL database support
- ✅ SQLAlchemy ORM models
- ✅ Pydantic schemas for validation

### Frontend (Next.js 15 + TypeScript)
- ✅ Modern login page with form validation
- ✅ Registration page with password confirmation
- ✅ Auth context provider for global state management
- ✅ Protected route middleware for dashboard pages
- ✅ Public route middleware for auth pages
- ✅ Beautiful UI with Tailwind CSS
- ✅ Responsive design for mobile and desktop
- ✅ Auto-login after registration
- ✅ Token storage in localStorage
- ✅ Dashboard with user information display

## Project Structure

```
billing/
├── billing-backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   └── auth.py          # Authentication endpoints
│   │   ├── core/
│   │   │   ├── config.py        # App configuration
│   │   │   ├── database.py      # Database setup
│   │   │   └── security.py      # JWT & password hashing
│   │   ├── models/
│   │   │   └── __init__.py      # User model
│   │   └── schemas/
│   │       └── __init__.py      # Pydantic schemas
│   └── requirements.txt
└── billing-frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/
    │   │   │   ├── layout.tsx   # Auth layout with PublicRoute
    │   │   │   ├── login/
    │   │   │   │   └── page.tsx # Login page
    │   │   │   └── register/
    │   │   │       └── page.tsx # Registration page
    │   │   ├── (dashboard)/
    │   │   │   ├── layout.tsx   # Dashboard layout with ProtectedRoute
    │   │   │   └── dashboard/
    │   │   │       └── page.tsx # Main dashboard
    │   │   ├── layout.tsx       # Root layout with AuthProvider
    │   │   └── page.tsx         # Landing page
    │   ├── components/
    │   │   ├── auth/
    │   │   │   ├── ProtectedRoute.tsx  # Protected route HOC
    │   │   │   └── PublicRoute.tsx     # Public route HOC
    │   │   └── dashboard/
    │   │       └── DashboardNav.tsx    # Dashboard navigation
    │   ├── contexts/
    │   │   └── AuthContext.tsx   # Auth state management
    │   ├── lib/
    │   │   └── api.ts            # Axios API client
    │   └── types/
    │       └── auth.ts           # TypeScript types
    └── package.json
```

## API Endpoints

### Authentication

#### Register User
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe",
  "company_name": "Acme Inc" (optional)
}

Response: 201 Created
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "company_name": "Acme Inc",
  "is_active": true,
  "created_at": "2025-01-01T00:00:00Z"
}
```

#### Login
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response: 200 OK
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

#### Get Current User
```
GET /api/v1/auth/me
Authorization: Bearer <access_token>

Response: 200 OK
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "company_name": "Acme Inc",
  "is_active": true,
  "created_at": "2025-01-01T00:00:00Z"
}
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd billing/billing-backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables (create `.env` file):
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/billing
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
DEBUG=True
```

4. Initialize the database:
```bash
# The database tables will be created automatically on first run
python -c "import asyncio; from app.core.database import init_db; asyncio.run(init_db())"
```

5. Run the backend server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd billing/billing-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (create `.env.local` file):
```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Documentation: http://localhost:8001/docs

## Usage

### User Registration Flow

1. Visit http://localhost:3000
2. Click "Get Started" or navigate to http://localhost:3000/register
3. Fill in the registration form:
   - Full Name
   - Email Address
   - Company Name (optional)
   - Password (minimum 8 characters)
   - Confirm Password
4. Accept terms and conditions
5. Click "Create account"
6. You'll be automatically logged in and redirected to the dashboard

### User Login Flow

1. Visit http://localhost:3000/login
2. Enter your email and password
3. Optionally check "Remember me"
4. Click "Sign in"
5. You'll be redirected to the dashboard

### Protected Routes

The following routes are protected and require authentication:
- `/dashboard` - Main dashboard
- `/licenses` - License management
- `/domains` - Domain management
- `/billing` - Billing information
- `/settings` - Account settings

If you try to access these routes without being logged in, you'll be redirected to the login page.

### Public Routes

The following routes redirect to the dashboard if you're already logged in:
- `/login` - Login page
- `/register` - Registration page

## Security Features

1. **Password Security**
   - Minimum 8 characters required
   - Passwords are hashed using bcrypt
   - Plain text passwords never stored

2. **JWT Tokens**
   - Access tokens expire after 15 minutes
   - Refresh tokens expire after 7 days
   - Tokens include user ID and are signed with a secret key

3. **API Security**
   - Bearer token authentication for protected endpoints
   - CORS configured for specific origins
   - Input validation using Pydantic schemas

4. **Frontend Security**
   - Tokens stored in localStorage (consider httpOnly cookies for production)
   - Protected routes automatically redirect unauthenticated users
   - Public routes prevent authenticated users from accessing auth pages

## Development

### Adding New Protected Routes

1. Create your page under `src/app/(dashboard)/`
2. The dashboard layout automatically applies `ProtectedRoute`

Example:
```typescript
// src/app/(dashboard)/my-page/page.tsx
export default function MyPage() {
  return <div>My Protected Page</div>;
}
```

### Adding Navigation Items

Edit `src/components/dashboard/DashboardNav.tsx`:
```typescript
const navigation = [
  // ... existing items
  { name: 'My Page', href: '/my-page', icon: MyIcon },
];
```

### Accessing User Information

Use the `useAuth` hook in any component:
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <div>
      <p>Welcome, {user?.full_name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Testing

### Manual Testing

1. **Registration Test**
   - Navigate to /register
   - Fill in valid information
   - Submit form
   - Verify you're redirected to dashboard
   - Check that user info is displayed

2. **Login Test**
   - Logout from dashboard
   - Navigate to /login
   - Enter credentials
   - Verify successful login and redirect

3. **Protected Route Test**
   - Logout
   - Try to access /dashboard directly
   - Verify redirect to /login

4. **Token Persistence Test**
   - Login
   - Refresh the page
   - Verify you remain logged in

### API Testing

Use the interactive API documentation at http://localhost:8001/docs to test endpoints.

Or use curl:
```bash
# Register
curl -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'

# Login
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get current user (replace TOKEN with actual token)
curl -X GET http://localhost:8001/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## Production Considerations

1. **Environment Variables**
   - Use strong, random SECRET_KEY
   - Configure production DATABASE_URL
   - Set DEBUG=False
   - Configure CORS_ORIGINS properly

2. **Security Enhancements**
   - Use httpOnly cookies instead of localStorage for tokens
   - Implement refresh token rotation
   - Add rate limiting to prevent brute force attacks
   - Add email verification for new registrations
   - Implement password reset functionality
   - Add 2FA support

3. **Database**
   - Use connection pooling
   - Set up database migrations with Alembic
   - Regular backups

4. **Monitoring**
   - Add logging for authentication events
   - Monitor failed login attempts
   - Track token usage

## Troubleshooting

### Backend Won't Start
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Check all dependencies are installed

### Frontend Can't Connect to Backend
- Verify backend is running on port 8001
- Check NEXT_PUBLIC_API_URL is set correctly
- Check CORS settings in backend config

### Login Not Working
- Check browser console for errors
- Verify credentials are correct
- Check backend logs
- Test API endpoint directly using /docs

### Tokens Not Persisting
- Check localStorage in browser dev tools
- Verify tokens are being saved after login
- Check for errors in AuthContext

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please open an issue on the project repository.

