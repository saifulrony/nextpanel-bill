# VPS API Keys Setup Guide

## Overview

This feature allows customers to create API keys from the billing system (`http://192.168.10.203:4000`) to control their VPS servers programmatically. Customers can start, stop, restart, and check the status of their servers using these API keys.

## What Was Created

### Backend (Billing System)

1. **Model**: `app/models/vps_api_key.py`
   - Stores API keys with customer association
   - Tracks usage, expiration, and permissions

2. **API Endpoints**: `app/api/v1/vps_api_keys.py`
   - `GET /api/v1/customer/vps-api-keys` - List all API keys
   - `POST /api/v1/customer/vps-api-keys` - Create new API key
   - `GET /api/v1/customer/vps-api-keys/{id}` - Get specific API key
   - `PUT /api/v1/customer/vps-api-keys/{id}` - Update API key
   - `DELETE /api/v1/customer/vps-api-keys/{id}` - Delete API key
   - `POST /api/v1/customer/vps-api-keys/{id}/regenerate` - Regenerate API key

3. **Database Table**: `vps_api_keys`
   - Will be created automatically when models are loaded
   - Fields: id, customer_id, name, api_key, vps_panel_url, is_active, last_used_at, expires_at, description, permissions

### Frontend (Billing System)

1. **Page**: `src/app/customer/vps-api-keys/page.tsx`
   - Full UI for managing API keys
   - Create, view, regenerate, activate/deactivate, and delete keys
   - Shows usage instructions and examples

2. **Navigation**: Added to customer menu
   - Menu item: "VPS API Keys" with KeyIcon
   - Accessible from customer portal sidebar

3. **API Client**: Added `vpsAPIKeysAPI` to `src/lib/api.ts`

### VPS Panel Backend

1. **Updated Auth Middleware**: `backend/internal/middleware/auth.go`
   - Now supports both JWT tokens (from panel login) and API keys (from billing system)
   - API keys starting with "vps_" are validated against billing database
   - Checks for active status and expiration

## Setup Instructions

### 1. Database Migration

The `vps_api_keys` table will be created automatically when you start the billing backend. If you need to create it manually:

```sql
CREATE TABLE IF NOT EXISTS vps_api_keys (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    vps_panel_url TEXT,
    is_active INTEGER DEFAULT 1,
    last_used_at TEXT,
    expires_at TEXT,
    description TEXT,
    permissions TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    FOREIGN KEY (customer_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_vps_api_keys_customer_id ON vps_api_keys(customer_id);
CREATE INDEX IF NOT EXISTS idx_vps_api_keys_api_key ON vps_api_keys(api_key);
```

### 2. VPS Panel Database Connection

The VPS panel needs to connect to the billing database to validate API keys. Update the VPS panel's database connection to include access to the billing database, or create a shared database connection.

**Option A: Shared Database**
- Both systems use the same PostgreSQL database
- VPS panel can query `vps_api_keys` table directly

**Option B: Separate Databases with Connection**
- VPS panel connects to billing database for API key validation
- Add billing database connection string to VPS panel config

### 3. Configuration

No additional configuration needed. The system will:
- Auto-create the database table on first run
- Use default VPS panel URL: `http://192.168.10.203:12000`
- Allow customers to customize the VPS panel URL per API key

## Usage

### For Customers

1. Log in to billing system at `http://192.168.10.203:4000`
2. Navigate to "VPS API Keys" in the customer menu
3. Click "Create API Key"
4. Fill in:
   - Name (required)
   - VPS Panel URL (defaults to http://192.168.10.203:12000)
   - Description (optional)
   - Expiration (optional)
5. Copy the generated API key (shown only once)
6. Use the API key in API requests to control VPS servers

### API Usage Examples

#### Get Server Status
```bash
curl -X GET "http://192.168.10.203:12000/api/v1/server/status" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### Restart Server
```bash
curl -X POST "http://192.168.10.203:12000/api/v1/server/power" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "restart"}'
```

#### Shutdown Server
```bash
curl -X POST "http://192.168.10.203:12000/api/v1/server/power" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "shutdown"}'
```

#### Start Server
```bash
curl -X POST "http://192.168.10.203:12000/api/v1/server/power" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

#### Schedule Shutdown (in 10 minutes)
```bash
curl -X POST "http://192.168.10.203:12000/api/v1/server/power" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "shutdown", "delay": 10}'
```

## Security Features

1. **API Key Masking**: Keys are masked in listings (show first 8 and last 4 characters)
2. **Expiration Support**: Keys can have expiration dates
3. **Active/Inactive Status**: Keys can be deactivated without deletion
4. **Usage Tracking**: Last used timestamp is updated on each use
5. **Permissions**: Each key can have specific permissions (future enhancement)

## Next Steps

1. **Test the Integration**:
   - Create an API key in the billing system
   - Use it to make API calls to the VPS panel
   - Verify server control works

2. **Database Connection**:
   - Ensure VPS panel can access billing database for API key validation
   - Or implement a shared database connection

3. **Enhanced Permissions**:
   - Implement granular permissions per API key
   - Restrict certain actions based on key permissions

4. **Rate Limiting**:
   - Add rate limiting per API key
   - Track usage statistics

5. **Webhooks**:
   - Add webhook support for server status changes
   - Notify billing system of server events

## Troubleshooting

### API Key Not Working

1. Check if key is active in billing system
2. Verify key hasn't expired
3. Ensure VPS panel can access billing database
4. Check VPS panel logs for authentication errors

### Database Connection Issues

1. Verify database connection strings
2. Check database permissions
3. Ensure `vps_api_keys` table exists
4. Test database connection from VPS panel

### CORS Issues

1. Ensure CORS is configured in VPS panel
2. Check allowed origins include billing system URL
3. Verify Authorization header is being sent

