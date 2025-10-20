import { NextRequest, NextResponse } from 'next/server';

// Mock customer database (replace with real database)
const customers = [
  {
    id: '1',
    email: 'customer@example.com',
    password: 'password', // Simple password for development
    name: 'John Customer',
    status: 'active',
    user_type: 'customer'
  },
  {
    id: '2',
    email: 'test@customer.com',
    password: 'password', // Simple password for development
    name: 'Test Customer',
    status: 'active',
    user_type: 'customer'
  },
  {
    id: '3',
    email: 'demo@customer.com',
    password: 'password', // Simple password for development
    name: 'Demo Customer',
    status: 'active',
    user_type: 'customer'
  }
];

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function POST(request: NextRequest) {
  try {
    const { email, password, csrf_token, user_type } = await request.json();

    // Security: Validate CSRF token
    if (!csrf_token) {
      return NextResponse.json(
        { message: 'CSRF token required' },
        { status: 400 }
      );
    }

    // Security: Validate user type
    if (user_type !== 'customer') {
      return NextResponse.json(
        { message: 'Invalid user type for this endpoint' },
        { status: 400 }
      );
    }

    // Security: Rate limiting by IP
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 10;

    const rateLimitKey = `login_${clientIP}`;
    const rateLimitData = rateLimitStore.get(rateLimitKey);

    if (rateLimitData) {
      if (now < rateLimitData.resetTime) {
        if (rateLimitData.count >= maxAttempts) {
          return NextResponse.json(
            { message: 'Too many login attempts. Please try again later.' },
            { status: 429 }
          );
        }
      } else {
        // Reset window
        rateLimitStore.delete(rateLimitKey);
      }
    }

    // Security: Input validation
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!email.includes('@') || email.length < 5) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Find customer
    const customer = customers.find(c => c.email.toLowerCase() === email.toLowerCase());

    if (!customer) {
      // Record failed attempt
      const currentCount = rateLimitData?.count || 0;
      rateLimitStore.set(rateLimitKey, {
        count: currentCount + 1,
        resetTime: now + windowMs
      });

      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Security: Check if account is disabled
    if (customer.status !== 'active') {
      return NextResponse.json(
        { message: 'Account is disabled. Please contact support.' },
        { status: 403 }
      );
    }

    // Security: Verify password (simple comparison for development)
    const isValidPassword = password === customer.password;

    if (!isValidPassword) {
      // Record failed attempt
      const currentCount = rateLimitData?.count || 0;
      rateLimitStore.set(rateLimitKey, {
        count: currentCount + 1,
        resetTime: now + windowMs
      });

      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Security: Clear rate limit on successful login
    rateLimitStore.delete(rateLimitKey);

    // Security: Generate simple token (for development)
    const token = Buffer.from(JSON.stringify({
      userId: customer.id,
      email: customer.email,
      userType: 'customer',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    })).toString('base64');

    // Security: Prepare user data (exclude sensitive information)
    const userData = {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      user_type: 'customer',
      status: customer.status
    };

    // Security: Set secure HTTP-only cookie
    const response = NextResponse.json({
      message: 'Login successful',
      token,
      user: userData
    });

    // Set secure cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Customer login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
