# Orders and Invoices Management Guide

## 📋 Understanding the Relationship

### **Orders** = Transaction/Purchase Event
- Created when customer makes a purchase
- Represents the **initial purchase** only
- One order per purchase
- Status: Pending → Processing → Completed/Cancelled

### **Invoices** = Billing Documents
- Created from Orders (initial purchase)
- Created from Subscriptions (renewals)
- Can be created standalone (manual billing)
- Multiple invoices per subscription (one per renewal)
- Status: Draft → Open → Paid/Overdue

## 🔄 Workflow

### Initial Purchase Flow:
```
1. Customer places Order
   ↓
2. Order creates Invoice (linked to order)
   ↓
3. Payment received → Invoice marked Paid
   ↓
4. Order status → Completed
   ↓
5. If recurring → Creates Subscription
```

### Renewal Flow (Monthly/Yearly):
```
1. Subscription renewal due
   ↓
2. System generates Invoice (linked to subscription, NOT order)
   ↓
3. Payment received → Invoice marked Paid
   ↓
4. Subscription period extended
   ↓
5. NO NEW ORDER CREATED
```

## 🗄️ Database Structure

### Order Table
```sql
orders
  - id (PK)
  - customer_id
  - status (pending, completed, cancelled)
  - invoice_number (for display, not FK)
  - order_number
  - items (JSON)
  - total
  - billing_period (monthly, yearly, one-time)
  - is_recurring (boolean)
  - created_at
```

### Invoice Table
```sql
invoices
  - id (PK)
  - user_id
  - order_id (FK → orders.id) -- Links to order for initial purchase
  - subscription_id (FK → subscriptions.id) -- Links to subscription for renewals
  - invoice_number (unique)
  - status (draft, open, paid, overdue)
  - total
  - is_recurring (boolean)
  - recurring_parent_id (for recurring invoices)
  - created_at
```

## ✅ Best Practices

### 1. **Order Creation**
- Always create an Invoice when creating an Order
- Link Invoice to Order via `order_id`
- Use same `invoice_number` for both (for consistency)

### 2. **Renewal Handling**
- Generate Invoice (not Order) for renewals
- Link Invoice to Subscription via `subscription_id`
- Leave `order_id` NULL for renewal invoices

### 3. **Querying**
- **To see all purchases**: Query Orders
- **To see all billing**: Query Invoices
- **To see order's invoice**: `SELECT * FROM invoices WHERE order_id = ?`
- **To see subscription invoices**: `SELECT * FROM invoices WHERE subscription_id = ?`

### 4. **Reporting**
- **Revenue from orders**: Sum of completed orders
- **Recurring revenue**: Sum of paid invoices linked to subscriptions
- **Outstanding**: Sum of open invoices

## 🎯 Implementation Checklist

- [x] Add `order_id` field to Invoice model
- [x] Update order creation to also create Invoice
- [ ] Update renewal process to create Invoice (not Order)
- [x] Add relationship: Order → Invoices (one-to-many)
- [x] Add relationship: Subscription → Invoices (one-to-many)
- [ ] Update admin UI to show invoices linked to orders
- [ ] Update admin UI to show invoices linked to subscriptions

## 📝 Database Migration

### Step 1: Add `order_id` column to invoices table

Run this SQL migration:

```sql
-- Add order_id column to invoices table
ALTER TABLE invoices ADD COLUMN order_id VARCHAR(36);
ALTER TABLE invoices ADD CONSTRAINT fk_invoice_order FOREIGN KEY (order_id) REFERENCES orders(id);

-- Create index for faster lookups
CREATE INDEX idx_invoices_order_id ON invoices(order_id);
```

### Step 2: Backfill existing data (optional)

If you have existing orders with invoice_numbers, you can link them:

```sql
-- Link invoices to orders by matching invoice_number
UPDATE invoices 
SET order_id = (
    SELECT id FROM orders 
    WHERE orders.invoice_number = invoices.invoice_number 
    LIMIT 1
)
WHERE order_id IS NULL 
AND EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.invoice_number = invoices.invoice_number
);
```

## 🔧 Code Changes Made

### 1. Invoice Model (`billing-backend/app/models/__init__.py`)
- Added `order_id` column with foreign key to `orders.id`
- Added `order` relationship to link back to Order

### 2. Order Model (`billing-backend/app/models/__init__.py`)
- Added `invoices` relationship to link to all invoices for this order

### 3. Order Creation (`billing-backend/app/api/v1/orders.py`)
- Automatically creates an Invoice record when an Order is created
- Links Invoice to Order via `order_id`
- Uses the same `invoice_number` for both

## 📊 Usage Examples

### Query invoices for an order:
```python
order = await db.get(Order, order_id)
invoices = order.invoices  # All invoices linked to this order
```

### Query order for an invoice:
```python
invoice = await db.get(Invoice, invoice_id)
if invoice.order_id:
    order = invoice.order  # The order this invoice is for
```

### Find all invoices from orders (not subscriptions):
```python
invoices = await db.execute(
    select(Invoice).where(Invoice.order_id.isnot(None))
)
```

### Find all renewal invoices (not from orders):
```python
invoices = await db.execute(
    select(Invoice).where(
        Invoice.order_id.is_(None),
        Invoice.subscription_id.isnot(None)
    )
)
```

## 🎨 Admin UI Recommendations

### Orders Page:
- Show "View Invoice" button/link for each order
- Display invoice status badge next to order status
- Show invoice number prominently

### Invoices Page:
- Add "Order" column showing order number (if linked)
- Add "Type" badge: "Order" vs "Renewal"
- Filter by type: "From Orders" vs "From Subscriptions"

### Order Details Modal:
- Show linked invoice(s) in a section
- Link to invoice details page
- Show invoice status

### Invoice Details Modal:
- Show linked order (if exists) in a section
- Link to order details page
- Show order status

