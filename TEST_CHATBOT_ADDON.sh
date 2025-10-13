#!/bin/bash

echo "🔍 Testing Chatbot Addon System..."
echo ""

# Check if addons exist
echo "📦 Available addons in database:"
cd /home/saiful/nextpanel-bill/billing-backend
python3 -c "
import sqlite3
conn = sqlite3.connect('billing.db')
cursor = conn.cursor()
cursor.execute('SELECT display_name, name, category, price FROM addons WHERE name=\"ai_chatbot\"')
row = cursor.fetchone()
if row:
    print(f'  ✅ {row[0]} ({row[1]})')
    print(f'     Category: {row[2]}')
    print(f'     Price: \${row[3]} (FREE)' if row[3] == 0 else f'     Price: \${row[3]}')
else:
    print('  ❌ AI Chatbot addon not found!')
conn.close()
"

echo ""
echo "🔌 Current installations:"
python3 -c "
import sqlite3
conn = sqlite3.connect('billing.db')
cursor = conn.cursor()
cursor.execute('''
    SELECT a.display_name, ai.is_enabled 
    FROM addon_installations ai 
    JOIN addons a ON ai.addon_id = a.id
''')
rows = cursor.fetchall()
if rows:
    for row in rows:
        status = '✅ Enabled' if row[1] else '❌ Disabled'
        print(f'  • {row[0]}: {status}')
else:
    print('  ℹ️  No addons installed yet')
conn.close()
"

echo ""
echo "🌐 Backend API:"
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "  ✅ Backend is running"
else
    echo "  ❌ Backend is NOT running!"
fi

echo ""
echo "📝 Next steps:"
echo "  1. Clear localStorage in browser (F12 console: localStorage.clear())"
echo "  2. Log out and log back in"
echo "  3. Go to /marketplace"
echo "  4. Install 'AI Chatbot'"
echo "  5. Go to / (homepage)"
echo "  6. See chatbot appear! 🎉"

