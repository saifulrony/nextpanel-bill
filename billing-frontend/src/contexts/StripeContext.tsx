'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { paymentGatewaysAPI } from '@/lib/api';

interface StripeContextType {
  stripe: Stripe | null;
  stripePromise: Promise<Stripe | null>;
  isLoading: boolean;
  isConfigured: boolean;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  
  // Fetch Stripe configuration from backend
  useEffect(() => {
    const fetchStripeConfig = async () => {
      try {
        setIsLoading(true);
        const response = await paymentGatewaysAPI.getStripeConfig();
        const config = response.data;
        
        setPublishableKey(config.publishable_key);
        setIsConfigured(config.is_configured);
      } catch (error) {
        console.error('Failed to fetch Stripe configuration:', error);
        setPublishableKey(null);
        setIsConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStripeConfig();
  }, []);
  
  // Memoize stripePromise to prevent infinite re-renders
  const stripePromise = useMemo(() => {
    if (!publishableKey || !publishableKey.startsWith('pk_')) {
      return Promise.resolve(null);
    }
    
    // Check if this is a dummy/invalid test key that won't work
    if (publishableKey.includes('51234567890abcdef') || publishableKey === 'pk_test_dummy') {
      console.warn('Using dummy Stripe key - Stripe will not work properly');
      return Promise.resolve(null);
    }
    
    return loadStripe(publishableKey);
  }, [publishableKey]);

  useEffect(() => {
    if (publishableKey && publishableKey.startsWith('pk_')) {
      // Only try to load Stripe if we have a valid key
      stripePromise.then((stripe) => {
        setStripe(stripe);
      });
    } else {
      // No valid key, immediately set stripe to null
      setStripe(null);
    }
  }, [publishableKey, stripePromise]);

  const value = {
    stripe,
    stripePromise,
    isLoading,
    isConfigured
  };

  return (
    <StripeContext.Provider value={value}>
      {children}
    </StripeContext.Provider>
  );
}

export function useStripe() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
}
