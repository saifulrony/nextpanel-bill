# Create and Use Admin Account

## Quick Commands

### Make any user an admin:
```bash
cd /home/saiful/nextpanel-bill/billing-backend
python3 make_user_admin.py your-email@example.com
```

### List all users and their admin status:
```bash
cd /home/saiful/nextpanel-bill/billing-backend
python3 make_user_admin.py --list
```

### List only admins:
```bash
cd /home/saiful/nextpanel-bill/billing-backend
python3 make_user_admin.py --list-admins
```

## Current Admin Accounts

Based on the latest check, these are admin accounts:
- `invoice_test@example.com`
- `admin@test.com`
- `test@test.com` ✅ (Just made admin for you)

## To Fix 403 Error

1. **Clear browser storage** (localStorage):
   - Open DevTools → Application → Local Storage
   - Delete `access_token` and `refresh_token`
   
2. **Log out and log back in** with any account

3. **Use the payment features** - they should now work!

## Testing the Fix

After logging back in, test these pages:
- `/payments` - Transaction list (should work)
- `/payments/gateways` - Payment gateway management (requires admin)
- `/payments/gateways/add` - Add new gateway (requires admin)

