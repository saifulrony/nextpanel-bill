'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Slide {
  id: string;
  image: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}

interface SliderComponentProps {
  slides: Slide[];
  autoplay?: boolean;
  autoplayInterval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  height?: string;
  heightMobile?: string;
  heightTablet?: string;
  transition?: 'slide' | 'fade';
  animationSpeed?: number;
  style?: React.CSSProperties;
  props?: Record<string, any>;
}

export default function SliderComponent({
  slides,
  autoplay = true,
  autoplayInterval = 5000,
  showArrows = true,
  showDots = true,
  height = '600px',
  heightMobile = '400px',
  heightTablet = '500px',
  transition = 'slide',
  animationSpeed = 500,
  style,
  props,
}: SliderComponentProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoplay && slides.length > 1) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, autoplayInterval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoplay, autoplayInterval, currentSlide, slides.length]);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), animationSpeed);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), animationSpeed);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), animationSpeed);
  };

  const pauseAutoplay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resumeAutoplay = () => {
    if (autoplay && slides.length > 1) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, autoplayInterval);
    }
  };

  if (!slides || slides.length === 0) {
    return (
      <div className="w-full bg-gray-200 flex items-center justify-center" style={{ height, ...style }}>
        <p className="text-gray-500">No slides available</p>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .slider-container {
          height: ${height};
        }
        @media (max-width: 768px) {
          .slider-container {
            height: ${heightMobile} !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .slider-container {
            height: ${heightTablet} !important;
          }
        }
      `}</style>
      <div
        ref={sliderRef}
        className="slider-container relative w-full overflow-hidden"
        style={style}
        onMouseEnter={pauseAutoplay}
        onMouseLeave={resumeAutoplay}
      >
        <div
          className="flex transition-all ease-in-out"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
            transitionDuration: `${animationSpeed}ms`,
            width: `${slides.length * 100}%`,
            height: '100%',
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id || index}
              className="relative w-full h-full flex-shrink-0"
              style={{
                width: `${100 / slides.length}%`,
                ...(slide.image ? {
                  backgroundImage: `url(${slide.image})`,
                  backgroundSize: props?.backgroundSize || 'cover',
                  backgroundPosition: props?.backgroundPosition || 'center',
                  backgroundRepeat: 'no-repeat',
                } : {
                  backgroundColor: '#e5e7eb',
                }),
              }}
            >
              {/* Overlay */}
              {slide.overlay !== false && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: props?.overlayColor || 'rgba(0, 0, 0, 0.5)',
                    opacity: slide.overlayOpacity || props?.overlayOpacity || 0.5,
                  }}
                />
              )}

              {/* Content */}
              <div
                className="relative z-10 h-full flex flex-col items-center justify-center text-white px-4 sm:px-6 lg:px-8"
                style={{
                  textAlign: props?.textAlign || 'center',
                  padding: props?.contentPadding || '2rem',
                }}
              >
                {slide.title && (
                  <h2
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
                    style={{
                      color: props?.titleColor || '#ffffff',
                      fontFamily: props?.titleFontFamily || 'inherit',
                      textShadow: props?.titleShadow || '2px 2px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    {slide.title}
                  </h2>
                )}
                {slide.description && (
                  <p
                    className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 max-w-3xl"
                    style={{
                      color: props?.descriptionColor || '#ffffff',
                      fontFamily: props?.descriptionFontFamily || 'inherit',
                      textShadow: props?.descriptionShadow || '1px 1px 2px rgba(0,0,0,0.3)',
                    }}
                  >
                    {slide.description}
                  </p>
                )}
                {slide.buttonText && (
                  <a
                    href={slide.buttonLink || '#'}
                    className="inline-block px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    style={{
                      backgroundColor: props?.buttonBackgroundColor || '#ffffff',
                      color: props?.buttonTextColor || '#000000',
                      borderRadius: props?.buttonBorderRadius || '0.5rem',
                      padding: props?.buttonPadding || '0.75rem 1.5rem',
                      fontSize: props?.buttonFontSize || '1rem',
                    }}
                    onClick={(e) => {
                      if (slide.buttonLink === '#') {
                        e.preventDefault();
                      }
                    }}
                  >
                    {slide.buttonText}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {showArrows && slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 sm:p-3 shadow-lg transition-all"
              aria-label="Previous slide"
              style={{
                opacity: props?.arrowOpacity || 0.9,
              }}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 sm:p-3 shadow-lg transition-all"
              aria-label="Next slide"
              style={{
                opacity: props?.arrowOpacity || 0.9,
              }}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {showDots && slides.length > 1 && (
          <div
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2"
            style={{
              bottom: props?.dotsPosition || '1rem',
            }}
          >
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-white w-8 h-3'
                    : 'bg-white/50 w-3 h-3 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
                style={{
                  backgroundColor: index === currentSlide
                    ? (props?.activeDotColor || '#ffffff')
                    : (props?.inactiveDotColor || 'rgba(255, 255, 255, 0.5)'),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

