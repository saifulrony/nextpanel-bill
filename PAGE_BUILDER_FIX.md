# 🔧 Page Builder Fix - Custom Page ID

## Problem Fixed

You were getting "Page Not Found" because the page builder was saving with a hardcoded page ID instead of using your custom ID.

## What Changed

### Before:
- Page builder saved with ID: `custom-page-1` (hardcoded)
- You tried to view: `/pages/test-me`
- Result: Page not found ❌

### After:
- Page builder now has a **Page ID input field** in the toolbar
- You can enter any page ID you want (e.g., `test-me`)
- Page saves with your custom ID
- View at: `/pages/test-me`
- Result: Page found! ✅

---

## How to Use (Updated)

### Step 1: Build Your Page
1. Go to: `http://192.168.10.203:4000/admin/customization`
2. Click the **"Page Builder"** tab
3. Add components and build your page

### Step 2: Enter Page ID
In the toolbar at the top, you'll now see:
```
┌─────────────────────────────────────┐
│ Page ID: [test-me        ]          │ ← Enter your page ID here
│ Page Title: [My Page    ]           │
│ [Export] [Import] [Preview] [Save]  │
└─────────────────────────────────────┘
```

**Enter your page ID:**
- Example: `test-me`
- Example: `landing-page`
- Example: `about-us`

**Rules for Page ID:**
- Use lowercase letters
- Use hyphens (not spaces)
- No special characters
- Keep it short and descriptive

### Step 3: Save Your Page
1. Click **"Save Draft"** button
2. You'll see: "Page saved successfully! View at: /pages/test-me"
3. Your page is now saved with your custom ID

### Step 4: View Your Page
Open in browser:
```
http://192.168.10.203:4000/pages/test-me
```

**That's it!** Your page is now live! 🎉

---

## Examples

### Example 1: Landing Page

**In Page Builder:**
- Page ID: `landing-page`
- Page Title: "Landing Page"
- Add components: Heading, Text, Button
- Click "Save Draft"

**View at:**
```
http://192.168.10.203:4000/pages/landing-page
```

### Example 2: About Page

**In Page Builder:**
- Page ID: `about-us`
- Page Title: "About Us"
- Add components: Heading, Text, Image
- Click "Save Draft"

**View at:**
```
http://192.168.10.203:4000/pages/about-us
```

### Example 3: Test Page

**In Page Builder:**
- Page ID: `test-me`
- Page Title: "Test Page"
- Add components: Heading, Text
- Click "Save Draft"

**View at:**
```
http://192.168.10.203:4000/pages/test-me
```

---

## Quick Reference

| Action | What to Do |
|--------|-----------|
| **Build Page** | Go to `/admin/customization` → Click "Page Builder" tab |
| **Enter Page ID** | Type in the "Page ID" field (e.g., `my-page`) |
| **Enter Title** | Type in the "Page Title" field (e.g., "My Page") |
| **Add Components** | Click components from left sidebar |
| **Edit Components** | Click components in canvas → Edit in right panel |
| **Save Page** | Click "Save Draft" button |
| **View Page** | Open `/pages/[your-page-id]` in browser |

---

## Troubleshooting

### "Please enter a page ID"
**Problem:** You didn't enter a page ID before saving.

**Solution:** 
1. Enter a page ID in the "Page ID" field
2. Click "Save Draft" again

### "Page Not Found"
**Problem:** Page ID doesn't match.

**Check:**
1. Did you save the page?
2. Is the page ID correct? (case-sensitive)
3. Try: `http://192.168.10.203:4000/api/pages?id=test-me`

### Changes Not Showing
**Problem:** Page not refreshed.

**Solution:**
1. Hard refresh: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
2. Or clear browser cache

---

## API Endpoints

### List All Pages
```
GET http://192.168.10.203:4000/api/pages
```

### Get Specific Page
```
GET http://192.168.10.203:4000/api/pages?id=test-me
```

### View Page
```
http://192.168.10.203:4000/pages/test-me
```

---

## Tips

1. **Use Descriptive IDs:** `landing-page` is better than `page1`
2. **Use Hyphens:** `about-us` not `about_us` or `about us`
3. **Keep it Short:** `products` not `our-amazing-product-catalog`
4. **Save Frequently:** Click "Save Draft" often
5. **Export as Backup:** Click "Export" to download JSON

---

## What's New

### New Features:
- ✅ **Page ID Input Field** - Enter any page ID you want
- ✅ **Validation** - Must enter page ID before saving
- ✅ **Success Message** - Shows the URL to view your page
- ✅ **Custom IDs** - No more hardcoded page IDs

### Before:
```
Page ID: custom-page-1 (hardcoded)
```

### After:
```
Page ID: [your-custom-id] (you choose!)
```

---

## Testing Your Fix

1. **Go to Page Builder:**
   ```
   http://192.168.10.203:4000/admin/customization
   ```

2. **Click "Page Builder" tab**

3. **Enter Page ID:**
   - Type: `test-me`
   - You should see it in the toolbar

4. **Add a Component:**
   - Click "Heading" from left sidebar
   - Edit the heading text

5. **Save:**
   - Click "Save Draft"
   - You should see: "Page saved successfully! View at: /pages/test-me"

6. **View:**
   - Open: `http://192.168.10.203:4000/pages/test-me`
   - You should see your page! ✅

---

## Summary

**Problem:** Page builder was using hardcoded ID `custom-page-1`

**Solution:** Added Page ID input field so you can enter any ID you want

**Result:** You can now create pages with any ID you want!

**Example:**
- Enter ID: `test-me`
- Save page
- View at: `/pages/test-me`
- Works! ✅

---

**You're all set!** 🚀

For more help, see:
- **HOW_TO_USE_PAGE_BUILDER.md** - Complete guide
- **QUICK_START_PAGE_BUILDER.md** - Quick start
- **PAGE_BUILDER_WORKFLOW.md** - Visual workflow

