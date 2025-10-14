# 🔧 API Setup Guide for Dynamic Components

## ⚠️ Important Note

The dynamic components are now working, but you need to set up the backend APIs for them to function properly.

---

## 🚀 Quick Fix

The components will now show helpful messages instead of crashing when APIs are not configured.

---

## 📋 Required API Endpoints

### 1. Domain Check API
**Endpoint:** `GET /api/domains/check?domain=example.com`

**Response:**
```json
{
  "domain": "example.com",
  "available": true,
  "price": "$12.99/year"
}
```

**Backend Implementation (Example):**
```javascript
// billing-backend/routes/domains.js
router.get('/check', async (req, res) => {
  const { domain } = req.query;
  
  // Check domain availability with your registrar API
  const isAvailable = await checkDomainAvailability(domain);
  
  res.json({
    domain,
    available: isAvailable,
    price: isAvailable ? '$12.99/year' : null
  });
});
```

---

### 2. Products API
**Endpoint:** `GET /api/products`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Web Hosting",
    "description": "Fast and reliable hosting",
    "price": 9.99,
    "image": "/images/hosting.jpg"
  },
  {
    "id": 2,
    "name": "Domain Registration",
    "description": "Register your perfect domain",
    "price": 12.99,
    "image": "/images/domain.jpg"
  }
]
```

**Backend Implementation:**
```javascript
// billing-backend/routes/products.js
router.get('/', async (req, res) => {
  // Get products from database
  const products = await Product.findAll();
  res.json(products);
});
```

---

### 3. Product Search API
**Endpoint:** `GET /api/products/search?q=hosting`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Web Hosting",
    "description": "Fast and reliable hosting",
    "price": 9.99
  }
]
```

**Backend Implementation:**
```javascript
// billing-backend/routes/products.js
router.get('/search', async (req, res) => {
  const { q } = req.query;
  
  // Search products
  const products = await Product.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } }
      ]
    }
  });
  
  res.json(products);
});
```

---

### 4. Contact Form API
**Endpoint:** `POST /api/contact`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I need help..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for contacting us!"
}
```

**Backend Implementation:**
```javascript
// billing-backend/routes/contact.js
router.post('/', async (req, res) => {
  const { name, email, message } = req.body;
  
  // Save to database
  await Contact.create({ name, email, message });
  
  // Send email notification
  await sendEmail({
    to: 'admin@example.com',
    subject: 'New Contact Form Submission',
    body: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
  });
  
  res.json({ success: true, message: 'Thank you for contacting us!' });
});
```

---

### 5. Newsletter API
**Endpoint:** `POST /api/newsletter`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed!"
}
```

**Backend Implementation:**
```javascript
// billing-backend/routes/newsletter.js
router.post('/', async (req, res) => {
  const { email } = req.body;
  
  // Save to database
  await Newsletter.create({ email });
  
  // Send welcome email
  await sendEmail({
    to: email,
    subject: 'Welcome to our Newsletter!',
    body: 'Thank you for subscribing...'
  });
  
  res.json({ success: true, message: 'Successfully subscribed!' });
});
```

---

## 🔄 CORS Configuration

Make sure your backend allows requests from the frontend:

```javascript
// billing-backend/server.js
const cors = require('cors');

app.use(cors({
  origin: 'http://192.168.10.203:4000',
  credentials: true
}));
```

---

## 🧪 Testing APIs

### Test with curl:

```bash
# Test Products API
curl http://192.168.10.203:8001/api/products

# Test Domain Check
curl "http://192.168.10.203:8001/api/domains/check?domain=example.com"

# Test Contact Form
curl -X POST http://192.168.10.203:8001/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","message":"Hello"}'
```

---

## ✅ Quick Setup Checklist

- [ ] Create `/api/domains/check` endpoint
- [ ] Create `/api/products` endpoint
- [ ] Create `/api/products/search` endpoint
- [ ] Create `/api/contact` endpoint
- [ ] Create `/api/newsletter` endpoint
- [ ] Configure CORS
- [ ] Test all endpoints
- [ ] Add to frontend proxy (if needed)

---

## 🎯 What Happens Now

### Without APIs Configured:
- ✅ Components render without crashing
- ✅ Show helpful messages
- ✅ No errors in console
- ℹ️ Display "API not configured" messages

### With APIs Configured:
- ✅ Full functionality
- ✅ Real data from backend
- ✅ Working forms and searches
- ✅ Dynamic content

---

## 💡 Quick Start

### Option 1: Use Mock Data (For Testing)

Create mock API endpoints in your backend:

```javascript
// billing-backend/routes/products.js
router.get('/', (req, res) => {
  res.json([
    {
      id: 1,
      name: "Web Hosting",
      description: "Fast and reliable hosting",
      price: 9.99,
      image: "/images/hosting.jpg"
    },
    {
      id: 2,
      name: "Domain Registration",
      description: "Register your perfect domain",
      price: 12.99,
      image: "/images/domain.jpg"
    }
  ]);
});
```

### Option 2: Connect to Database

Use your existing product database:

```javascript
router.get('/', async (req, res) => {
  const products = await db.query('SELECT * FROM products');
  res.json(products);
});
```

---

## 🚀 Next Steps

1. **Set up the APIs** in your backend
2. **Test each endpoint** with curl or Postman
3. **Add components** to your pages
4. **Test the full flow** from frontend to backend

---

## 📚 Documentation

- **DYNAMIC_COMPONENTS_GUIDE.md** - Complete component guide
- **HOW_TO_USE_PAGE_BUILDER.md** - Page builder guide
- **API Documentation** - Your backend API docs

---

**You're all set!** The components are ready to use once you configure the backend APIs. 🎉

