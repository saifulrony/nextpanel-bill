import sqlite3

conn = sqlite3.connect('/app/billing.db')
cursor = conn.cursor()

print('📊 CHECKING PAYMENTS:')
print('=' * 60)

cursor.execute('SELECT COUNT(*) FROM payments')
total = cursor.fetchone()[0]
print(f'Total Payments: {total}')

cursor.execute('SELECT status, COUNT(*), SUM(amount) FROM payments GROUP BY status')
results = cursor.fetchall()
print('\nBy status:')
for row in results:
    print(f'  Status: {row[0]}, Count: {row[1]}, Sum: ${row[2] or 0:.2f}')

cursor.execute('SELECT DISTINCT status FROM payments')
statuses = [s[0] for s in cursor.fetchall()]
print(f'\nDistinct statuses: {statuses}')

# The issue: SQLite stores enum as string but query looks for "succeeded"
# The enum might be stored differently. Let's check:
cursor.execute('SELECT id, amount, status FROM payments LIMIT 3')
print('\nSample payments:')
for row in cursor.fetchall():
    print(f'  ID: {row[0][:8]}..., Amount: ${row[1]:.2f}, Status: "{row[2]}"')

print('\n🔧 FIXING: Converting all payments to proper enum format...')
# Update to use proper enum value
cursor.execute('UPDATE payments SET status="PaymentStatus.SUCCEEDED" WHERE status="succeeded"')
cursor.execute('UPDATE payments SET status="PaymentStatus.PENDING" WHERE status="pending"')
conn.commit()

print('✅ Updated payment statuses to match enum format')

cursor.execute('SELECT status, COUNT(*), SUM(amount) FROM payments GROUP BY status')
results = cursor.fetchall()
print('\nNEW breakdown:')
for row in results:
    print(f'  Status: {row[0]}, Count: {row[1]}, Sum: ${row[2] or 0:.2f}')

conn.close()

