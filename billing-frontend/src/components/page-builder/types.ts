export type ComponentType = 
  | 'text'
  | 'heading'
  | 'button'
  | 'image'
  | 'section'
  | 'container'
  | 'spacer'
  | 'divider'
  | 'icon'
  | 'card'
  | 'grid'
  | 'video'
  | 'form'
  | 'domain-search'
  | 'products-grid'
  | 'product-search'
  | 'contact-form'
  | 'newsletter';

export interface Component {
  id: string;
  type: ComponentType;
  content?: string;
  props: Record<string, any>;
  children?: Component[];
  style?: React.CSSProperties;
  className?: string;
}

export interface PageLayout {
  id: string;
  name: string;
  path: string;
  components: Component[];
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
}

export interface BuilderState {
  selectedComponent: string | null;
  hoveredComponent: string | null;
  components: Component[];
  history: Component[][];
  historyIndex: number;
  previewMode: boolean;
  deviceView: 'desktop' | 'tablet' | 'mobile';
}

