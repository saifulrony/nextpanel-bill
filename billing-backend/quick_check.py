import sqlite3
import sys
sys.path.insert(0, '/app')

conn = sqlite3.connect('/app/billing.db')
cursor = conn.cursor()

# Check invoices
cursor.execute('SELECT COUNT(*), SUM(total) FROM invoices')
inv_count, inv_total = cursor.fetchone()
print(f'INVOICES: {inv_count} total, ${inv_total or 0:.2f}')

# Check payments  
cursor.execute('SELECT COUNT(*), SUM(amount) FROM payments WHERE status="succeeded"')
pay_count, pay_sum = cursor.fetchone()
print(f'PAYMENTS (succeeded): {pay_count} total, ${pay_sum or 0:.2f}')

cursor.execute('SELECT status, COUNT(*), SUM(amount) FROM payments GROUP BY status')
print('\nAll payments by status:')
for row in cursor.fetchall():
    print(f'  {row[0]}: {row[1]} payments, ${row[2] or 0:.2f}')

conn.close()

