# PropertiesPanel Refactoring Plan

## Current Situation
- **File Size**: ~4000 lines
- **Status**: Too large, needs refactoring
- **Components**: Handles 20+ different component types

## Proposed Folder Structure

```
PropertiesPanel/
├── components/          # Shared UI components
│   ├── Accordion.tsx   ✅ Created
│   ├── ImageUploadButton.tsx ✅ Created
│   └── index.ts        ✅ Created
│
├── tabs/               # Tab components (Content, Style, Motion)
│   ├── ContentTab.tsx
│   ├── StyleTab.tsx
│   ├── MotionTab.tsx
│   └── index.ts
│
├── panels/             # Component-specific property panels
│   ├── HeaderPanel.tsx
│   ├── FooterPanel.tsx
│   ├── CartPanel.tsx
│   ├── CheckoutPanel.tsx
│   ├── SliderPanel.tsx
│   ├── BannerPanel.tsx
│   ├── ButtonPanel.tsx
│   ├── HeadingPanel.tsx
│   ├── TextPanel.tsx
│   ├── ImagePanel.tsx
│   ├── VideoPanel.tsx
│   ├── ContainerPanel.tsx
│   ├── SidebarPanel.tsx
│   ├── ShortcodePanel.tsx
│   ├── AlertPanel.tsx
│   ├── SocialIconsPanel.tsx
│   ├── DomainSearchPanel.tsx
│   ├── ProductsGridPanel.tsx
│   ├── FeaturedProductsPanel.tsx
│   ├── ShowcasePanel.tsx
│   ├── PricingTablePanel.tsx
│   ├── TestimonialsPanel.tsx
│   ├── FAQPanel.tsx
│   ├── NavMenuPanel.tsx
│   ├── GenericPanel.tsx  # For simple components
│   └── index.ts
│
├── utils/              # Utility functions and hooks
│   ├── useComponentProps.ts
│   ├── useComponentStyles.ts
│   ├── componentDefaults.ts
│   └── index.ts
│
├── types.ts            # Type definitions
├── PropertiesPanel.tsx  # Main orchestrator component
└── index.ts            # Public exports
```

## Refactoring Strategy

### Phase 1: Extract Shared Components ✅
- [x] Accordion component
- [x] ImageUploadButton component

### Phase 2: Extract Tab Components
- [ ] ContentTab - handles all content-related properties
- [ ] StyleTab - handles all styling properties
- [ ] MotionTab - handles animation and transition properties

### Phase 3: Extract Component-Specific Panels
Group components by complexity:

**High Priority (Most Complex):**
1. CheckoutPanel - Has form field management modal
2. PricingTablePanel - Has plan management
3. ProductsGridPanel - Has product configuration
4. HeaderPanel - Has navigation menu configuration
5. FooterPanel - Has link management

**Medium Priority:**
6. SliderPanel
7. BannerPanel
8. NavMenuPanel
9. TestimonialsPanel
10. FAQPanel

**Low Priority (Simple):**
11. ButtonPanel
12. HeadingPanel
13. TextPanel
14. ImagePanel
15. VideoPanel
16. ContainerPanel
17. GenericPanel (for remaining simple components)

### Phase 4: Extract Utilities
- [ ] useComponentProps hook
- [ ] useComponentStyles hook
- [ ] componentDefaults constants

### Phase 5: Create Main Orchestrator
- [ ] PropertiesPanel.tsx - Main component that:
  - Manages tab state
  - Renders appropriate tab
  - Delegates to component-specific panels

## Benefits

1. **Maintainability**: Each component in its own file (~100-300 lines)
2. **Reusability**: Shared components can be reused
3. **Testability**: Easier to test individual components
4. **Performance**: Better code splitting opportunities
5. **Collaboration**: Multiple developers can work on different panels
6. **Readability**: Much easier to find and understand code

## Migration Steps

1. ✅ Create folder structure
2. ✅ Extract shared components (Accordion, ImageUploadButton)
3. Update main PropertiesPanel.tsx to import from new structure
4. Extract tabs one by one
5. Extract panels one by one (start with most complex)
6. Extract utilities
7. Update all imports
8. Test thoroughly
9. Remove old code

## Estimated File Sizes After Refactoring

- Main PropertiesPanel.tsx: ~200-300 lines
- Each Tab: ~100-200 lines
- Each Panel: ~100-400 lines (depending on complexity)
- Shared Components: ~50-100 lines each
- Utilities: ~50-150 lines each

**Total**: Same functionality, but organized into ~30-40 smaller, manageable files.

