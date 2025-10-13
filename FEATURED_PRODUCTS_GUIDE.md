# Featured Products System - Complete Guide

## Overview
The pricing section on the homepage is now **fully dynamic** and displays products marked as "featured" from your database. You can easily control which products appear on the homepage directly from the dashboard.

## What Changed

### ✅ Before (Static)
- Hardcoded pricing cards (Starter, Professional, Enterprise)
- Manual code changes required to update pricing
- No flexibility or control from dashboard

### ✅ After (Dynamic)
- Products loaded from database in real-time
- Select which products to feature from dashboard
- Control display order
- Automatic layout adjustment (1, 2, or 3 columns)
- "Add to Cart" functionality built-in

## New Features

### 1. Database Schema Updates
**New Fields Added to `plans` Table:**
- `is_featured` (Boolean) - Mark product to show on homepage
- `sort_order` (Integer) - Control display order (lower = first)

### 2. Backend API Updates
**GET /api/v1/plans**
- New parameter: `is_featured=true` - Filter only featured products
- Sorting by `sort_order` when filtering featured products
- Update endpoint includes `is_featured` and `sort_order` fields

### 3. Dashboard UI - Featured Toggle
**Location:** `/dashboard/products`

**New Controls:**
- ⭐ **Star Button** - Click to toggle featured status
  - Outline star = Not featured
  - Solid yellow star = Featured on homepage
- **Featured Badge** - Yellow "⭐ Featured" badge appears on featured products
- **Hover Tooltip** - Shows "Feature on homepage" or "Remove from homepage"

### 4. Dynamic Homepage
**Location:** `/` (Public homepage)

**Features:**
- Loads featured products automatically on page load
- Responsive grid layout:
  - 1 product: Centered, single column
  - 2 products: Two columns
  - 3+ products: Three columns
- Middle product gets "POPULAR" badge and highlighted style
- Shows product features dynamically from database
- "Add to Cart" button on each product
- "View All Products" link to `/shop`
- Empty state message if no featured products

## How to Use

### Step 1: Run Database Migration

First, update your database to add the new columns:

```bash
cd /home/saiful/nextpanel-bill/billing-backend
python add_featured_columns.py
```

**Expected Output:**
```
🔄 Starting database migration...
Database: your-database
Adding is_featured column...
✅ Added is_featured column
Adding sort_order column...
✅ Added sort_order column

✅ Migration completed successfully!
```

### Step 2: Mark Products as Featured

1. **Login to Dashboard**: Go to `/login`
2. **Navigate to Products**: Click "Products" in sidebar
3. **Select Products**: Find products you want to feature
4. **Click Star Button**: Click the ⭐ icon in top-right of product card
5. **Verify**: Yellow star and "Featured" badge should appear

### Step 3: Control Display Order (Optional)

The `sort_order` field controls which order products appear:
- Lower numbers appear first (0, 1, 2, ...)
- Default is 0 for all products
- Edit products via API or database to set custom order

**Example using API:**
```bash
curl -X PUT http://localhost:8001/api/v1/plans/{product_id} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_featured": true, "sort_order": 1}'
```

### Step 4: View on Homepage

1. Visit homepage: `http://localhost:3000/`
2. Scroll to "Featured Products" section
3. See your selected products displayed dynamically

## Product Display Logic

### Automatic Layout
```
1 product  → Single centered column (max-width)
2 products → Two columns, centered
3 products → Three columns, middle one highlighted as "POPULAR"
4+ products → Three columns, second one highlighted
```

### Popular Badge
- Automatically applied to middle product in 3-column layout
- Gets indigo background and "POPULAR" yellow badge
- Stands out with `scale-105` transform

### Features Displayed
Products show:
- Name and description
- Monthly price
- Max accounts, domains, databases, emails
- Additional custom features from `features` JSON
- Handles "Unlimited" (999999 value) properly

## Best Practices

### Recommended Setup

**For 3 Products (Ideal):**
1. **Basic/Starter Plan** - sort_order: 0 (left)
2. **Professional Plan** - sort_order: 1 (middle, becomes "POPULAR")
3. **Enterprise Plan** - sort_order: 2 (right)

**For 2 Products:**
- Smaller plan on left
- Larger plan on right

**For 1 Product:**
- Your most popular or best-value plan

### Pricing Strategy
- Feature 1-3 products maximum for clarity
- Show different tiers (Basic, Pro, Enterprise)
- Make middle plan most attractive (gets auto-highlight)
- Use clear, compelling product names

### Feature Highlighting
- Add important features to `features` JSON in products
- First 2 custom features show on homepage cards
- Use clear feature names (they auto-format: `feature_name` → "Feature Name")

## Technical Details

### API Endpoints

**Get Featured Products:**
```http
GET /api/v1/plans?is_active=true&is_featured=true
```

**Toggle Featured Status:**
```http
PUT /api/v1/plans/{product_id}
Content-Type: application/json

{
  "is_featured": true,
  "sort_order": 1
}
```

### Frontend Components

**HomePage (`/app/page.tsx`):**
- Fetches featured products on mount
- Handles loading and empty states
- Responsive grid with automatic column detection
- Add to cart integration

**Products Dashboard (`/app/(dashboard)/products/page.tsx`):**
- Star button toggle for featured status
- Visual feedback (solid vs outline star)
- Featured badge display
- Real-time updates after toggle

### Database Schema

**plans Table:**
```sql
CREATE TABLE plans (
  -- ... existing fields ...
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  -- ... other fields ...
);
```

## Troubleshooting

### Products Not Showing on Homepage

**Check:**
1. Product `is_active` = true
2. Product `is_featured` = true  
3. Database migration ran successfully
4. Backend server restarted after migration
5. Frontend cleared cache / hard refresh

**Solution:**
```bash
# Verify database
SELECT name, is_active, is_featured, sort_order FROM plans;

# If columns missing, run migration
python add_featured_columns.py

# Restart backend
# Press Ctrl+C, then restart
```

### Star Button Not Working

**Check:**
1. Logged in as admin
2. Backend server running
3. No console errors in browser
4. Network tab shows PUT request succeeding

**Debug:**
```javascript
// Check browser console for errors
// Should see: "Updated plan: Product Name"
```

### Products in Wrong Order

**Fix:** Update sort_order values:
```sql
-- Set order manually
UPDATE plans SET sort_order = 0 WHERE id = 'starter-plan-id';
UPDATE plans SET sort_order = 1 WHERE id = 'pro-plan-id';
UPDATE plans SET sort_order = 2 WHERE id = 'enterprise-plan-id';
```

## Advanced Customization

### Change "POPULAR" Badge Logic

Edit `/app/page.tsx` line 285:
```typescript
const isPopular = index === 1 && featuredProducts.length === 3;
// Change to:
const isPopular = product.id === 'your-specific-product-id';
// Or:
const isPopular = product.sort_order === 1;
```

### Add More Featured Product Fields

1. Add field to database schema
2. Update `Plan` model in `app/models/__init__.py`
3. Update schemas in `app/schemas/__init__.py`
4. Update frontend `FeaturedProduct` interface
5. Display in homepage template

### Custom Featured Section Title

Edit `/app/page.tsx` line 259-264:
```typescript
<h3 className="text-3xl font-bold text-center text-gray-900 mb-4">
  Your Custom Title Here
</h3>
<p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
  Your custom description here
</p>
```

## Testing

### Test the Complete Flow:

1. **Setup**:
   ```bash
   # Terminal 1: Backend
   cd billing-backend
   python add_featured_columns.py
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
   
   # Terminal 2: Frontend
   cd billing-frontend
   npm run dev
   ```

2. **Mark Product as Featured**:
   - Visit `http://localhost:3000/dashboard/products`
   - Click star on 2-3 products

3. **View Homepage**:
   - Visit `http://localhost:3000/`
   - Scroll to "Featured Products"
   - Verify products display correctly

4. **Test Add to Cart**:
   - Click "Add to Cart" on a featured product
   - Check cart icon updates (badge shows count)
   - Verify in `/cart` page

## Files Modified

### Backend:
- ✅ `/app/models/__init__.py` - Added is_featured, sort_order to Plan model
- ✅ `/app/schemas/__init__.py` - Updated PlanResponse and PlanUpdateRequest
- ✅ `/app/api/v1/plans.py` - Added is_featured filter, sort logic, update handling
- ✅ `add_featured_columns.py` - Migration script (NEW)

### Frontend:
- ✅ `/app/page.tsx` - Dynamic featured products section
- ✅ `/app/(dashboard)/products/page.tsx` - Star toggle button and featured badge

## Benefits

### For Administrators:
✅ No code changes needed to update homepage  
✅ Quick toggle from dashboard  
✅ Visual feedback with star icon  
✅ Control over which products to promote  

### For Customers:
✅ See real, up-to-date pricing  
✅ Add products directly to cart from homepage  
✅ Clear, organized product presentation  
✅ Responsive on all devices  

### For Business:
✅ A/B test different product combinations  
✅ Promote seasonal offers  
✅ Highlight best sellers  
✅ Quick marketing changes  

## Next Steps

### Optional Enhancements:
1. **Sort Order UI**: Add drag-and-drop to reorder featured products
2. **Featured Limit**: Limit to max 3-4 featured products
3. **Featured Duration**: Add start/end dates for featured status
4. **Analytics**: Track which featured products get most clicks
5. **Preview**: Preview homepage before publishing featured changes

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Status**: ✅ Production Ready

