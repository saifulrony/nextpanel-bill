# Default Pages Management Feature

This document explains the comprehensive default pages management system that allows users to select and customize default pages for different sections of their website.

## 🚀 Overview

The Default Pages feature provides a centralized interface for managing which pages are used for different sections of your website (homepage, cart, shop, checkout, etc.). Users can select existing pages, create new ones, and customize them using the integrated page builder.

## 📋 Page Types Supported

### Core Pages
- **Homepage** - Main landing page of your website
- **Shopping Cart** - Cart page where customers review their items
- **Shop** - Product catalog and shopping page
- **Checkout** - Payment and order completion page
- **Order Success** - Order confirmation and thank you page

### Content Pages
- **About Us** - Company information and story
- **Contact** - Contact information and form
- **Privacy Policy** - Privacy policy and data protection
- **Terms of Service** - Terms and conditions

## 🎯 Key Features

### 1. Page Selection Interface
- **Visual Cards**: Each page type has a dedicated card with icon and description
- **Dropdown Selection**: Choose from existing pages for each page type
- **Create New**: Quick button to create new pages for any type
- **Preview**: Preview pages before making them live

### 2. Default Page Templates
Each page type comes with a pre-built template including:
- **Header Component**: Consistent navigation and branding
- **Page-Specific Content**: Tailored content for each page type
- **Footer Component**: Site-wide footer with links
- **Responsive Design**: Mobile-friendly layouts

### 3. Page Builder Integration
- **Seamless Editing**: Click "Edit" to open the page in the page builder
- **Real-time Preview**: See changes as you make them
- **Component Library**: Access to all available components
- **Customization**: Full control over layout, content, and styling

### 4. URL Parameter Support
- **Direct Editing**: Access pages directly via URL parameters
- **Create Mode**: Create new pages with specific types
- **Deep Linking**: Share direct links to specific page editors

## 🔧 Implementation Details

### Files Created/Modified

1. **`/admin/default-pages/page.tsx`** - Main default pages management interface
2. **`/admin/customization/page.tsx`** - Enhanced with URL parameter handling
3. **`/admin/layout.tsx`** - Added "Default Pages" to navigation menu

### URL Structure

- **Default Pages Management**: `/admin/default-pages`
- **Edit Existing Page**: `/admin/customization?page=page-id`
- **Create New Page**: `/admin/customization?type=page-type&action=create`

### Page Templates

Each page type has a default template with appropriate components:

#### Homepage Template
```typescript
[
  { type: 'header', ... },
  { type: 'heading', content: 'Welcome to NextPanel Billing' },
  { type: 'text', content: 'Professional billing...' },
  { type: 'products-grid' },
  { type: 'footer' }
]
```

#### Cart Template
```typescript
[
  { type: 'header', ... },
  { type: 'heading', content: 'Shopping Cart' },
  { type: 'cart', ... },
  { type: 'footer' }
]
```

#### Shop Template
```typescript
[
  { type: 'header', ... },
  { type: 'heading', content: 'Our Products' },
  { type: 'products-grid' },
  { type: 'footer' }
]
```

## 🎨 User Interface

### Default Pages Management Page

#### Visual Design
- **Grid Layout**: 2-column responsive grid for page type cards
- **Color-Coded**: Each page type has its own color scheme
- **Icons**: Intuitive icons for each page type
- **Status Indicators**: Clear indication of selected pages

#### Interactive Elements
- **Page Selection Dropdowns**: Choose from available pages
- **Create New Button**: Quick access to create new pages
- **Edit Button**: Direct access to page editor
- **Preview Button**: Open page in new tab
- **Save Configuration**: Persist page selections

### Page Editor Integration

#### URL Parameter Handling
```typescript
// Edit existing page
/admin/customization?page=page-1

// Create new page
/admin/customization?type=homepage&action=create
```

#### Automatic Template Loading
- **Page Detection**: Automatically detects page type from URL
- **Template Loading**: Loads appropriate default template
- **Builder Activation**: Automatically opens page builder
- **Component Setup**: Pre-populates with relevant components

## 🛠️ Technical Implementation

### State Management
```typescript
interface DefaultPageConfig {
  homepage: string;
  cart: string;
  shop: string;
  checkout: string;
  order_success: string;
  about: string;
  contact: string;
  privacy: string;
  terms: string;
}
```

### Page Type Mapping
```typescript
const pageTypes = [
  {
    key: 'homepage',
    label: 'Homepage',
    description: 'Main landing page of your website',
    icon: HomeIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  // ... other page types
];
```

### Template System
```typescript
const getDefaultPageTemplate = (pageType: string): Component[] => {
  const templates: Record<string, Component[]> = {
    homepage: [/* homepage components */],
    cart: [/* cart components */],
    // ... other templates
  };
  return templates[pageType] || templates.homepage;
};
```

## 🚀 Usage Guide

### For Administrators

1. **Access Default Pages**:
   - Navigate to Admin Panel
   - Click "Default Pages" in the sidebar
   - View all page types and their current selections

2. **Select Default Pages**:
   - Choose from dropdown for each page type
   - Select existing pages or create new ones
   - Save configuration when done

3. **Customize Pages**:
   - Click "Edit" on any selected page
   - Use the page builder to modify content
   - Preview changes before publishing

4. **Create New Pages**:
   - Click "Create New" button for any page type
   - Start with default template
   - Customize using page builder

### For Developers

1. **Add New Page Types**:
   - Add to `pageTypes` array in default-pages page
   - Create template in `getDefaultPageTemplate` function
   - Update page type mapping

2. **Customize Templates**:
   - Modify component arrays in templates
   - Add new components as needed
   - Update styling and properties

3. **Extend Functionality**:
   - Add new URL parameters
   - Implement additional page types
   - Create custom page templates

## 🎯 Benefits

### For Users
- **Centralized Management**: All page configurations in one place
- **Easy Customization**: Visual page builder for all pages
- **Consistent Design**: Default templates ensure consistency
- **Quick Setup**: Pre-built templates for common page types

### For Developers
- **Modular System**: Easy to add new page types
- **Template System**: Reusable page templates
- **URL Integration**: Deep linking support
- **Extensible**: Easy to extend with new features

## 🔄 Workflow

1. **Initial Setup**: System creates default pages for all types
2. **Page Selection**: Admin selects which pages to use for each type
3. **Customization**: Pages are edited using the page builder
4. **Publishing**: Changes are saved and go live immediately
5. **Management**: Ongoing maintenance and updates through the interface

## 🎉 Conclusion

The Default Pages Management feature provides a comprehensive solution for managing website pages, offering:

- **User-Friendly Interface**: Intuitive management of all page types
- **Powerful Customization**: Full page builder integration
- **Flexible Templates**: Pre-built templates for common page types
- **Seamless Integration**: Works with existing page builder system
- **Professional Results**: Consistent, professional-looking pages

This feature significantly enhances the website management capabilities, allowing users to create and maintain a complete, professional website without technical expertise.
