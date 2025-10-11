import sqlite3

conn = sqlite3.connect('/app/billing.db')
cursor = conn.cursor()

print('🔧 FIXING PAYMENT STATUS VALUES')
print('=' * 60)

# Check current status
cursor.execute('SELECT status, COUNT(*), SUM(amount) FROM payments GROUP BY status')
print('BEFORE FIX:')
for row in cursor.fetchall():
    print(f'  Status="{row[0]}", Count={row[1]}, Sum=${row[2] or 0:.2f}')

# The correct enum values are lowercase: "succeeded", "pending", "failed"
cursor.execute('UPDATE payments SET status="succeeded" WHERE status="PaymentStatus.SUCCEEDED"')
count1 = cursor.rowcount
cursor.execute('UPDATE payments SET status="pending" WHERE status="PaymentStatus.PENDING"')
count2 = cursor.rowcount
cursor.execute('UPDATE payments SET status="failed" WHERE status="PaymentStatus.FAILED"')
count3 = cursor.rowcount

conn.commit()
print(f'\nUpdated {count1 + count2 + count3} payments')

# Check after
cursor.execute('SELECT status, COUNT(*), SUM(amount) FROM payments GROUP BY status')
print('\nAFTER FIX:')
for row in cursor.fetchall():
    print(f'  Status="{row[0]}", Count={row[1]}, Sum=${row[2] or 0:.2f}')

# Check revenue
cursor.execute('SELECT SUM(amount) FROM payments WHERE status="succeeded"')
revenue = cursor.fetchone()[0]
print(f'\n💰 TOTAL REVENUE: ${revenue or 0:.2f}')

print('\n✅ DONE! Refresh dashboard now!')

conn.close()

