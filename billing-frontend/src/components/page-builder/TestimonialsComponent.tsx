'use client';

import React, { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Testimonial {
  id: string;
  name: string;
  role?: string;
  company?: string;
  avatar?: string;
  rating?: number;
  text: string;
  date?: string;
  verified?: boolean;
}

interface TestimonialsComponentProps {
  style?: React.CSSProperties;
  props?: {
    title?: string;
    subtitle?: string;
    testimonials?: Testimonial[];
    layout?: 'carousel' | 'grid' | 'list' | 'masonry';
    columns?: number;
    showRating?: boolean;
    showAvatar?: boolean;
    showCompany?: boolean;
    showDate?: boolean;
    autoplay?: boolean;
    autoplayInterval?: number;
    showNavigation?: boolean;
    showDots?: boolean;
    backgroundColor?: string;
    cardBackgroundColor?: string;
    cardBorderColor?: string;
    cardBorderRadius?: string;
    cardPadding?: string;
    cardShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    titleColor?: string;
    textColor?: string;
    authorColor?: string;
    roleColor?: string;
    ratingColor?: string;
    quoteIcon?: boolean;
    quoteIconColor?: string;
    quoteStyle?: 'left' | 'center' | 'right';
    spacing?: string;
    gap?: string;
    alignment?: 'left' | 'center' | 'right';
    responsiveColumns?: {
      desktop?: number;
      tablet?: number;
      mobile?: number;
    };
  };
}

export const TestimonialsComponent = React.memo(function TestimonialsComponent({
  style,
  props: componentProps
}: TestimonialsComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const title = componentProps?.title || 'What Our Customers Say';
  const subtitle = componentProps?.subtitle || 'Don\'t just take our word for it';
  const defaultTestimonials: Testimonial[] = [
    {
      id: '1',
      name: 'John Doe',
      role: 'CEO',
      company: 'Tech Corp',
      avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=4f46e5&color=fff',
      rating: 5,
      text: 'This service has completely transformed our business. The quality and support are outstanding!',
      date: '2024-01-15',
      verified: true,
    },
    {
      id: '2',
      name: 'Jane Smith',
      role: 'Marketing Director',
      company: 'Creative Agency',
      avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=10b981&color=fff',
      rating: 5,
      text: 'Incredible value for money. The features are exactly what we needed, and the team is always responsive.',
      date: '2024-01-10',
      verified: true,
    },
    {
      id: '3',
      name: 'Mike Johnson',
      role: 'CTO',
      company: 'Startup Inc',
      avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=f59e0b&color=fff',
      rating: 5,
      text: 'The best investment we\'ve made this year. Highly recommend to anyone looking for quality solutions.',
      date: '2024-01-05',
      verified: true,
    },
  ];
  
  const testimonials = componentProps?.testimonials || defaultTestimonials;
  const layout = componentProps?.layout || 'carousel';
  const columns = componentProps?.columns || 3;
  const showRating = componentProps?.showRating !== false;
  const showAvatar = componentProps?.showAvatar !== false;
  const showCompany = componentProps?.showCompany !== false;
  const showDate = componentProps?.showDate || false;
  const autoplay = componentProps?.autoplay || false;
  const autoplayInterval = componentProps?.autoplayInterval || 5000;
  const showNavigation = componentProps?.showNavigation !== false;
  const showDots = componentProps?.showDots !== false;
  const backgroundColor = componentProps?.backgroundColor || '#ffffff';
  const cardBackgroundColor = componentProps?.cardBackgroundColor || '#ffffff';
  const cardBorderColor = componentProps?.cardBorderColor || '#e5e7eb';
  const cardBorderRadius = componentProps?.cardBorderRadius || '0.5rem';
  const cardPadding = componentProps?.cardPadding || '1.5rem';
  const cardShadow = componentProps?.cardShadow || 'md';
  const titleColor = componentProps?.titleColor || '#111827';
  const textColor = componentProps?.textColor || '#374151';
  const authorColor = componentProps?.authorColor || '#111827';
  const roleColor = componentProps?.roleColor || '#6b7280';
  const ratingColor = componentProps?.ratingColor || '#fbbf24';
  const quoteIcon = componentProps?.quoteIcon || false;
  const quoteIconColor = componentProps?.quoteIconColor || '#e5e7eb';
  const quoteStyle = componentProps?.quoteStyle || 'left';
  const spacing = componentProps?.spacing || '3rem';
  const gap = componentProps?.gap || '1.5rem';
  const alignment = componentProps?.alignment || 'center';
  const responsiveColumns = componentProps?.responsiveColumns || {
    desktop: columns,
    tablet: Math.min(2, columns),
    mobile: 1
  };

  const getShadowStyle = () => {
    switch (cardShadow) {
      case 'none': return 'none';
      case 'sm': return '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
      case 'md': return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      case 'lg': return '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
      case 'xl': return '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
      default: return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    }
  };

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (autoplay && layout === 'carousel') {
      const interval = setInterval(nextTestimonial, autoplayInterval);
      return () => clearInterval(interval);
    }
  }, [autoplay, layout, autoplayInterval]);

  const renderRating = (rating: number = 5) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`w-5 h-5 ${i < rating ? 'fill-current' : 'text-gray-300'}`}
            style={{ color: i < rating ? ratingColor : '#d1d5db' }}
          />
        ))}
      </div>
    );
  };

  const renderTestimonial = (testimonial: Testimonial, index?: number) => {
    const cardStyle: React.CSSProperties = {
      backgroundColor: cardBackgroundColor,
      border: `1px solid ${cardBorderColor}`,
      borderRadius: cardBorderRadius,
      padding: cardPadding,
      boxShadow: getShadowStyle(),
      textAlign: quoteStyle,
    };

    return (
      <div key={testimonial.id} className="h-full" style={cardStyle}>
        {quoteIcon && (
          <div className="mb-4" style={{ color: quoteIconColor }}>
            <svg className="w-12 h-12 opacity-50" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
            </svg>
          </div>
        )}
        
        {showRating && testimonial.rating && (
          <div className="mb-3 flex justify-center">
            {renderRating(testimonial.rating)}
          </div>
        )}

        <p className="mb-6" style={{ color: textColor, fontSize: '1rem', lineHeight: '1.6' }}>
          "{testimonial.text}"
        </p>

        <div className="flex items-center" style={{ justifyContent: quoteStyle === 'center' ? 'center' : quoteStyle === 'right' ? 'flex-end' : 'flex-start' }}>
          {showAvatar && testimonial.avatar && (
            <img
              src={testimonial.avatar}
              alt={testimonial.name}
              className="w-12 h-12 rounded-full mr-4 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${testimonial.name}&background=4f46e5&color=fff`;
              }}
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold" style={{ color: authorColor }}>
                {testimonial.name}
              </h4>
              {testimonial.verified && (
                <span className="text-blue-500" title="Verified">
                  ✓
                </span>
              )}
            </div>
            {(testimonial.role || testimonial.company) && (
              <p className="text-sm" style={{ color: roleColor }}>
                {testimonial.role && `${testimonial.role}`}
                {testimonial.role && testimonial.company && ' at '}
                {testimonial.company}
              </p>
            )}
            {showDate && testimonial.date && (
              <p className="text-xs mt-1" style={{ color: roleColor, opacity: 0.7 }}>
                {new Date(testimonial.date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const containerStyle: React.CSSProperties = {
    ...style,
    backgroundColor,
    padding: spacing,
  };

  if (layout === 'carousel') {
    return (
      <div style={containerStyle} className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="text-center mb-12" style={{ textAlign: alignment }}>
            {title && (
              <h2 className="text-4xl font-bold mb-4" style={{ color: titleColor }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xl max-w-3xl mx-auto" style={{ color: roleColor }}>
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <div className="max-w-3xl mx-auto">
                    {renderTestimonial(testimonial)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showNavigation && testimonials.length > 1 && (
            <>
              <button
                onClick={prevTestimonial}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10"
                style={{ color: '#374151' }}
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <button
                onClick={nextTestimonial}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10"
                style={{ color: '#374151' }}
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            </>
          )}

          {showDots && testimonials.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentIndex ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (layout === 'grid' || layout === 'masonry') {
    return (
      <div style={containerStyle} className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="text-center mb-12" style={{ textAlign: alignment }}>
            {title && (
              <h2 className="text-4xl font-bold mb-4" style={{ color: titleColor }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xl max-w-3xl mx-auto" style={{ color: roleColor }}>
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div
          className={layout === 'masonry' ? 'columns-1' : 'grid'}
          style={{
            ...(layout === 'grid' && {
              gridTemplateColumns: `repeat(${responsiveColumns.desktop || columns}, 1fr)`,
              gap,
            }),
            ...(layout === 'masonry' && {
              columnCount: responsiveColumns.desktop || columns,
              columnGap: gap,
            }),
          }}
        >
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className={layout === 'masonry' ? 'break-inside-avoid mb-4' : ''}
            >
              {renderTestimonial(testimonial)}
            </div>
          ))}
        </div>

        <style jsx>{`
          @media (max-width: 1024px) {
            ${layout === 'grid' ? `
              div[style*="grid-template-columns"] {
                grid-template-columns: repeat(${responsiveColumns.tablet || 2}, 1fr) !important;
              }
            ` : ''}
            ${layout === 'masonry' ? `
              div[style*="column-count"] {
                column-count: ${responsiveColumns.tablet || 2} !important;
              }
            ` : ''}
          }
          @media (max-width: 768px) {
            ${layout === 'grid' ? `
              div[style*="grid-template-columns"] {
                grid-template-columns: repeat(${responsiveColumns.mobile || 1}, 1fr) !important;
              }
            ` : ''}
            ${layout === 'masonry' ? `
              div[style*="column-count"] {
                column-count: ${responsiveColumns.mobile || 1} !important;
              }
            ` : ''}
          }
        `}</style>
      </div>
    );
  }

  // List layout
  return (
    <div style={containerStyle} className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      {(title || subtitle) && (
        <div className="text-center mb-12" style={{ textAlign: alignment }}>
          {title && (
            <h2 className="text-4xl font-bold mb-4" style={{ color: titleColor }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-xl max-w-3xl mx-auto" style={{ color: roleColor }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="space-y-6" style={{ gap }}>
        {testimonials.map((testimonial) => renderTestimonial(testimonial))}
      </div>
    </div>
  );
});

