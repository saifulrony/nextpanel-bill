'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Component, ComponentType } from './types';
import {
  DomainSearchComponent,
  ProductsGridComponent,
  FeaturedProductsComponent,
  ProductSearchComponent,
  ContactFormComponent,
  NewsletterComponent,
} from './DynamicComponents';
import HeaderComponent from './HeaderComponent';
import FooterComponent from './FooterComponent';
import CartComponent from './CartComponent';
import ResponsiveContainer from './ResponsiveContainer';
import ResponsiveGrid from './ResponsiveGrid';
import ResponsiveShowcase from './ResponsiveShowcase';
import ElementorGrid from './ElementorGrid';
import SliderComponent from './SliderComponent';
import BannerComponent from './BannerComponent';
import NavMenuComponent from './NavMenuComponent';
import { PricingTableComponent } from './PricingTableComponent';
import { TestimonialsComponent } from './TestimonialsComponent';
import { FAQComponent } from './FAQComponent';

interface ComponentRendererProps {
  component: Component;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onAddToContainer?: (type: ComponentType, containerId?: string, columnIndex?: number) => void;
  onColumnClick?: (containerId: string, columnIndex: number) => void;
  onColumnAddClick?: (containerId: string, columnIndex: number) => void;
  onAddColumn?: (containerId: string) => void;
  onRemoveColumn?: (containerId: string) => void;
  onAddAfter?: (componentId: string, type: ComponentType) => void;
  containerId?: string;
  columnIndex?: number;
  isEditor?: boolean; // New prop to distinguish editor vs frontend mode
  selectedComponent?: string | null; // Add selected component ID for nested components
}

export default function ComponentRenderer({
  component,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onAddToContainer,
  onColumnClick,
  onColumnAddClick,
  onAddColumn,
  onRemoveColumn,
  onAddAfter,
  containerId,
  columnIndex,
  isEditor = true, // Default to editor mode for backward compatibility
  selectedComponent = null,
}: ComponentRendererProps) {
  const baseClasses = `
    relative transition-all
    ${isEditor && isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
    ${isEditor && isHovered && !isSelected ? 'ring-2 ring-indigo-300 ring-offset-2' : ''}
  `;

  const renderComponent = () => {
    switch (component.type) {
      case 'heading':
        const headingLevel = component.props?.level || 'h1';
        const headingText = component.props?.text || component.content || 'Heading Text';
        
        // Check if the content contains HTML tags
        const hasHtmlTags = /<[^>]*>/g.test(headingText);
        
        // Ensure headingLevel is a valid string
        const validHeadingLevel = typeof headingLevel === 'string' && headingLevel.startsWith('h') 
          ? headingLevel 
          : 'h1';
        
        return (
          <div
            style={{ 
              color: component.props?.color || '#000000',
              fontSize: component.props?.fontSize || '2.25rem',
              fontWeight: component.props?.fontWeight || '700',
              fontFamily: component.props?.fontFamily || 'Inter',
              textAlign: component.props?.textAlign || 'left',
              lineHeight: component.props?.lineHeight || '1.2',
              letterSpacing: component.props?.letterSpacing || '-0.025em',
              margin: component.props?.margin || '0',
              padding: component.props?.padding || '0',
              ...component.style 
            }}
            className={`${component.className || ''} ${isEditor && isHovered ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
          >
            {hasHtmlTags ? (
              <div dangerouslySetInnerHTML={{ __html: headingText }} />
            ) : (
              React.createElement(validHeadingLevel, null, headingText)
            )}
          </div>
        );

      case 'text':
        const textContent = component.props?.text || component.content || 'Text content goes here...';
        return (
          <div
            style={{ 
              color: component.props?.color || '#000000',
              fontSize: component.props?.fontSize || '1rem',
              fontWeight: component.props?.fontWeight || '400',
              fontFamily: component.props?.fontFamily || 'Inter',
              textAlign: component.props?.textAlign || 'left',
              lineHeight: component.props?.lineHeight || '1.5',
              letterSpacing: component.props?.letterSpacing || '0',
              margin: component.props?.margin || '0',
              padding: component.props?.padding || '0',
              maxWidth: component.props?.maxWidth || 'none',
              whiteSpace: component.props?.whiteSpace || 'normal',
              ...component.style 
            }}
            className={`${component.className || ''} ${isEditor && isHovered ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
            dangerouslySetInnerHTML={{ __html: textContent }}
          />
        );

      case 'button':
        const buttonContent = component.content || 'Button';
        return (
          <button
            style={{ 
              backgroundColor: component.props?.backgroundColor || '#4f46e5',
              color: component.props?.textColor || '#ffffff',
              borderColor: component.props?.borderColor || '#4f46e5',
              borderRadius: component.props?.borderRadius || '0.375rem',
              padding: component.props?.padding || '0.75rem 1.5rem',
              fontSize: component.props?.fontSize || '1rem',
              fontWeight: component.props?.fontWeight || '500',
              border: '1px solid',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: component.props?.fullWidth ? '100%' : 'auto',
              opacity: component.props?.disabled ? 0.6 : 1,
              ...component.style 
            }}
            className={`${component.className || ''} ${isEditor && isHovered ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
            onClick={(e) => e.stopPropagation()}
            disabled={component.props?.disabled || false}
            onMouseEnter={(e) => {
              if (!component.props?.disabled) {
                e.currentTarget.style.backgroundColor = component.props?.hoverBackgroundColor || '#3730a3';
                e.currentTarget.style.color = component.props?.hoverTextColor || '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!component.props?.disabled) {
                e.currentTarget.style.backgroundColor = component.props?.backgroundColor || '#4f46e5';
                e.currentTarget.style.color = component.props?.textColor || '#ffffff';
              }
            }}
          >
            {component.props?.loading ? 'Loading...' : buttonContent}
          </button>
        );

      case 'image':
        return (
          <div className="relative">
            <img
              src={component.props?.src || 'https://via.placeholder.com/400x200?text=Image'}
              alt={component.props?.alt || 'Image'}
              style={{
                width: component.props?.width || 'auto',
                height: component.props?.height || 'auto',
                maxWidth: component.props?.maxWidth || '100%',
                objectFit: component.props?.objectFit || 'cover',
                borderRadius: component.props?.borderRadius || '0',
                border: component.props?.border || 'none',
                borderColor: component.props?.borderColor || '#e5e7eb',
                borderWidth: component.props?.borderWidth || '0',
                margin: component.props?.margin || '0',
                padding: component.props?.padding || '0',
                backgroundColor: component.props?.backgroundColor || 'transparent',
                boxShadow: component.props?.shadow === 'none' ? 'none' : 
                          component.props?.shadow === 'sm' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' :
                          component.props?.shadow === 'md' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' :
                          component.props?.shadow === 'lg' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' :
                          component.props?.shadow === 'xl' ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' : 'none',
                ...component.style 
              }}
              className={`${component.className || ''} ${isEditor && isHovered ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
              loading={component.props?.lazy ? 'lazy' : 'eager'}
            />
            {component.props?.showCaption && component.props?.caption && (
              <div 
                style={{
                  color: component.props?.captionColor || '#6b7280',
                  fontSize: component.props?.captionFontSize || '0.875rem',
                  marginTop: component.props?.captionPosition === 'below' ? '0.5rem' : '0',
                  marginBottom: component.props?.captionPosition === 'above' ? '0.5rem' : '0'
                }}
                className={`text-center ${component.props?.captionPosition === 'above' ? 'order-first' : ''}`}
              >
                {component.props.caption}
              </div>
            )}
          </div>
        );

      case 'section':
        return (
          <div
            style={component.style}
            className={`min-h-[200px] p-6 ${component.className || ''}`}
          >
            {component.children?.map((child) => (
              <ComponentRenderer
                key={child.id}
                component={child}
                isSelected={false}
                isHovered={false}
                onClick={() => {}}
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
                onAddToContainer={onAddToContainer}
                onColumnClick={onColumnClick}
                onAddColumn={onAddColumn}
                onRemoveColumn={onRemoveColumn}
              />
            ))}
          </div>
        );

      case 'container':
        return (
          <ResponsiveContainer
            component={component}
            isSelected={isSelected}
                        isHovered={isHovered}
                        onAddColumn={onAddColumn}
                        onRemoveColumn={onRemoveColumn}
            onColumnClick={onColumnClick}
            onColumnAddClick={onColumnAddClick}
            onAddToContainer={onAddToContainer}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
                        onAddAfter={onAddAfter}
                        isEditor={isEditor}
                        selectedComponent={selectedComponent}
                      />
        );

      case 'spacer':
        return (
          <div
            style={{
              height: component.props.height || '30px',
              ...component.style,
            }}
            className={`bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center ${component.className || ''} ${isHovered ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
          >
            <span className="text-xs text-gray-400">Spacer</span>
          </div>
        );

      case 'divider':
        return (
          <hr
            style={component.style}
            className={`my-4 border-gray-300 ${component.className || ''}`}
          />
        );

      case 'card':
        return (
          <div
            style={component.style}
            className={`bg-white border border-gray-200 rounded shadow-sm p-3 ${component.className || ''} ${isHovered ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
          >
            {component.content && (
              <div dangerouslySetInnerHTML={{ __html: component.content }} />
            )}
            {component.children?.map((child) => (
              <ComponentRenderer
                key={child.id}
                component={child}
                isSelected={false}
                isHovered={false}
                onClick={() => {}}
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
                onAddToContainer={onAddToContainer}
                onColumnClick={onColumnClick}
                onAddColumn={onAddColumn}
                onRemoveColumn={onRemoveColumn}
              />
            ))}
          </div>
        );

      case 'grid':
        return (
          <ElementorGrid
            component={component}
            isSelected={isSelected}
            isHovered={isHovered}
                onAddToContainer={onAddToContainer}
                onColumnClick={onColumnClick}
            onColumnAddClick={onColumnAddClick}
                onAddColumn={onAddColumn}
                onRemoveColumn={onRemoveColumn}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onAddAfter={onAddAfter}
            isEditor={isEditor}
            selectedComponent={selectedComponent}
              />
        );

      case 'video':
        // Helper function to convert YouTube URLs to embed format
        const getEmbedUrl = (url: string): string => {
          if (!url) return 'https://www.youtube.com/embed/dQw4w9WgXcQ';
          
          // If already an embed URL, return as is
          if (url.includes('youtube.com/embed/')) {
            return url;
          }
          
          // Extract video ID from various YouTube URL formats
          let videoId = '';
          
          // Handle watch URLs: https://www.youtube.com/watch?v=VIDEO_ID
          const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
          if (watchMatch) {
            videoId = watchMatch[1];
          } else if (url.includes('youtube.com/embed/')) {
            // Already embed format
            videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
          } else if (url.includes('youtu.be/')) {
            // Short URL format
            videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
          }
          
          if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
          }
          
          // If we can't parse it, try to use it directly (might be other video providers)
          return url;
        };

        const embedUrl = getEmbedUrl(component.props?.src || '');
        
        return (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );

      case 'form':
        return (
          <form
            style={component.style}
            className={`bg-white p-6 rounded-lg border border-gray-200 ${component.className || ''}`}
            onSubmit={(e) => e.preventDefault()}
          >
            <h3 className="text-lg font-semibold mb-4">Contact Form</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Your message"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Submit
              </button>
            </div>
          </form>
        );

      case 'domain-search':
        return <DomainSearchComponent style={component.style} />;

      case 'products-grid':
        return <ProductsGridComponent style={component.style} props={component.props} />;

      case 'featured-products':
        return <FeaturedProductsComponent style={component.style} props={component.props} />;

      case 'product-search':
        return <ProductSearchComponent style={component.style} />;

      case 'contact-form':
        return <ContactFormComponent style={component.style} />;

      case 'newsletter':
        return <NewsletterComponent style={component.style} />;

      case 'slider': {
        const slides = component.props?.slides || [
          {
            id: '1',
            image: 'https://via.placeholder.com/1200x600?text=Slide+1',
            title: 'Slide 1 Title',
            description: 'Slide 1 description text',
            buttonText: 'Learn More',
            buttonLink: '#',
            overlay: true,
            overlayOpacity: 0.5,
          },
          {
            id: '2',
            image: 'https://via.placeholder.com/1200x600?text=Slide+2',
            title: 'Slide 2 Title',
            description: 'Slide 2 description text',
            buttonText: 'Get Started',
            buttonLink: '#',
            overlay: true,
            overlayOpacity: 0.5,
          },
        ];
        
        const autoplay = component.props?.autoplay !== false;
        const autoplayInterval = component.props?.autoplayInterval || 5000;
        const showArrows = component.props?.showArrows !== false;
        const showDots = component.props?.showDots !== false;
        const height = component.props?.height || '600px';
        const heightMobile = component.props?.heightMobile || '400px';
        const heightTablet = component.props?.heightTablet || '500px';
        const transition = component.props?.transition || 'slide';
        const animationSpeed = component.props?.animationSpeed || 500;
        
        return (
          <SliderComponent
            slides={slides}
            autoplay={autoplay}
            autoplayInterval={autoplayInterval}
            showArrows={showArrows}
            showDots={showDots}
            height={height}
            heightMobile={heightMobile}
            heightTablet={heightTablet}
            transition={transition}
            animationSpeed={animationSpeed}
            style={component.style}
            props={component.props}
          />
        );
      }

      case 'banner': {
        const bannerContent = component.props?.content || component.content || 'Banner Content';
        const height = component.props?.height || '300px';
        const heightMobile = component.props?.heightMobile || '200px';
        const heightTablet = component.props?.heightTablet || '250px';
        const backgroundImage = component.props?.backgroundImage || '';
        const backgroundColor = component.props?.backgroundColor || '#4f46e5';
        const backgroundGradient = component.props?.backgroundGradient || '';
        const overlay = component.props?.overlay !== false;
        const overlayOpacity = component.props?.overlayOpacity || 0.3;
        const overlayColor = component.props?.overlayColor || '#000000';
        const textAlign = component.props?.textAlign || 'center';
        const verticalAlign = component.props?.verticalAlign || 'center';
        
        return (
          <BannerComponent
            content={bannerContent}
            height={height}
            heightMobile={heightMobile}
            heightTablet={heightTablet}
            backgroundImage={backgroundImage}
            backgroundColor={backgroundColor}
            backgroundGradient={backgroundGradient}
            overlay={overlay}
            overlayOpacity={overlayOpacity}
            overlayColor={overlayColor}
            textAlign={textAlign}
            verticalAlign={verticalAlign}
            style={component.style}
            props={component.props}
          />
        );
      }

      case 'nav-menu': {
        const menuItems = component.props?.items || [
          {
            id: '1',
            label: 'Home',
            link: '/',
            icon: 'home',
            iconType: 'heroicon',
            openInNewTab: false,
          },
          {
            id: '2',
            label: 'About',
            link: '/about',
            icon: 'about',
            iconType: 'heroicon',
            openInNewTab: false,
          },
        ];
        
        return (
          <NavMenuComponent
            items={menuItems}
            orientation={component.props?.orientation || 'horizontal'}
            alignment={component.props?.alignment || 'left'}
            backgroundColor={component.props?.backgroundColor || 'transparent'}
            textColor={component.props?.textColor || '#374151'}
            hoverColor={component.props?.hoverColor || '#4f46e5'}
            activeColor={component.props?.activeColor || '#4f46e5'}
            fontSize={component.props?.fontSize || '1rem'}
            fontWeight={component.props?.fontWeight || '500'}
            padding={component.props?.padding || '0.75rem 1rem'}
            gap={component.props?.gap || '0.5rem'}
            borderRadius={component.props?.borderRadius || '0.375rem'}
            showIcons={component.props?.showIcons !== false}
            mobileBreakpoint={component.props?.mobileBreakpoint || 768}
            mobileMenuStyle={component.props?.mobileMenuStyle || 'dropdown'}
            style={component.style}
            props={component.props}
          />
        );
      }

      case 'header':
        return (
          <HeaderComponent 
            style={component.style} 
            className={component.className}
            props={component.props}
            isEditor={isEditor}
          />
        );

      case 'footer':
        return (
          <FooterComponent 
            style={component.style} 
            className={component.className}
            props={component.props}
            isEditor={isEditor}
          />
        );

      case 'cart':
        return (
          <CartComponent 
            style={component.style} 
            className={component.className}
            props={component.props}
            isEditor={isEditor}
          />
        );

      case 'code-block':
        const language = component.props?.language || 'HTML';
        const codeContent = component.content || '';
        
        // For HTML, render the actual HTML content
        if (language === 'HTML') {
          return (
            <div
              style={{ 
                padding: isEditor ? '1rem' : '0',
                border: isEditor ? '2px dashed #e5e7eb' : 'none',
                borderRadius: isEditor ? '0.5rem' : '0',
                backgroundColor: isEditor ? '#f9fafb' : 'transparent',
                ...component.style 
              }}
              className={`${component.className || ''} ${isEditor && isHovered ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
            >
              {isEditor && (
                <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>
                    {language} Code Block - Live Preview
                  </span>
                </div>
              )}
              <div dangerouslySetInnerHTML={{ __html: codeContent }} />
            </div>
          );
        }
        
        // For CSS, apply the styles and show a preview
        if (language === 'CSS') {
          return (
            <div
              style={{ 
                padding: isEditor ? '1rem' : '0',
                border: isEditor ? '2px dashed #e5e7eb' : 'none',
                borderRadius: isEditor ? '0.5rem' : '0',
                backgroundColor: isEditor ? '#f9fafb' : 'transparent',
                ...component.style 
              }}
              className={`${component.className || ''} ${isEditor && isHovered ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
            >
              {isEditor && (
                <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>
                    {language} Code Block - Style Preview
                  </span>
                </div>
              )}
              <style dangerouslySetInnerHTML={{ __html: codeContent }} />
              <div style={{ 
                padding: '1rem',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                marginTop: '0.5rem'
              }}>
                <p style={{ margin: 0, color: '#374151' }}>Styled content preview</p>
              </div>
            </div>
          );
        }
        
        // For JavaScript, show a preview with console output
        if (language === 'JavaScript') {
          return (
            <div
              style={{ 
                padding: isEditor ? '1rem' : '0',
                border: isEditor ? '2px dashed #e5e7eb' : 'none',
                borderRadius: isEditor ? '0.5rem' : '0',
                backgroundColor: isEditor ? '#f9fafb' : 'transparent',
                ...component.style 
              }}
              className={`${component.className || ''} ${isEditor && isHovered ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
            >
              {isEditor && (
                <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>
                    {language} Code Block - Interactive Preview
                  </span>
                </div>
              )}
              <script dangerouslySetInnerHTML={{ __html: codeContent }} />
              <div style={{ 
                padding: '1rem',
                backgroundColor: '#1f2937',
                borderRadius: '0.5rem',
                marginTop: '0.5rem',
                color: '#f3f4f6',
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}>
                <div>JavaScript executed - check console for output</div>
              </div>
            </div>
          );
        }
        
        // For other languages, show formatted code
        return (
          <div
            style={{ 
              padding: isEditor ? '1rem' : '0',
              border: isEditor ? '2px dashed #e5e7eb' : 'none',
              borderRadius: isEditor ? '0.5rem' : '0',
              backgroundColor: isEditor ? '#f9fafb' : 'transparent',
              ...component.style 
            }}
            className={`${component.className || ''} ${isEditor && isHovered ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
          >
            {isEditor && (
              <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>
                  {language} Code Block
                </span>
              </div>
            )}
            <div style={{ 
              padding: '1rem',
              backgroundColor: '#1f2937',
              borderRadius: '0.5rem',
              color: '#f3f4f6',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {codeContent}
            </div>
          </div>
        );

      case 'sidebar':
        return (
          <div
            style={{
              width: component.props?.width || '300px',
              backgroundColor: component.props?.backgroundColor || '#f8fafc',
              padding: '1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              ...component.style
            }}
            className={`${component.className || ''} ${isEditor && isHovered ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
          >
            {component.props?.showTitle && (
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                {component.props?.title || 'Sidebar'}
              </h3>
            )}
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Sidebar content goes here...
            </div>
          </div>
        );

      case 'shortcode':
        return (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f3f4f6',
              border: '1px dashed #9ca3af',
              borderRadius: '0.5rem',
              fontFamily: 'monospace',
              ...component.style
            }}
            className={`${component.className || ''} ${isEditor && isHovered ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
          >
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              Shortcode:
            </div>
            <div style={{ fontSize: '0.875rem', color: '#374151' }}>
              {component.props?.shortcode || component.content || '[shortcode_example]'}
            </div>
          </div>
        );

      case 'alert':
        const alertColors = {
          info: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
          success: { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
          warning: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
          error: { bg: '#fee2e2', text: '#dc2626', border: '#ef4444' }
        };
        const alertType = component.props?.type || 'info';
        const colors = alertColors[alertType as keyof typeof alertColors] || alertColors.info;
        
        return (
          <div
            style={{
              padding: '1rem',
              backgroundColor: component.props?.backgroundColor || colors.bg,
              color: component.props?.textColor || colors.text,
              border: `1px solid ${component.props?.borderColor || colors.border}`,
              borderRadius: '0.5rem',
              ...component.style
            }}
            className={`${component.className || ''} ${isEditor && isHovered ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
          >
            {component.props?.title && (
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                {component.props.title}
              </h4>
            )}
            <div style={{ fontSize: '0.875rem' }}>
              {component.content || 'Alert message'}
            </div>
          </div>
        );

      case 'social-icons':
        const socialPlatforms = component.props?.platforms || ['facebook', 'twitter', 'instagram', 'linkedin'];
        const iconSize = component.props?.size === 'large' ? '1.5rem' : component.props?.size === 'small' ? '1rem' : '1.25rem';
        
        return (
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: component.props?.alignment === 'left' ? 'flex-start' : 
                             component.props?.alignment === 'right' ? 'flex-end' : 'center',
              alignItems: 'center',
              padding: '1rem',
              ...component.style
            }}
            className={`${component.className || ''} ${isEditor && isHovered ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
          >
            {socialPlatforms.map((platform: any, index: number) => (
              <div
                key={index}
                style={{
                  width: iconSize,
                  height: iconSize,
                  backgroundColor: '#6b7280',
                  borderRadius: component.props?.style === 'rounded' ? '50%' : '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}
                title={platform}
              >
                {platform.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        );

      case 'showcase':
        return (
          <ResponsiveShowcase
            component={component}
            isEditor={isEditor}
            isHovered={isHovered}
          />
        );

      case 'pricing-table':
        return (
          <PricingTableComponent
            style={component.style}
            props={component.props}
          />
        );

      case 'testimonials':
        return (
          <TestimonialsComponent
            style={component.style}
            props={component.props}
          />
        );

      case 'faq':
        return (
          <FAQComponent
            style={component.style}
            props={component.props}
          />
        );

      default:
        return (
          <div className="p-4 bg-gray-100 border border-gray-300 rounded">
            <p className="text-sm text-gray-600">Unknown component type: {component.type}</p>
          </div>
        );
    }
  };

  // Custom code wrapper
  const CustomCodeWrapper = ({ children }: { children: React.ReactNode }) => {
    const hasCustomCode = component.props?.htmlCode || component.props?.cssCode || component.props?.jsCode;
    
    if (!hasCustomCode) {
      return <>{children}</>;
    }

    return (
      <>
        {/* Custom CSS */}
        {component.props?.cssCode && (
          <style dangerouslySetInnerHTML={{ __html: component.props.cssCode }} />
        )}
        
        {/* Custom HTML wrapper */}
        {component.props?.htmlCode ? (
          <div dangerouslySetInnerHTML={{ __html: component.props.htmlCode }} />
        ) : (
          children
        )}
        
        {/* Custom JavaScript */}
        {component.props?.jsCode && (
          <script dangerouslySetInnerHTML={{ __html: component.props.jsCode }} />
        )}
      </>
    );
  };

  return (
    <div className="relative group">
      <div
        className={`${baseClasses} relative`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ cursor: 'pointer' }}
      >
        <CustomCodeWrapper>
          {renderComponent()}
        </CustomCodeWrapper>
        {isEditor && isSelected && (
          <div className="absolute -top-8 left-0 bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
            {component.type}
          </div>
        )}
        {isEditor && isHovered && !isSelected && (
          <div className="absolute inset-0 border-2 border-dashed border-indigo-300 bg-indigo-50/30 pointer-events-none" />
        )}
        
        {/* Drag Handle - Only show in editor mode */}
        {isEditor && (isHovered || isSelected) && (
          <div className="absolute top-2 left-2 bg-gray-800 text-white p-1.5 rounded shadow-lg z-20 cursor-move opacity-90 hover:opacity-100 transition-opacity">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="8" cy="6" r="1.5"/>
              <circle cx="8" cy="10" r="1.5"/>
              <circle cx="8" cy="14" r="1.5"/>
              <circle cx="8" cy="18" r="1.5"/>
              <circle cx="16" cy="6" r="1.5"/>
              <circle cx="16" cy="10" r="1.5"/>
              <circle cx="16" cy="14" r="1.5"/>
              <circle cx="16" cy="18" r="1.5"/>
            </svg>
          </div>
        )}
        
        {/* Plus Button for adding components after this one - Only show in editor mode */}
        {isEditor && onAddAfter && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Show component picker modal
              const event = new CustomEvent('showComponentPicker', {
                detail: { afterComponentId: component.id }
              });
              window.dispatchEvent(event);
            }}
            className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-200 bg-indigo-600 text-white rounded-full p-1.5 shadow-lg hover:bg-indigo-700 transform hover:scale-110 transition-all"
            style={{
              position: 'absolute',
              bottom: '-14px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999
            }}
            title="Add component after this one"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

