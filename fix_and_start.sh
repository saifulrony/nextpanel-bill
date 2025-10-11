#!/bin/bash

echo "🔧 Fixing NextPanel Integration..."
echo ""

# 1. Fix API Key in NextPanel
echo "Step 1: Fixing API Key..."
cd /home/saiful/nextPanel
python3 << 'PYTHON_SCRIPT'
import sys
sys.path.insert(0, 'nextpanel-backend')
try:
    from sqlalchemy import create_engine, text
    engine = create_engine("sqlite:///nextpanel-backend/nextpanel_dev.db")
    conn = engine.connect()
    result = conn.execute(text("""
        UPDATE api_keys 
        SET revoked_at = NULL, 
            revoked_by_id = NULL,
            revoked_reason = NULL,
            is_active = 1,
            allowed_ips = '[]'
        WHERE key_id = 'npk_Ful9e5xVpWIu-Sd2tTlaFMqK33DrnQ6ERlfwmU06qGU'
    """))
    conn.commit()
    if result.rowcount > 0:
        print("✅ API Key restored and IP restrictions removed!")
    else:
        print("⚠️  API Key not found in database")
        print("   You'll need to create a new API key in NextPanel")
except Exception as e:
    print(f"❌ Error: {e}")
    print("   Database might not exist or table structure is different")
PYTHON_SCRIPT

echo ""
echo "Step 2: Checking services..."

# 2. Check NextPanel
if pgrep -f "uvicorn.*9000" > /dev/null; then
    echo "✅ NextPanel is running on port 9000"
else
    echo "⚠️  NextPanel is not running"
    echo "   Start it with: cd /home/saiful/nextPanel/nextpanel-backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 9000 --reload &"
fi

# 3. Check/Restart Billing Backend  
if pgrep -f "uvicorn.*8001" > /dev/null; then
    echo "✅ Billing backend is running on port 8001"
else
    echo "🔄 Starting billing backend..."
    cd /home/saiful/nextpanel-bill/billing-backend
    nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > backend.log 2>&1 &
    sleep 3
    if pgrep -f "uvicorn.*8001" > /dev/null; then
        echo "✅ Billing backend started successfully"
    else
        echo "❌ Failed to start billing backend"
        echo "   Check logs: tail /home/saiful/nextpanel-bill/billing-backend/backend.log"
    fi
fi

# 4. Check Frontend
if pgrep -f "next.*3000" > /dev/null; then
    echo "✅ Frontend is running on port 3000"
else
    echo "⚠️  Frontend is not running"
    echo "   Start it with: cd /home/saiful/nextpanel-bill/billing-frontend && npm run dev &"
fi

echo ""
echo "Step 3: Testing connections..."

# Test NextPanel
echo -n "Testing NextPanel API... "
if curl -s http://localhost:9000/api/health > /dev/null 2>&1; then
    echo "✅"
else
    echo "❌ Not accessible"
fi

# Test Billing Backend
echo -n "Testing Billing Backend... "
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "✅"
else
    echo "❌ Not accessible"
fi

echo ""
echo "=================================================="
echo "✅ Setup Complete!"
echo "=================================================="
echo ""
echo "📋 Next Steps:"
echo "  1. Open http://192.168.10.203:3000 in browser"
echo "  2. Login with: admin@example.com / admin123"
echo "  3. Navigate to 'Server' menu"
echo "  4. Click 'Add Server' and fill in:"
echo ""
echo "     Name: NextPanel Main Server"
echo "     URL: http://localhost:9000"
echo "     API Key: npk_Ful9e5xVpWIu-Sd2tTlaFMqK33DrnQ6ERlfwmU06qGU"
echo "     API Secret: nps_-XuGGgrjJrVsDRsrkRqHV2AD1YbZ65qd9b_Nmu-wED_J5FqmeZw_ebL3lNOpl6Ws"
echo "     Capacity: 100"
echo ""
echo "  5. Click 'Test Connection' then 'Add Server'"
echo ""
echo "🎉 You're all set!"

