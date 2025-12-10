# Page Builder Refactoring Plan

## Current Issues
- `PageBuilderWithISR.tsx` is 4180+ lines (too large)
- Widget components are scattered in root directory
- Hard to maintain and test

## Proposed Structure

```
page-builder/
├── widgets/                    # Widget components (moved)
│   ├── BannerComponent.tsx
│   ├── CartComponent.tsx
│   ├── FAQComponent.tsx
│   ├── FooterComponent.tsx
│   ├── HeaderComponent.tsx
│   ├── NavMenuComponent.tsx
│   ├── PricingTableComponent.tsx
│   ├── SliderComponent.tsx
│   ├── TestimonialsComponent.tsx
│   └── index.ts
│
├── components/                 # Page builder UI components
│   ├── SortableComponent.tsx   # Extracted from PageBuilderWithISR (770 lines)
│   ├── PageBuilderHeader.tsx   # Toolbar/header section
│   ├── PageBuilderCanvas.tsx   # Canvas area
│   └── index.ts
│
├── hooks/                      # Custom hooks
│   ├── usePageBuilder.ts       # Main state management
│   ├── useZoom.ts              # Zoom logic
│   ├── useHistory.ts           # Undo/redo logic
│   └── index.ts
│
├── utils/                      # Utilities
│   ├── componentFactory.ts     # Component creation
│   ├── templates.ts            # Page templates
│   └── constants.ts            # Constants
│
├── constants/                   # Constants
│   └── components.ts           # Component definitions
│
└── PageBuilderWithISR.tsx      # Main component (reduced to ~500 lines)
```

## Extraction Steps

1. ✅ Move widgets to widgets/ folder
2. Extract SortableComponent (770 lines)
3. Extract PageBuilderHeader (toolbar)
4. Extract PageBuilderCanvas
5. Extract hooks (usePageBuilder, useZoom, useHistory)
6. Extract utilities (componentFactory, templates)
7. Extract constants

## Benefits

- Better organization
- Easier to test individual components
- Improved maintainability
- Better code reusability
- Easier to understand codebase

