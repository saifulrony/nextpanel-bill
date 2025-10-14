# 📘 How to Use the Page Builder - Complete Guide

## 🎯 Overview

You can build custom pages using the drag-and-drop page builder at `/admin/customization`, and then view those pages at `/pages/[page-id]`.

---

## 🚀 Step-by-Step Guide

### Step 1: Access the Page Builder

1. Go to: **`http://localhost:3000/admin/customization`**
2. Click on the **"Page Builder"** tab (first tab with the grid icon)
3. The page builder will open in full screen

### Step 2: Build Your Page

1. **Add Components:**
   - Click on any component from the left sidebar (Heading, Text, Button, Image, etc.)
   - The component appears in the canvas

2. **Edit Components:**
   - Click on any component in the canvas
   - The properties panel opens on the right
   - Edit content, colors, fonts, spacing, etc.
   - Changes apply instantly

3. **Reorder Components:**
   - Click and hold a component
   - Drag to new position
   - Drop to reorder

4. **Delete Components:**
   - Select the component
   - Click the red trash icon in the properties panel

### Step 3: Save Your Page

1. Click the **"Save Page"** button at the top
2. Enter a **Page ID** (e.g., `my-landing-page`, `about-us`, `products`)
3. Enter a **Page Title** (e.g., "My Landing Page")
4. Enter a **Description** (optional)
5. Click **"Save"**

**Important:** The page is now saved with the ID you provided!

### Step 4: View Your Built Page

1. After saving, your page is accessible at:
   ```
   http://localhost:3000/pages/[your-page-id]
   ```

2. **Example:**
   - If you saved with ID: `my-landing-page`
   - View at: `http://localhost:3000/pages/my-landing-page`
   
   - If you saved with ID: `about-us`
   - View at: `http://localhost:3000/pages/about-us`

---

## 📋 Complete Example

Let's say you want to create a landing page:

### 1. Build the Page

1. Go to `/admin/customization`
2. Click **"Page Builder"** tab
3. Add these components:
   - **Heading:** "Welcome to Our Platform"
   - **Text:** "Build amazing things with our tools"
   - **Button:** "Get Started"
   - **Image:** Add your logo

4. Customize each component:
   - Heading: Make it large, center it, use brand color
   - Text: Make it readable, add some spacing
   - Button: Make it prominent, add hover effect
   - Image: Adjust size and position

### 2. Save the Page

1. Click **"Save Page"**
2. Enter:
   - **Page ID:** `landing-page`
   - **Page Title:** "Landing Page"
   - **Description:** "Main landing page for our platform"
3. Click **"Save"**

### 3. View the Page

Open in browser:
```
http://localhost:3000/pages/landing-page
```

**That's it!** Your page is now live and accessible at that URL.

---

## 🔗 Linking to Your Pages

You can link to your custom pages from anywhere:

### From Navigation Menu

Add links to your pages in your navigation:

```html
<a href="/pages/landing-page">Home</a>
<a href="/pages/about-us">About</a>
<a href="/pages/products">Products</a>
```

### From Buttons in Page Builder

When adding a Button component:
- Set the **Link** property to: `/pages/your-page-id`
- Example: `/pages/landing-page`

### From Other Pages

Simply use the URL format:
```
/pages/[your-page-id]
```

---

## 📁 Page Management

### List All Saved Pages

Visit the API endpoint:
```
http://localhost:3000/api/pages
```

This returns a JSON list of all your saved pages.

### Get Specific Page Data

```
http://localhost:3000/api/pages?id=your-page-id
```

### Delete a Page

Send a DELETE request to:
```
DELETE http://localhost:3000/api/pages?id=your-page-id
```

---

## 💡 Tips & Best Practices

### 1. Use Meaningful Page IDs

**Good IDs:**
- `landing-page`
- `about-us`
- `product-showcase`
- `contact-page`

**Avoid:**
- `page1`, `page2` (not descriptive)
- Spaces or special characters

### 2. Plan Your Pages

Before building:
- Sketch your layout
- List the components you need
- Think about the user journey

### 3. Test Responsively

Use the responsive preview in the page builder:
- Desktop (100% width)
- Tablet (768px)
- Mobile (375px)

### 4. Save Frequently

Click **"Save Page"** often to avoid losing work.

### 5. Export as Backup

Use the **"Export"** button to download a JSON backup of your page.

---

## 🎨 Common Use Cases

### 1. Landing Page

**Components:**
- Hero section (Heading + Text + Button)
- Features section (Grid with Cards)
- Testimonials (Text + Images)
- CTA section (Button)

**Page ID:** `landing-page`

### 2. About Page

**Components:**
- Heading: "About Us"
- Text: Company story
- Image: Team photo
- Grid: Team members

**Page ID:** `about-us`

### 3. Product Showcase

**Components:**
- Heading: "Our Products"
- Grid: Product cards (Image + Text + Button)
- Each card links to product detail page

**Page ID:** `products`

### 4. Contact Page

**Components:**
- Heading: "Contact Us"
- Text: Contact information
- Form: Contact form component
- Map: Location (if using Map component)

**Page ID:** `contact`

---

## 🔧 Advanced Features

### 1. Preview Mode

In the page builder:
- Click **"Preview"** button
- See how users will see the page
- All editing controls hide
- Click **"Exit Preview"** to return

### 2. Responsive Design

Test on different screen sizes:
- Desktop: Full width
- Tablet: 768px
- Mobile: 375px

### 3. Export/Import

**Export:**
- Click **"Export"** button
- JSON file downloads
- Share with team or backup

**Import:**
- Click **"Import"** button
- Select JSON file
- Layout loads into builder

### 4. Undo/Redo

- **Undo:** `Ctrl + Z` (Windows/Linux) or `Cmd + Z` (Mac)
- **Redo:** `Ctrl + Y` (Windows/Linux) or `Cmd + Shift + Z` (Mac)

---

## 🐛 Troubleshooting

### Page Not Found

**Problem:** Getting "Page Not Found" when viewing `/pages/[id]`

**Solutions:**
1. Make sure you saved the page in the page builder
2. Check the page ID is correct (case-sensitive)
3. Check the API: `http://localhost:3000/api/pages?id=your-page-id`

### Changes Not Showing

**Problem:** Changes made in page builder don't appear on the page

**Solutions:**
1. Make sure you clicked **"Save Page"**
2. Refresh the page: `Ctrl + F5` (hard refresh)
3. Check if the page ID matches

### Components Not Loading

**Problem:** Components appear broken or don't render

**Solutions:**
1. Check browser console for errors (F12)
2. Verify all component data is valid
3. Try rebuilding the component

---

## 📊 Current System Status

### ✅ Working Features

- ✅ Drag & drop page builder
- ✅ Component library (11 components)
- ✅ Properties panel for editing
- ✅ Responsive preview
- ✅ Save/Load pages
- ✅ Export/Import
- ✅ Undo/Redo
- ✅ Preview mode
- ✅ View pages at `/pages/[id]`

### 📝 Storage

Currently using **in-memory storage** (resets on server restart).

**To persist data:**
- Export pages as JSON backups
- Or integrate with a database (PostgreSQL, MongoDB, etc.)

---

## 🎯 Quick Reference

### URLs

| Action | URL |
|--------|-----|
| Page Builder | `/admin/customization` |
| View Page | `/pages/[page-id]` |
| List Pages API | `/api/pages` |
| Get Page API | `/api/pages?id=[page-id]` |

### Components Available

1. **Heading** - H1-H6 headings
2. **Text** - Rich text paragraphs
3. **Button** - Call-to-action buttons
4. **Image** - Image elements
5. **Section** - Container sections
6. **Container** - Flexible containers
7. **Spacer** - Adjustable spacing
8. **Divider** - Horizontal dividers
9. **Card** - Card components
10. **Grid** - Grid layouts
11. **Video** - Embedded videos

---

## 🎉 You're Ready!

You now know how to:
1. ✅ Build pages with the page builder
2. ✅ Save your pages
3. ✅ View your pages at `/pages/[id]`
4. ✅ Link to your pages
5. ✅ Manage your pages

**Start building amazing pages!** 🚀

---

## 📞 Need Help?

If you have questions:
1. Check the browser console (F12) for errors
2. Verify the page ID is correct
3. Make sure you saved the page
4. Try refreshing with `Ctrl + F5`

---

**Last Updated:** 2025-01-27  
**Version:** 1.0.0

