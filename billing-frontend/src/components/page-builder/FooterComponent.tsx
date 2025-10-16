'use client';

import React from 'react';

interface FooterComponentProps {
  style?: React.CSSProperties;
  className?: string;
  isEditor?: boolean;
  props?: {
    backgroundColor?: string;
    textColor?: string;
    linkColor?: string;
    companyName?: string;
    copyrightText?: string;
    showLinks?: boolean;
    links?: Array<{
      label: string;
      href: string;
    }>;
    showSocial?: boolean;
    socialLinks?: Array<{
      platform: string;
      href: string;
      icon?: string;
    }>;
  };
}

export default function FooterComponent({ 
  style = {}, 
  className = '',
  isEditor = false,
  props = {}
}: FooterComponentProps) {
  const {
    backgroundColor = '#111827',
    textColor = '#ffffff',
    linkColor = '#9ca3af',
    companyName = 'NextPanel Billing',
    copyrightText = 'All rights reserved.',
    showLinks = true,
    links = [
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Support', href: '/support' },
    ],
    showSocial = false,
    socialLinks = [
      { platform: 'Twitter', href: '#', icon: '🐦' },
      { platform: 'Facebook', href: '#', icon: '📘' },
      { platform: 'LinkedIn', href: '#', icon: '💼' },
    ],
  } = props;

  return (
    <footer 
      className={`mt-24 ${className}`}
      style={{
        backgroundColor,
        color: textColor,
        ...style
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-gray-400">
            &copy; 2025 {companyName}. {copyrightText}
          </p>
          {showLinks && (
            <div className="mt-4 space-x-6">
              {links.map((link) => (
                isEditor ? (
                  <span 
                    key={link.label}
                    className="cursor-default"
                    style={{ color: linkColor }}
                  >
                    {link.label}
                  </span>
                ) : (
                  <a 
                    key={link.label}
                    href={link.href} 
                    className="hover:text-white transition"
                    style={{ color: linkColor }}
                  >
                    {link.label}
                  </a>
                )
              ))}
            </div>
          )}
          {showSocial && (
            <div className="mt-4 flex justify-center space-x-4">
              {socialLinks.map((social) => (
                isEditor ? (
                  <span
                    key={social.platform}
                    className="cursor-default"
                    style={{ color: linkColor }}
                    title={social.platform}
                  >
                    <span className="text-xl">{social.icon}</span>
                  </span>
                ) : (
                  <a
                    key={social.platform}
                    href={social.href}
                    className="hover:opacity-80 transition"
                    style={{ color: linkColor }}
                    title={social.platform}
                  >
                    <span className="text-xl">{social.icon}</span>
                  </a>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
