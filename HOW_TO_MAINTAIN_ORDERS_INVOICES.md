# How to Maintain Orders and Invoices

## 🎯 Quick Answer

**Orders** and **Invoices** are now properly linked! Here's how they work:

### The Relationship:
- **Order** = The purchase transaction (one-time event)
- **Invoice** = The billing document (can be from orders OR subscriptions)

### What Happens Now:

1. **When you create an Order:**
   - ✅ Order is created
   - ✅ Invoice is automatically created and linked to the order
   - ✅ Both share the same invoice number

2. **When a subscription renews:**
   - ✅ Invoice is created (linked to subscription, NOT order)
   - ✅ No new order is created

## 📋 How to Use

### View Orders:
- Go to `/admin/orders`
- Each order now has a linked invoice
- Click "View Invoice" to see the invoice details

### View Invoices:
- Go to `/admin/invoices` (or `/customer/invoices` for customers)
- Invoices show:
  - **"From Order"** badge if linked to an order
  - **"From Subscription"** badge if linked to a subscription

### Create an Order:
- When you create an order via `/admin/orders`, an invoice is automatically created
- The invoice is linked via `order_id`

### Create an Invoice Manually:
- You can still create invoices manually via `/admin/invoices`
- These won't have an `order_id` (they're standalone invoices)

## 🔧 Database Migration Required

Before using this feature, run the migration to add the `order_id` column:

```bash
cd /home/saiful/nextpanel-bill
python migrations/add_order_id_to_invoices.py
```

Or manually run SQL:
```sql
ALTER TABLE invoices ADD COLUMN order_id VARCHAR(36);
CREATE INDEX idx_invoices_order_id ON invoices(order_id);
```

## 📊 Key Differences

| Feature | Orders | Invoices |
|---------|--------|----------|
| **Purpose** | Purchase transaction | Billing document |
| **Created from** | Customer purchase | Orders OR Subscriptions |
| **Frequency** | One per purchase | One per billing cycle |
| **Status** | pending, completed, cancelled | draft, open, paid, overdue |
| **Linked to** | Customer | Customer + Order OR Subscription |

## ✅ Best Practices

1. **Always create invoices from orders** (now automatic!)
2. **For renewals, create invoices (not orders)** - link to subscription
3. **Use invoices for all billing** - orders are just the initial purchase
4. **Track payments on invoices** - not on orders

## 📖 Full Documentation

See `ORDERS_AND_INVOICES_GUIDE.md` for complete details.

