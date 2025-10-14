# 🚀 Quick Start - Page Builder

## In 3 Simple Steps

### Step 1: Build Your Page
```
Go to: http://localhost:3000/admin/customization
Click: "Page Builder" tab
Add components: Click on components in the left sidebar
Edit: Click on components in the canvas to edit them
```

### Step 2: Save Your Page
```
Click: "Save Page" button
Enter: Page ID (e.g., "my-page")
Enter: Page Title (e.g., "My Page")
Click: "Save"
```

### Step 3: View Your Page
```
Open: http://localhost:3000/pages/my-page
```

**That's it!** Your page is now live! 🎉

---

## 📍 Where to View Your Pages

After saving a page with ID `my-page`, view it at:
```
http://localhost:3000/pages/my-page
```

### Examples:

| Page ID | View URL |
|---------|----------|
| `landing-page` | `http://localhost:3000/pages/landing-page` |
| `about-us` | `http://localhost:3000/pages/about-us` |
| `products` | `http://localhost:3000/pages/products` |
| `contact` | `http://localhost:3000/pages/contact` |

---

## 🎨 What You Can Build

### Landing Page
- Hero section with heading, text, and button
- Features grid
- Testimonials
- Call-to-action

### About Page
- Company story
- Team photos
- Mission statement

### Product Page
- Product grid
- Product cards with images
- Pricing tables

### Contact Page
- Contact form
- Contact information
- Map (if available)

---

## 🔗 Link to Your Pages

From any page, link to your custom pages:

```html
<a href="/pages/landing-page">Home</a>
<a href="/pages/about-us">About</a>
<a href="/pages/products">Products</a>
```

Or from buttons in the page builder:
- Set Button **Link** property to: `/pages/your-page-id`

---

## 💡 Pro Tips

1. **Use meaningful page IDs:** `landing-page` is better than `page1`
2. **Save frequently:** Click "Save Page" often
3. **Test responsive:** Use the device icons in the toolbar
4. **Export as backup:** Click "Export" to download JSON
5. **Preview first:** Click "Preview" to see final result

---

## 🆘 Common Issues

### "Page Not Found"
- Did you save the page? Go back to page builder and click "Save Page"
- Check the page ID is correct (case-sensitive)
- Try: `http://localhost:3000/api/pages?id=your-page-id`

### Changes Not Showing
- Did you click "Save Page"?
- Try hard refresh: `Ctrl + F5`

### Components Not Working
- Check browser console (F12) for errors
- Try rebuilding the component

---

## 📚 Full Documentation

For complete documentation, see:
- **HOW_TO_USE_PAGE_BUILDER.md** - Complete guide
- **PAGE_BUILDER_COMPLETE.md** - Implementation details

---

## 🎯 Quick Commands

```bash
# Start the development server
cd billing-frontend
npm run dev

# Access page builder
http://localhost:3000/admin/customization

# View your pages
http://localhost:3000/pages/[your-page-id]
```

---

**Ready to build?** Go to `/admin/customization` and start creating! 🚀

