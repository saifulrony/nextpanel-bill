# Billing System Architecture

## 🏗️ System Overview

This billing system is designed to:
1. Sell account licenses for NextPanel
2. Register real domains via domain registrar reseller APIs (ResellerClub/Namecheap/OpenSRS)
3. Control NextPanel features via secure API integration
4. Handle high concurrent users (10,000+ simultaneous)

**Important Separation**:
- ✅ **Billing System**: Handles payments (Stripe), domain registration, license sales
- ✅ **NextPanel**: Handles hosting control panel, NO payments, NO domain registration
- 🔌 **Integration**: Secure API communication between the two systems

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BILLING SYSTEM                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Next.js 15      │         │   FastAPI        │          │
│  │  Frontend        │◄───────►│   Backend        │          │
│  │  (Port 3001)     │   API   │   (Port 8001)    │          │
│  └──────────────────┘         └──────────────────┘          │
│         │                              │                      │
│         │                              │                      │
│         │                              ▼                      │
│         │                     ┌─────────────────┐            │
│         │                     │  PostgreSQL     │            │
│         │                     │  Database       │            │
│         │                     │  (Port 5432)    │            │
│         │                     └─────────────────┘            │
│         │                              │                      │
│         │                              ▼                      │
│         │                     ┌─────────────────┐            │
│         │                     │  Redis/Valkey   │            │
│         │                     │  Cache & Queue  │            │
│         │                     │  (Port 6379)    │            │
│         │                     └─────────────────┘            │
│         │                              │                      │
└─────────┼──────────────────────────────┼──────────────────────┘
          │                              │
          │                              │
          │    API Integration (JWT)     │
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXTPANEL CONTROL PANEL                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Next.js         │         │   FastAPI        │          │
│  │  Frontend        │◄───────►│   Backend        │          │
│  │  (Port 3000)     │         │   (Port 9000)    │          │
│  └──────────────────┘         └──────────────────┘          │
└─────────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                               │
├─────────────────────────────────────────────────────────────┤
│  • Stripe Payment Processing (PCI compliant)                 │
│  • Domain Registrar Reseller API (ResellerClub/Namecheap)  │
│    - NOT a full ICANN registrar (saves $100k+ investment)   │
│    - Use reseller account ($0 setup, wholesale pricing)     │
│  • Email Service (SendGrid/AWS SES)                          │
│  • SMS Service (Twilio - 2FA)                               │
└─────────────────────────────────────────────────────────────┘

Note: See DOMAIN_REGISTRAR_OPTIONS.md for why using a registrar 
      reseller is better than becoming an ICANN accredited registrar.
```

## 🛠️ Technology Stack

### Frontend (Billing Portal)
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand or React Query
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts (for analytics)
- **Payment UI**: Stripe Elements

### Backend (Billing API)
- **Framework**: FastAPI 0.110+
- **ORM**: SQLAlchemy 2.0 (async)
- **Migrations**: Alembic
- **Validation**: Pydantic V2
- **Authentication**: JWT + OAuth2
- **Task Queue**: Celery or FastAPI BackgroundTasks with Redis
- **Caching**: Redis/Valkey
- **API Docs**: OpenAPI/Swagger (auto-generated)

### Database
- **Primary DB**: PostgreSQL 16+
  - JSONB for flexible license metadata
  - Row-level security
  - Partitioning for large transaction tables
- **Cache/Queue**: Redis 7+ or Valkey
  - Session storage
  - Rate limiting
  - Background job queue

### Security
- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: bcrypt for passwords, AES-256 for sensitive data
- **Rate Limiting**: Redis-based
- **CORS**: Configured for specific domains only
- **Webhooks**: HMAC signature verification (Stripe)

### DevOps & Monitoring
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (for scaling)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack or Loki
- **Error Tracking**: Sentry

## 📦 Database Schema

### Core Tables

```sql
-- Users (billing system users/customers)
users
  - id (UUID, PK)
  - email (unique, indexed)
  - password_hash
  - full_name
  - company_name
  - stripe_customer_id
  - created_at
  - updated_at
  - is_active

-- Licenses (NextPanel account licenses)
licenses
  - id (UUID, PK)
  - user_id (FK → users)
  - license_key (unique, indexed)
  - license_type (ENUM: starter, professional, enterprise)
  - status (ENUM: active, suspended, expired, cancelled)
  - features (JSONB) -- flexible feature flags
  - max_accounts
  - max_domains
  - max_databases
  - max_emails
  - nextpanel_user_id (FK to NextPanel system)
  - activation_date
  - expiry_date
  - auto_renew (boolean)
  - created_at
  - updated_at

-- Subscriptions (recurring billing)
subscriptions
  - id (UUID, PK)
  - license_id (FK → licenses)
  - stripe_subscription_id (unique)
  - plan_id (FK → plans)
  - status (ENUM: active, past_due, cancelled, trialing)
  - current_period_start
  - current_period_end
  - cancel_at_period_end (boolean)
  - created_at
  - updated_at

-- Plans (pricing tiers)
plans
  - id (UUID, PK)
  - name
  - description
  - price_monthly
  - price_yearly
  - features (JSONB)
  - max_accounts
  - max_domains
  - max_databases
  - stripe_price_id_monthly
  - stripe_price_id_yearly
  - is_active
  - created_at
  - updated_at

-- Domains (domain registrations)
domains
  - id (UUID, PK)
  - user_id (FK → users)
  - license_id (FK → licenses)
  - domain_name (unique, indexed)
  - registrar (ENUM: namecheap, godaddy, etc.)
  - registrar_domain_id
  - registration_date
  - expiry_date
  - auto_renew (boolean)
  - nameservers (JSONB)
  - status (ENUM: active, pending, expired, transferred)
  - created_at
  - updated_at

-- Payments (transaction history)
payments
  - id (UUID, PK)
  - user_id (FK → users)
  - license_id (FK → licenses, nullable)
  - stripe_payment_intent_id (unique)
  - amount
  - currency
  - status (ENUM: succeeded, pending, failed, refunded)
  - payment_method
  - description
  - metadata (JSONB)
  - created_at

-- Invoices
invoices
  - id (UUID, PK)
  - user_id (FK → users)
  - stripe_invoice_id (unique)
  - subscription_id (FK → subscriptions)
  - amount_due
  - amount_paid
  - currency
  - status (ENUM: draft, open, paid, void, uncollectible)
  - invoice_pdf_url
  - created_at
  - due_date
  - paid_at

-- API Keys (for NextPanel integration)
api_keys
  - id (UUID, PK)
  - license_id (FK → licenses)
  - key_hash (indexed)
  - name
  - permissions (JSONB)
  - last_used_at
  - expires_at
  - is_active
  - created_at

-- Webhooks (event logs from Stripe, etc.)
webhook_events
  - id (UUID, PK)
  - event_type
  - source (ENUM: stripe, registrar)
  - payload (JSONB)
  - processed (boolean)
  - processed_at
  - error_message
  - created_at
```

## 🔌 API Integration with NextPanel

### 1. License Validation API
```python
# Billing System → NextPanel
POST /api/v1/nextpanel/validate-license
{
  "license_key": "NP-XXXX-XXXX-XXXX",
  "feature": "create_database"
}
→ Response: { "valid": true, "remaining_quota": 5 }
```

### 2. Usage Reporting API
```python
# NextPanel → Billing System
POST /api/v1/billing/usage
{
  "license_key": "NP-XXXX-XXXX-XXXX",
  "resource": "databases",
  "action": "created",
  "count": 1
}
→ Response: { "success": true, "quota_remaining": 4 }
```

### 3. License Provisioning API
```python
# Automatic after payment success
POST /api/v1/nextpanel/provision
{
  "license_id": "uuid",
  "user_email": "customer@example.com",
  "plan": "professional",
  "features": {...}
}
→ Response: { "nextpanel_account_id": "uuid", "login_url": "..." }
```

## 🔐 Security Features

1. **API Authentication**
   - JWT tokens with 15-minute expiry
   - Refresh tokens with 7-day expiry
   - API keys with HMAC signature verification

2. **Rate Limiting**
   - 100 requests/minute per user
   - 1000 requests/minute per IP
   - Stripe webhook rate limit: 1000/hour

3. **Payment Security**
   - PCI DSS compliant (using Stripe)
   - No credit card data stored locally
   - Webhook signature verification

4. **License Protection**
   - Encrypted license keys
   - Hardware fingerprinting (optional)
   - One-time use activation tokens

## 📈 Scalability Features

### For High Concurrency (10,000+ users)

1. **Horizontal Scaling**
   - FastAPI: Multiple Uvicorn workers behind Nginx
   - Next.js: Deployed on Vercel/Cloudflare (edge computing)
   - PostgreSQL: Read replicas for queries
   - Redis: Cluster mode

2. **Caching Strategy**
   - Redis for user sessions (30min TTL)
   - CDN for static assets (Cloudflare)
   - Database query caching
   - License validation cache (5min TTL)

3. **Database Optimization**
   - Indexed columns: email, license_key, domain_name
   - Partitioning: payments table by date
   - Connection pooling: 20 connections per worker
   - Async SQLAlchemy queries

4. **Load Balancing**
   - Nginx for API requests
   - Cloudflare for frontend
   - Database read replicas

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Internet                            │
└─────────────────┬───────────────────────┬───────────────┘
                  │                       │
         ┌────────▼────────┐     ┌───────▼────────┐
         │  Cloudflare CDN │     │  Cloudflare    │
         │  (Frontend)     │     │  (API Proxy)   │
         └────────┬────────┘     └───────┬────────┘
                  │                       │
         ┌────────▼────────┐     ┌───────▼────────┐
         │   Next.js       │     │     Nginx      │
         │   (Vercel)      │     │  Load Balancer │
         └─────────────────┘     └───────┬────────┘
                                          │
                        ┌─────────────────┼─────────────────┐
                        │                 │                 │
                ┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
                │  FastAPI     │  │  FastAPI    │  │  FastAPI    │
                │  Instance 1  │  │  Instance 2 │  │  Instance 3 │
                └───────┬──────┘  └──────┬──────┘  └──────┬──────┘
                        │                │                 │
                        └─────────────────┼─────────────────┘
                                          │
                        ┌─────────────────┼─────────────────┐
                        │                 │                 │
                ┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
                │  PostgreSQL  │  │    Redis    │  │   Backup    │
                │   Primary    │  │   Cluster   │  │   Storage   │
                └──────────────┘  └─────────────┘  └─────────────┘
```

## 💰 Pricing Tiers (Example)

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| Price | $29/mo | $99/mo | $299/mo |
| Accounts | 1 | 5 | Unlimited |
| Domains | 3 | 25 | Unlimited |
| Databases | 5 | 50 | Unlimited |
| Email Accounts | 10 | 100 | Unlimited |
| Storage | 10GB | 100GB | 1TB |
| Support | Email | Priority | 24/7 Phone |

## 🔄 Development Workflow

1. **Local Development**
   ```bash
   docker-compose up  # Start all services
   cd billing-frontend && npm run dev  # Port 3001
   cd billing-backend && uvicorn main:app --reload --port 8001
   ```

2. **Testing**
   ```bash
   # Backend tests
   pytest tests/ --cov=app

   # Frontend tests
   npm run test

   # Integration tests
   npm run test:e2e
   ```

3. **Deployment**
   ```bash
   # Frontend (Vercel)
   vercel deploy --prod

   # Backend (Docker)
   docker build -t billing-backend .
   docker push registry/billing-backend:latest
   kubectl apply -f k8s/
   ```

## 📝 Next Steps

1. ✅ Review this architecture
2. ⬜ Set up development environment
3. ⬜ Create database schema
4. ⬜ Implement authentication system
5. ⬜ Integrate Stripe payments
6. ⬜ Build license management
7. ⬜ Create domain registration system
8. ⬜ Implement API integration with NextPanel
9. ⬜ Build frontend dashboard
10. ⬜ Add monitoring and logging
11. ⬜ Security audit
12. ⬜ Load testing
13. ⬜ Production deployment

