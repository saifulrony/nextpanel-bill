# 🎨 Drag & Drop Page Builder Guide

## Overview

A powerful visual page builder integrated into the `/admin/customization` page that allows you to create and edit any page with a drag-and-drop interface, similar to Elementor.

## Features

### ✨ Core Features

1. **Drag & Drop Interface**
   - Add components by clicking from the component library
   - Drag to reorder components
   - Visual feedback with selection indicators

2. **Component Library**
   - **Heading** - H1-H6 headings with customizable text
   - **Text** - Rich text paragraphs
   - **Button** - Call-to-action buttons
   - **Image** - Image elements with URL input
   - **Section** - Container sections for grouping
   - **Container** - Flexible containers
   - **Spacer** - Adjustable spacing
   - **Divider** - Horizontal dividers
   - **Card** - Card components
   - **Grid** - Grid layouts
   - **Video** - Embedded videos (YouTube, etc.)
   - **Form** - Contact forms

3. **Properties Panel**
   - Edit component properties in real-time
   - Customize:
     - Content (text, URLs, etc.)
     - Colors (background, text, borders)
     - Typography (font size, weight, alignment)
     - Spacing (padding, margin)
     - Borders (width, color, radius)
     - Size (width, height)
     - Custom CSS classes

4. **Responsive Preview**
   - Desktop view (100% width)
   - Tablet view (768px)
   - Mobile view (375px)
   - Switch between views instantly

5. **Preview Mode**
   - Toggle to see the final page
   - Hide all editing controls
   - Full-screen preview

6. **Undo/Redo**
   - Full history tracking
   - Undo changes
   - Redo changes
   - Visual indicators for available actions

7. **Export/Import**
   - Export page layouts as JSON
   - Import saved layouts
   - Share layouts between projects

8. **Save/Load**
   - Auto-save to localStorage
   - Load saved layouts on page reload
   - Persistent storage

## How to Use

### 1. Access the Page Builder

1. Navigate to `/admin/customization`
2. Click on the **"Page Builder"** tab (first tab with grid icon)
3. The page builder interface will load

### 2. Add Components

**Method 1: Click to Add**
- Click any component in the left sidebar
- Component appears in the canvas
- Click to select and edit

**Method 2: Drag to Add** (coming soon)
- Drag components from sidebar to canvas
- Drop in desired position

### 3. Edit Components

1. **Select a Component**
   - Click on any component in the canvas
   - Selected component shows blue border
   - Properties panel opens on the right

2. **Edit Properties**
   - Content: Edit text, URLs, etc.
   - Styling: Change colors, fonts, spacing
   - Layout: Adjust size, padding, margin
   - Advanced: Add custom CSS classes

3. **Live Preview**
   - Changes apply instantly
   - See results in real-time
   - No need to save to preview

### 4. Reorder Components

1. Click and hold a component
2. Drag to new position
3. Drop to reorder
4. Visual feedback during drag

### 5. Delete Components

1. Select the component
2. Click the red trash icon in the properties panel
3. Component is removed

### 6. Responsive Design

1. Click device icons in toolbar:
   - 💻 Desktop (100% width)
   - 📱 Tablet (768px)
   - 📱 Mobile (375px)
2. Preview how page looks on different devices
3. Adjust components for each breakpoint

### 7. Preview Mode

1. Click **"Preview"** button in toolbar
2. All editing controls hide
3. See final page as users will see it
4. Click **"Exit Preview"** to return to editing

### 8. Save Your Work

1. Click **"Save Page"** button
2. Layout saved to browser storage
3. Automatically loads on next visit
4. Export as JSON for backup

### 9. Export/Import

**Export:**
1. Click **"Export"** button
2. JSON file downloads
3. Save for backup or sharing

**Import:**
1. Click **"Import"** button
2. Select JSON file
3. Layout loads into builder

### 10. Undo/Redo

- **Undo** (Ctrl+Z): Revert last change
- **Redo** (Ctrl+Y): Redo reverted change
- Visual indicators show availability

## Component Types

### Text Components

#### Heading
```typescript
{
  type: 'heading',
  content: '<h1>Your Heading</h1>',
  style: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#000000'
  }
}
```

#### Text
```typescript
{
  type: 'text',
  content: '<p>Your paragraph text...</p>',
  style: {
    fontSize: '16px',
    lineHeight: '1.6'
  }
}
```

### Interactive Components

#### Button
```typescript
{
  type: 'button',
  content: 'Click Me',
  style: {
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    padding: '12px 24px',
    borderRadius: '8px'
  }
}
```

#### Form
```typescript
{
  type: 'form',
  props: {
    fields: ['name', 'email', 'message']
  }
}
```

### Media Components

#### Image
```typescript
{
  type: 'image',
  props: {
    src: 'https://example.com/image.jpg',
    alt: 'Description'
  },
  style: {
    width: '100%',
    height: 'auto'
  }
}
```

#### Video
```typescript
{
  type: 'video',
  props: {
    src: 'https://www.youtube.com/embed/VIDEO_ID'
  }
}
```

### Layout Components

#### Section
```typescript
{
  type: 'section',
  style: {
    backgroundColor: '#F3F4F6',
    padding: '48px',
    minHeight: '400px'
  },
  children: [
    // Child components
  ]
}
```

#### Container
```typescript
{
  type: 'container',
  style: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px'
  },
  children: [
    // Child components
  ]
}
```

#### Grid
```typescript
{
  type: 'grid',
  style: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px'
  },
  children: [
    // Grid items
  ]
}
```

### Utility Components

#### Spacer
```typescript
{
  type: 'spacer',
  props: {
    height: '50px'
  }
}
```

#### Divider
```typescript
{
  type: 'divider',
  style: {
    borderColor: '#E5E7EB',
    borderWidth: '1px'
  }
}
```

#### Card
```typescript
{
  type: 'card',
  style: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  children: [
    // Card content
  ]
}
```

## Styling Guide

### Colors

**Background Color:**
```css
backgroundColor: '#FFFFFF'
```

**Text Color:**
```css
color: '#1F2937'
```

**Border Color:**
```css
borderColor: '#E5E7EB'
```

### Typography

**Font Size:**
```css
fontSize: '16px'  // or '1rem', '1.2em'
```

**Font Weight:**
```css
fontWeight: 'bold'  // or 'normal', '600', '700'
```

**Text Alignment:**
```css
textAlign: 'center'  // or 'left', 'right', 'justify'
```

**Line Height:**
```css
lineHeight: '1.6'
```

### Spacing

**Padding:**
```css
padding: '16px'           // All sides
padding: '16px 24px'      // Top/Bottom, Left/Right
padding: '16px 24px 32px' // Top, Left/Right, Bottom
padding: '16px 24px 32px 40px' // Top, Right, Bottom, Left
```

**Margin:**
```css
margin: '16px'
margin: '16px auto'  // Center horizontally
```

### Borders

**Border Width:**
```css
borderWidth: '1px'
```

**Border Color:**
```css
borderColor: '#E5E7EB'
```

**Border Radius:**
```css
borderRadius: '8px'
borderRadius: '50%'  // Circle
```

### Size

**Width:**
```css
width: '100%'
width: '800px'
width: '50vw'
```

**Height:**
```css
height: 'auto'
height: '400px'
height: '50vh'
```

**Max Width:**
```css
maxWidth: '1200px'
```

## Advanced Features

### Custom CSS Classes

Add custom CSS classes to components:

```typescript
{
  type: 'button',
  content: 'Custom Button',
  className: 'my-custom-button hover:scale-105'
}
```

### Nested Components

Components can contain other components:

```typescript
{
  type: 'section',
  children: [
    {
      type: 'heading',
      content: 'Section Title'
    },
    {
      type: 'text',
      content: 'Section content...'
    },
    {
      type: 'button',
      content: 'Learn More'
    }
  ]
}
```

### Responsive Design

Use responsive units:

```typescript
{
  style: {
    fontSize: 'clamp(16px, 4vw, 24px)',
    padding: 'clamp(16px, 4vw, 48px)',
    width: 'min(100%, 1200px)'
  }
}
```

## Keyboard Shortcuts

- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Delete` - Delete selected component (when focused)
- `Escape` - Deselect component

## Tips & Best Practices

### 1. Start with a Plan
- Sketch your layout first
- Identify sections and components
- Plan responsive behavior

### 2. Use Sections
- Group related content in sections
- Easier to manage and style
- Better semantic structure

### 3. Consistent Spacing
- Use consistent padding/margin values
- Create visual rhythm
- Use spacing scale (8px, 16px, 24px, 32px, etc.)

### 4. Color Scheme
- Stick to your brand colors
- Use CSS variables for consistency
- Ensure sufficient contrast

### 5. Typography Hierarchy
- Clear heading hierarchy (H1 → H6)
- Consistent font sizes
- Readable line heights

### 6. Mobile-First
- Design for mobile first
- Test on all device sizes
- Adjust for larger screens

### 7. Performance
- Optimize images before uploading
- Use appropriate image formats
- Lazy load heavy content

### 8. Accessibility
- Add alt text to images
- Use semantic HTML
- Ensure color contrast
- Keyboard navigation

### 9. Save Frequently
- Use "Save Page" button
- Export backups regularly
- Version your layouts

### 10. Test Thoroughly
- Test on different browsers
- Check all interactive elements
- Verify responsive behavior
- Test forms and links

## Troubleshooting

### Components Not Appearing
- Check browser console for errors
- Refresh the page
- Clear localStorage and try again

### Changes Not Saving
- Check localStorage quota
- Export as backup before clearing
- Try different browser

### Styles Not Applying
- Check for CSS conflicts
- Verify CSS syntax
- Use browser DevTools to debug

### Drag and Drop Not Working
- Check if component is selected
- Try clicking and holding longer
- Refresh the page

### Import Not Working
- Verify JSON format
- Check for syntax errors
- Ensure file is valid JSON

## API Reference

### Component Interface

```typescript
interface Component {
  id: string;                    // Unique identifier
  type: ComponentType;           // Component type
  content?: string;              // HTML content
  props: Record<string, any>;    // Component properties
  children?: Component[];        // Nested components
  style?: React.CSSProperties;   // CSS styles
  className?: string;            // CSS classes
}
```

### PageBuilder Props

```typescript
interface PageBuilderProps {
  initialComponents?: Component[];  // Initial components
  onSave?: (components: Component[]) => void;  // Save callback
  onClose?: () => void;  // Close callback
}
```

## Examples

### Landing Page

```typescript
[
  {
    type: 'section',
    style: { backgroundColor: '#4F46E5', padding: '80px 24px', textAlign: 'center' },
    children: [
      {
        type: 'heading',
        content: '<h1>Welcome to Our Platform</h1>',
        style: { color: '#FFFFFF', fontSize: '48px', fontWeight: 'bold' }
      },
      {
        type: 'text',
        content: '<p>Build amazing things with our tools</p>',
        style: { color: '#E0E7FF', fontSize: '20px', marginTop: '16px' }
      },
      {
        type: 'button',
        content: 'Get Started',
        style: { marginTop: '32px', backgroundColor: '#FFFFFF', color: '#4F46E5' }
      }
    ]
  }
]
```

### Product Grid

```typescript
[
  {
    type: 'section',
    style: { padding: '64px 24px' },
    children: [
      {
        type: 'heading',
        content: '<h2>Our Products</h2>',
        style: { textAlign: 'center', marginBottom: '48px' }
      },
      {
        type: 'grid',
        style: { gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
        children: [
          // Product cards here
        ]
      }
    ]
  }
]
```

## Support

For issues or questions:
1. Check this guide first
2. Review browser console for errors
3. Try clearing localStorage
4. Contact support with details

## Future Enhancements

- More component types
- Advanced animations
- Template library
- Collaboration features
- Version control
- Advanced styling options
- Component library marketplace
- API integrations
- Custom component builder

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-27  
**Author:** NextPanel Team

