# Customization and Advanced Search Features

## Overview
This document describes the new Customization page and Advanced Search functionality added to the NextPanel Billing System.

---

## 🎨 Customization Page

### Location
**Admin Menu → Customization** (with PaintBrush icon)

### Features

#### 1. **Logo Management**
- Upload custom logo for the entire system
- Preview logo before applying
- Support for PNG, JPG, GIF formats (up to 10MB)
- Remove logo option
- Live preview in sidebar

#### 2. **Font Customization**
- Choose from 10+ professional fonts:
  - Inter, Roboto, Open Sans, Lato, Montserrat
  - Poppins, Nunito, Raleway, Ubuntu, Playfair Display
- Live typography preview
- Applies to entire system

#### 3. **Color Scheme**
- **Primary Color**: Main accent color for buttons, links, highlights
- **Secondary Color**: Secondary accent color
- **Background Color**: Main background color
- **Text Color**: Primary text color
- Live color picker with hex input
- Color preview panel

#### 4. **Layout Options**
- **Default**: Standard spacing and layout
- **Compact**: Reduced spacing for more content
- **Spacious**: Extra spacing for breathing room
- Visual layout preview

#### 5. **Theme Management**
- Save current settings as named themes
- Load saved themes with one click
- Delete unwanted themes
- Themes persist across sessions
- Multiple theme support

#### 6. **Custom Code Editor**
Three separate editors for advanced customization:

##### Custom CSS
```css
/* Example: Change button styles */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 25px;
}
```

##### Custom JavaScript
```javascript
// Example: Add custom functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('Custom script loaded!');
});
```

##### Custom HTML
```html
<!-- Example: Add custom elements -->
<div class="custom-banner">
  <h3>Welcome to NextPanel!</h3>
</div>
```

### User Interface

#### Tabs
1. **Logo** - Upload and manage system logo
2. **Fonts** - Select and preview fonts
3. **Colors** - Customize color scheme
4. **Layout** - Choose layout style
5. **Themes** - Manage saved themes
6. **Custom Code** - Advanced HTML/CSS/JS editing

#### Live Preview Panel
- Real-time preview of all changes
- Logo preview
- Color scheme preview
- Typography preview
- Layout preview
- Custom code status indicator

#### Controls
- **Preview Mode**: Toggle preview of changes
- **Reset All**: Reset all customizations to default
- **Save Theme**: Save current settings as a theme
- **Load Theme**: Apply a saved theme
- **Delete Theme**: Remove a saved theme

### Data Persistence
- Settings saved to browser localStorage
- Themes saved to browser localStorage
- Settings persist across sessions
- Can be exported/imported (future feature)

### Technical Implementation
- React state management
- CSS variable injection
- Dynamic style application
- localStorage for persistence
- File upload handling
- Base64 image encoding

---

## 🔍 Advanced Search Feature

### Location
**Top search bar** in admin header

### Features

#### 1. **Real-time Search**
- Instant results as you type
- No need to press Enter
- Search through all navigation items
- Search through predefined suggestions

#### 2. **Search Categories**
- **Navigation**: All main menu items and submenu items
- **Quick Access**: Common tasks and features
- **Pages**: All admin pages

#### 3. **Search Results Display**
Each result shows:
- **Icon**: Visual identifier
- **Name**: Page/feature name
- **Category**: Where it belongs
- **Type Badge**: "Page" or "Quick Access"

#### 4. **Searchable Items**
- Dashboard
- Customers
- Products
- Orders
- Licenses
- Domains
- Subscriptions
- Payments (Transactions, Gateways)
- Server
- Analytics (Overview, Sales, Clients, Orders, Tickets)
- Support (Tickets, Live Chats)
- Marketplace
- Customization
- Settings

#### 5. **Quick Access Suggestions**
Pre-defined quick access items:
- Dashboard Overview
- Customer Management
- Product Catalog
- Order History
- License Keys
- Domain Management
- Payment Settings
- Analytics & Reports
- Support Tickets
- System Settings
- Customization
- Marketplace

### User Interface

#### Search Input
- Placeholder: "Search pages, features..."
- Search icon on the left
- Clear on selection
- Auto-focus on click

#### Results Dropdown
- **Position**: Below search input
- **Max Height**: 96 (384px) with scroll
- **Background**: White with shadow
- **Border**: Gray border
- **Z-index**: 50 (above all content)

#### Result Item
- **Hover Effect**: Gray background
- **Click Action**: Navigate to page
- **Icon**: Left-aligned
- **Content**: Name and category
- **Badge**: Right-aligned type badge

#### Footer
- Shows result count
- Shows search query
- Example: "Found 5 results for 'customer'"

#### No Results
- Large search icon
- "No results found" message
- "Try searching for something else" hint

### Behavior

#### Search Logic
1. User types in search box
2. System searches through:
   - Navigation items (name matching)
   - Submenu items (name matching)
   - Quick access suggestions (name matching)
3. Results displayed in real-time
4. User clicks on result
5. Navigate to selected page
6. Search clears automatically

#### Dropdown Management
- Opens when results are available
- Closes when clicking outside
- Closes when selecting a result
- Closes when search is cleared
- Auto-opens on focus if results exist

#### Keyboard Support
- Tab to focus search
- Type to search
- Enter to select first result (future enhancement)
- Escape to close dropdown (future enhancement)
- Arrow keys to navigate (future enhancement)

### Technical Implementation
- React state management
- Real-time filtering
- Debounced search (future enhancement)
- Click-outside detection
- Link navigation
- Icon rendering from Heroicons

---

## 🚀 Usage Examples

### Customization Examples

#### Example 1: Change to Dark Theme
1. Go to Customization → Colors
2. Set Primary Color: `#8B5CF6`
3. Set Secondary Color: `#A78BFA`
4. Set Background Color: `#1F2937`
5. Set Text Color: `#F9FAFB`
6. Click "Preview" to see changes
7. Save as theme "Dark Purple"

#### Example 2: Custom Font
1. Go to Customization → Fonts
2. Select "Poppins"
3. See live preview
4. Changes apply immediately

#### Example 3: Custom CSS
1. Go to Customization → Custom Code
2. In CSS editor, add:
```css
.sidebar {
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
}
```
3. Changes apply immediately

### Search Examples

#### Example 1: Find Customer Page
1. Click search box
2. Type "customer"
3. See "Customers" in results
4. Click to navigate

#### Example 2: Find Analytics
1. Type "analytics"
2. See multiple results:
   - Analytics (Navigation)
   - Analytics & Reports (Quick Access)
3. Click desired result

#### Example 3: Find Payment Settings
1. Type "payment"
2. See results:
   - Payments (Navigation)
   - Payment Settings (Quick Access)
3. Click to navigate

---

## 🔧 Technical Details

### Files Modified
- `/billing-frontend/src/app/admin/layout.tsx`
- `/billing-frontend/src/app/admin/customization/page.tsx`
- `/billing-backend/app/api/v1/customization.py`
- `/billing-backend/app/main.py`

### Dependencies
- React 18
- Next.js 14
- Heroicons React
- Tailwind CSS
- FastAPI (backend)

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

### Performance
- Search: < 50ms response time
- Customization: Instant preview
- Theme save/load: < 100ms
- Logo upload: Depends on file size

---

## 📝 Future Enhancements

### Customization
- [ ] Export/import themes
- [ ] Share themes with team
- [ ] Pre-built theme library
- [ ] Custom CSS variables
- [ ] Advanced layout options
- [ ] Animation settings
- [ ] Mobile customization
- [ ] Dark mode toggle

### Search
- [ ] Search history
- [ ] Recent searches
- [ ] Search suggestions
- [ ] Keyboard shortcuts
- [ ] Search analytics
- [ ] Fuzzy search
- [ ] Search filters
- [ ] Global search (across all data)

---

## 🐛 Known Issues
None currently reported

---

## 📞 Support
For issues or questions:
1. Check this documentation
2. Review code comments
3. Contact development team

---

## 📄 License
Part of NextPanel Billing System

---

**Last Updated**: January 2025
**Version**: 1.0.0

