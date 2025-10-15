# 🎨 Dynamic Page Builder - Complete Usage Guide

## ✅ What Was Built

A **TRULY DYNAMIC** page builder system where:
- ✅ Changes in the builder are saved to the **database**
- ✅ Pages load content from the **database**
- ✅ Your edits appear on **real pages**
- ✅ No more static templates!

---

## 🚀 Quick Start

### 1. **Access the Page Builder**
```
http://localhost:3000/page-builder
```

### 2. **Select a Page to Edit**
- Click "📄 Select Page" button
- Choose from:
  - **Home Page** - Main landing page
  - **Cart Page** - Shopping cart
  - **Checkout Page** - Order checkout
  - **Order Confirmation** - Order success page

### 3. **Edit Your Page**

#### Add Components:
- Click any component from the left panel
- It appears in the canvas

#### Edit Components:
- Click a component to select it
- Properties panel opens on the right
- Change colors, text, spacing, etc.

#### Add Columns:
- Add a "Container" component
- Select it
- In properties panel, choose 1-4 columns
- Click empty columns to add components

#### Reorder Components:
- Hover over a component
- Drag handle appears on the left
- Drag to reorder

### 4. **Save Your Changes**
- Click "Save Draft" to save
- Click "Publish & Rebuild" to publish

### 5. **View Your Page**
```
http://localhost:3000/dynamic-page/home
http://localhost:3000/dynamic-page/cart
http://localhost:3000/dynamic-page/checkout
http://localhost:3000/dynamic-page/order-confirmation
```

---

## 🎯 Complete Workflow Example

### Example: Edit the Home Page

#### Step 1: Open Page Builder
```
Go to: http://localhost:3000/page-builder
```

#### Step 2: Load Home Page
1. Click "📄 Select Page"
2. Click "Home Page"
3. Page loads with default template

#### Step 3: Add a Hero Section
1. Click "Heading" from left panel
2. Select the heading
3. In properties panel, change text to "Welcome to Our Platform"
4. Change color to blue
5. Change font size to 48px

#### Step 4: Add a 3-Column Section
1. Click "Container" from left panel
2. Select the container
3. In properties panel, click "3" for columns
4. Click first empty column
5. Select "Image" component
6. Add image URL
7. Repeat for other columns

#### Step 5: Save
1. Click "Save Draft"
2. See success message

#### Step 6: View
1. Go to: `http://localhost:3000/dynamic-page/home`
2. See your changes live!

---

## 🛠️ Features

### 1. **Page Selector**
- Search and filter pages
- Shows all available pages
- Loads page data from database

### 2. **Component Library**
- Heading, Text, Button
- Image, Video, Form
- Container, Card, Grid
- Spacer, Divider
- Domain Search, Products Grid
- Contact Form, Newsletter

### 3. **Properties Panel**
- Edit text content
- Change colors (background, text, borders)
- Adjust spacing (padding, margin)
- Control typography (font size, weight, alignment)
- Set dimensions (width, height)
- Configure columns (1-4)

### 4. **Column System**
- Add containers with 1-4 columns
- Click empty columns to add components
- Visual feedback with hover effects
- Drag components between columns

### 5. **Responsive Preview**
- Desktop view (100% width)
- Tablet view (768px)
- Mobile view (375px)
- Switch between views instantly

### 6. **Undo/Redo**
- Full history tracking
- Undo changes (Ctrl+Z)
- Redo changes (Ctrl+Y)

### 7. **Export/Import**
- Export page layouts as JSON
- Import saved layouts
- Share layouts between projects

---

## 📊 Database Structure

### Pages Table
```sql
CREATE TABLE pages (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,           -- "home", "cart", etc.
    title TEXT NOT NULL,                  -- "Home Page"
    description TEXT,                     -- Description
    components TEXT NOT NULL DEFAULT '[]', -- JSON array
    metadata TEXT DEFAULT '{}',           -- JSON object
    is_active TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Component Structure
```json
{
  "id": "heading-1",
  "type": "heading",
  "content": "<h1>Welcome</h1>",
  "props": {},
  "children": [],
  "style": {
    "color": "#000000",
    "fontSize": "48px"
  }
}
```

---

## 🔌 API Endpoints

### List All Pages
```bash
GET http://localhost:8001/api/v1/pages
```

### Get Page by Slug
```bash
GET http://localhost:8001/api/v1/pages/home
```

### Update Page
```bash
PUT http://localhost:8001/api/v1/pages/home
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Home Page",
  "description": "Main landing page",
  "components": [...],
  "is_active": "active"
}
```

---

## 🎨 Component Types

### Basic Components
- **Heading** - H1-H6 headings
- **Text** - Rich text paragraphs
- **Button** - Call-to-action buttons
- **Image** - Image elements
- **Video** - Embedded videos

### Layout Components
- **Container** - Flexible containers with columns
- **Section** - Full-width sections
- **Card** - Card components
- **Grid** - Grid layouts
- **Spacer** - Adjustable spacing
- **Divider** - Horizontal dividers

### Dynamic Components
- **Domain Search** - Domain search form
- **Products Grid** - Product listings
- **Product Search** - Product search
- **Contact Form** - Contact form
- **Newsletter** - Newsletter signup

---

## 💡 Tips & Best Practices

### 1. **Plan Your Layout**
- Sketch your page structure first
- Identify sections and components
- Plan the column layout

### 2. **Use Containers**
- Group related content
- Use 2-3 columns for balanced layouts
- Use 4 columns for feature lists

### 3. **Consistent Spacing**
- Use spacing scale (8px, 16px, 24px, 32px)
- Create visual rhythm
- Add spacing between sections

### 4. **Color Scheme**
- Stick to brand colors
- Ensure sufficient contrast
- Use colors consistently

### 5. **Typography Hierarchy**
- Clear heading hierarchy (H1 → H6)
- Consistent font sizes
- Proper line spacing

### 6. **Mobile-First**
- Design for mobile first
- Test on all device sizes
- Use responsive components

### 7. **Save Frequently**
- Use "Save Draft" often
- Export backups regularly
- Test before publishing

---

## 🐛 Troubleshooting

### Components Not Appearing
1. Check browser console for errors
2. Refresh the page
3. Clear browser cache
4. Check if components array is valid JSON

### Changes Not Saving
1. Check authentication token
2. Verify backend is running
3. Check browser console for errors
4. Try saving again

### Page Not Loading
1. Check if page exists in database
2. Verify slug is correct
3. Check API response in Network tab
4. Clear browser cache

### Database Errors
1. Check backend logs
2. Verify database file permissions
3. Restart backend
4. Check database schema

---

## 📝 Example Pages

### Home Page
```
- Hero Section (Heading + Text + Button)
- Features Section (3-column container)
- Products Section (Products Grid)
- Newsletter Section (Newsletter component)
```

### Cart Page
```
- Page Heading
- Cart Items (Products Grid)
- Order Summary (Card)
- Checkout Button
```

### Checkout Page
```
- Page Heading
- 2-Column Container:
  - Left: Order Summary
  - Right: Payment Form
- Complete Order Button
```

### Order Confirmation
```
- Success Heading (large, green)
- Order Details (Text)
- Order ID (Text)
- Continue Shopping Button
```

---

## ✅ Success Checklist

- [ ] Backend running on port 8001
- [ ] Pages table created in database
- [ ] Page builder accessible at `/page-builder`
- [ ] Can select pages from dropdown
- [ ] Can add components to canvas
- [ ] Can edit component properties
- [ ] Can add containers with columns
- [ ] Can click columns to add components
- [ ] Can save changes to database
- [ ] Can view pages at `/dynamic-page/[slug]`
- [ ] Changes appear on real pages

---

## 🎉 You're Done!

Your page builder is now **fully dynamic**!

**What you can do:**
- ✅ Edit any page visually
- ✅ Changes save to database
- ✅ Pages load from database
- ✅ No more static templates!

**Start building:**
1. Go to `/page-builder`
2. Select a page
3. Add components
4. Save changes
5. View at `/dynamic-page/[slug]`

**Happy building!** 🚀

---

**Version:** 2.0.0  
**Date:** 2025-01-27  
**Status:** ✅ FULLY DYNAMIC & WORKING

