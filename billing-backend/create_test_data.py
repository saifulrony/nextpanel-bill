#!/usr/bin/env python3
"""
Create test data for the dashboard
"""
import sqlite3
import sys
import uuid
from datetime import datetime, timedelta
import random

# Connect to database
conn = sqlite3.connect('billing.db')
cursor = conn.cursor()

print("🎲 Creating Test Data for Dashboard...")
print("=" * 60)

# Get freshuser ID
cursor.execute("SELECT id FROM users WHERE email='freshuser@test.com'")
result = cursor.fetchone()
if not result:
    print("❌ User 'freshuser@test.com' not found!")
    sys.exit(1)

user_id = result[0]
print(f"✅ Using user: freshuser@test.com (ID: {user_id})")

# Get some plan IDs
cursor.execute("SELECT id, name, price_monthly FROM plans LIMIT 5")
plans = cursor.fetchall()

if not plans:
    print("❌ No plans found in database!")
    sys.exit(1)

print(f"\n✅ Found {len(plans)} plans")

# Create test payments
print("\n📦 Creating test orders/payments...")
payment_count = 10
now = datetime.utcnow()

for i in range(payment_count):
    plan_id, plan_name, price = random.choice(plans)
    
    # Create payment with random date in last 30 days
    days_ago = random.randint(0, 30)
    created_at = now - timedelta(days=days_ago)
    
    payment_id = str(uuid.uuid4())
    amount = float(price)
    status = random.choice(['succeeded', 'succeeded', 'succeeded', 'pending'])  # 75% succeeded
    
    cursor.execute("""
        INSERT INTO payments (id, user_id, amount, currency, status, payment_method, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        payment_id,
        user_id,
        amount,
        'USD',
        status,
        'card',
        f'{plan_name} - monthly',
        created_at
    ))
    
    print(f"   ✓ Payment {i+1}: ${amount:.2f} ({status}) - {days_ago} days ago")

conn.commit()

# Show summary
print("\n" + "=" * 60)
print("📊 DATABASE SUMMARY:")
print("=" * 60)

cursor.execute("SELECT COUNT(*) FROM users WHERE is_admin=0")
customers = cursor.fetchone()[0]
print(f"👥 Customers: {customers}")

cursor.execute("SELECT COUNT(*) FROM plans")
products = cursor.fetchone()[0]
print(f"📦 Products: {products}")

cursor.execute("SELECT COUNT(*) FROM payments")
total_orders = cursor.fetchone()[0]
print(f"🛒 Total Orders: {total_orders}")

cursor.execute("SELECT COUNT(*) FROM payments WHERE status='succeeded'")
completed = cursor.fetchone()[0]
print(f"✅ Completed Orders: {completed}")

cursor.execute("SELECT SUM(amount) FROM payments WHERE status='succeeded'")
revenue = cursor.fetchone()[0] or 0
print(f"💰 Total Revenue: ${revenue:.2f}")

cursor.execute("SELECT COUNT(*) FROM licenses")
licenses = cursor.fetchone()[0]
print(f"🔑 Licenses: {licenses}")

print("=" * 60)
print("✅ TEST DATA CREATED!")
print("=" * 60)
print("\n📱 NOW IN YOUR BROWSER:")
print("1. Clear localStorage (F12 → Console):")
print("   localStorage.clear(); window.location.href='/login';")
print("2. Login: freshuser@test.com / Test123!")
print("3. Go to /dashboard")
print("4. You should see real data now! 🎉")
print("=" * 60)

conn.close()

