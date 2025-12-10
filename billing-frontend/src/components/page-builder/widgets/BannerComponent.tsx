'use client';

import React from 'react';

interface BannerComponentProps {
  content: string;
  height?: string;
  heightMobile?: string;
  heightTablet?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  backgroundGradient?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  overlayColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'center' | 'bottom';
  style?: React.CSSProperties;
  props?: Record<string, any>;
}

export default function BannerComponent({
  content,
  height = '300px',
  heightMobile = '200px',
  heightTablet = '250px',
  backgroundImage = '',
  backgroundColor = '#4f46e5',
  backgroundGradient = '',
  overlay = true,
  overlayOpacity = 0.3,
  overlayColor = '#000000',
  textAlign = 'center',
  verticalAlign = 'center',
  style,
  props,
}: BannerComponentProps) {
  const getBackgroundStyle = () => {
    if (backgroundGradient) {
      return { background: backgroundGradient };
    }
    if (backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: props?.backgroundSize || 'cover',
        backgroundPosition: props?.backgroundPosition || 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    return { backgroundColor };
  };

  const getVerticalAlignClass = () => {
    switch (verticalAlign) {
      case 'top':
        return 'justify-start pt-8';
      case 'bottom':
        return 'justify-end pb-8';
      default:
        return 'justify-center';
    }
  };

  const getTextAlignClass = () => {
    switch (textAlign) {
      case 'left':
        return 'items-start';
      case 'right':
        return 'items-end';
      default:
        return 'items-center';
    }
  };

  return (
    <>
      <style jsx>{`
        .banner-container {
          height: ${height};
        }
        @media (max-width: 768px) {
          .banner-container {
            height: ${heightMobile} !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .banner-container {
            height: ${heightTablet} !important;
          }
        }
      `}</style>
      <div
        className="banner-container relative w-full overflow-hidden"
        style={{
          ...getBackgroundStyle(),
          ...style,
        }}
      >
        {/* Overlay */}
        {overlay && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: overlayColor,
              opacity: overlayOpacity,
            }}
          />
        )}

        {/* Content */}
        <div
          className={`relative z-10 h-full flex flex-col ${getTextAlignClass()} ${getVerticalAlignClass()} px-4 sm:px-6 lg:px-8`}
          style={{
            textAlign: textAlign,
            color: props?.textColor || '#ffffff',
          }}
        >
          <div
            className="max-w-4xl w-full"
            style={{
              padding: props?.contentPadding || '2rem',
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </>
  );
}

