# Complete Customization Guide

## Overview
The NextPanel Billing System now has comprehensive customization options for every section of your application.

---

## 🎨 Available Customization Sections

### 1. **Header** (Front Page)
**Location**: Admin → Customization → Header tab

**Features**:
- ✅ Upload custom logo
- ✅ Logo size (width/height in pixels)
- ✅ Logo positioning (left, center, right)
- ✅ Logo padding
- ✅ Logo opacity (0-100%)
- ✅ Maximum width control
- ✅ Live preview
- ✅ Save settings

**Settings Saved**: `logo_settings` in localStorage

---

### 2. **Sidebar** (Dashboard)
**Location**: Admin → Customization → Sidebar tab

**Features**:
- ✅ Upload sidebar logo
- ✅ Background color
- ✅ Text color
- ✅ Hover color
- ✅ Active menu item color
- ✅ Sidebar width (200-400px)
- ✅ Save settings

**Settings Saved**: `sidebar_settings` in localStorage

**Applies To**:
- Admin dashboard sidebar
- All admin pages

---

### 3. **Footer** (Front Page)
**Location**: Admin → Customization → Footer tab

**Features**:
- ✅ Upload footer logo
- ✅ Background color
- ✅ Text color
- ✅ Heading color
- ✅ Copyright text
- ✅ Custom footer links (add/remove/edit)
- ✅ Save settings

**Settings Saved**: `footer_settings` in localStorage

**Applies To**:
- Homepage footer
- Public pages

---

### 4. **Fonts** (Global)
**Location**: Admin → Customization → Fonts tab

**Features**:
- ✅ Choose from 10+ fonts
- ✅ Live typography preview
- ✅ Applies to entire system

**Available Fonts**:
- Inter, Roboto, Open Sans, Lato, Montserrat
- Poppins, Nunito, Raleway, Ubuntu, Playfair Display

---

### 5. **Colors** (Global)
**Location**: Admin → Customization → Colors tab

**Features**:
- ✅ Primary color
- ✅ Secondary color
- ✅ Background color
- ✅ Text color
- ✅ Color picker
- ✅ Live preview

---

### 6. **Layout** (Global)
**Location**: Admin → Customization → Layout tab

**Features**:
- ✅ Default layout (standard spacing)
- ✅ Compact layout (more content)
- ✅ Spacious layout (extra breathing room)

---

### 7. **Themes** (Global)
**Location**: Admin → Customization → Themes tab

**Features**:
- ✅ Save current settings as theme
- ✅ Load saved themes
- ✅ Delete themes
- ✅ Multiple theme support

---

### 8. **Custom Code** (Advanced)
**Location**: Admin → Customization → Custom Code tab

**Features**:
- ✅ Page editor (select any page to edit)
- ✅ Custom CSS editor
- ✅ Custom JavaScript editor
- ✅ Custom HTML editor
- ✅ Live preview
- ✅ Save/Reset code

---

## 📋 Quick Reference

### Header Settings
```javascript
{
  logo: "data:image/png;base64,...",
  logoWidth: 150,
  logoHeight: 50,
  logoPosition: "left",
  logoPadding: 10,
  logoOpacity: 100,
  logoMaxWidth: "200px"
}
```

### Sidebar Settings
```javascript
{
  sidebarLogo: "data:image/png;base64,...",
  sidebarBgColor: "#FFFFFF",
  sidebarTextColor: "#1F2937",
  sidebarHoverColor: "#F3F4F6",
  sidebarActiveColor: "#EEF2FF",
  sidebarWidth: 256
}
```

### Footer Settings
```javascript
{
  footerBgColor: "#1F2937",
  footerTextColor: "#9CA3AF",
  footerHeadingColor: "#FFFFFF",
  footerLogo: "data:image/png;base64,...",
  footerCopyright: "© 2025 NextPanel. All rights reserved.",
  footerLinks: [
    { title: "About", url: "/about" },
    { title: "Contact", url: "/contact" }
  ]
}
```

---

## 🚀 How to Use

### Step 1: Customize Header
1. Go to **Admin → Customization → Header**
2. Upload your logo
3. Adjust size, position, padding, opacity
4. Click **"Save Logo Settings"**

### Step 2: Customize Sidebar
1. Go to **Admin → Customization → Sidebar**
2. Upload sidebar logo (optional)
3. Choose colors
4. Adjust width
5. Click **"Save Sidebar Settings"**

### Step 3: Customize Footer
1. Go to **Admin → Customization → Footer**
2. Upload footer logo (optional)
3. Choose colors
4. Edit copyright text
5. Add/edit footer links
6. Click **"Save Footer Settings"**

### Step 4: Apply Global Settings
1. Go to **Fonts** tab - Choose font
2. Go to **Colors** tab - Choose color scheme
3. Go to **Layout** tab - Choose layout style
4. Go to **Themes** tab - Save as theme

### Step 5: Advanced Customization
1. Go to **Custom Code** tab
2. Select a page to edit
3. Edit code or add custom CSS/JS/HTML
4. Click **"Save Code"**

---

## 💾 Data Persistence

All settings are saved in **localStorage**:
- `logo_settings` - Header logo settings
- `sidebar_settings` - Sidebar settings
- `footer_settings` - Footer settings
- `customization_settings` - Global settings
- `customization_themes` - Saved themes

**Note**: Settings persist across page refreshes but are browser-specific.

---

## 🎯 Features Summary

| Section | Logo | Colors | Size | Position | Other |
|---------|------|--------|------|----------|-------|
| Header | ✅ | - | ✅ | ✅ | Opacity, Padding |
| Sidebar | ✅ | ✅ | ✅ | - | Width |
| Footer | ✅ | ✅ | - | - | Links, Copyright |
| Global | - | ✅ | - | - | Fonts, Layout, Themes |

---

## 🔧 Technical Details

### CSS Injection
Custom styles are injected via `<style>` tag with ID `custom-logo-styles`

### Logo Display
Logos are displayed on elements with classes:
- `.logo-img`
- `.sidebar-logo`
- `.header-logo`

### Color Variables
Global CSS variables are set on `:root`:
- `--primary-color`
- `--secondary-color`
- `--bg-color`
- `--text-color`
- `--font-family`

---

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

---

## 🐛 Troubleshooting

### Logo not showing?
1. Check browser console for errors
2. Clear browser cache
3. Verify logo is uploaded
4. Check localStorage for saved settings

### Settings not saving?
1. Check browser localStorage quota
2. Clear old data: `localStorage.clear()`
3. Try incognito mode

### Colors not applying?
1. Check CSS variable names
2. Verify color format (hex, rgb, etc.)
3. Check browser console for CSS errors

---

## 🎨 Example Configurations

### Dark Theme
```javascript
{
  sidebarBgColor: "#1F2937",
  sidebarTextColor: "#F9FAFB",
  sidebarHoverColor: "#374151",
  sidebarActiveColor: "#4B5563",
  footerBgColor: "#111827",
  footerTextColor: "#D1D5DB"
}
```

### Light Theme
```javascript
{
  sidebarBgColor: "#FFFFFF",
  sidebarTextColor: "#1F2937",
  sidebarHoverColor: "#F3F4F6",
  sidebarActiveColor: "#EEF2FF",
  footerBgColor: "#F9FAFB",
  footerTextColor: "#6B7280"
}
```

### Brand Colors
```javascript
{
  primaryColor: "#4F46E5",
  secondaryColor: "#818CF8",
  sidebarBgColor: "#4F46E5",
  sidebarTextColor: "#FFFFFF"
}
```

---

## 📞 Support

For issues or questions:
1. Check browser console (F12)
2. Review saved settings in localStorage
3. Try resetting settings
4. Contact development team

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete and Ready to Use

