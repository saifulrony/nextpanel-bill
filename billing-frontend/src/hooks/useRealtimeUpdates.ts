import { useEffect, useCallback, useRef, useState } from 'react';

interface RealtimeEvent {
  type: string;
  data?: any;
  timestamp?: number;
  message?: string;
}

interface UseRealtimeUpdatesOptions {
  onOrderCreated?: () => void;
  onOrderUpdated?: () => void;
  onPaymentReceived?: () => void;
  onDataChange?: () => void;
  enabled?: boolean;
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions) {
  const {
    onOrderCreated,
    onOrderUpdated,
    onPaymentReceived,
    onDataChange,
    enabled = true,
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') {
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('No access token available for real-time connection');
      setIsConnected(false);
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Determine API URL
    const getApiUrl = () => {
      if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
      }
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        return `http://${hostname}:8001`;
      }
      return 'http://localhost:8001';
    };

    // Create new EventSource connection
    const apiUrl = getApiUrl();
    const eventSource = new EventSource(
      `${apiUrl}/api/v1/events/stream?token=${token}`
    );

    eventSource.onopen = () => {
      console.log('✅ Real-time connection established');
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: RealtimeEvent = JSON.parse(event.data);
        
        console.log('📨 Real-time event received:', data.type);

        switch (data.type) {
          case 'connected':
            console.log('🔗 Connected to real-time updates');
            setIsConnected(true);
            break;

          case 'order_created':
            console.log('🆕 New order created!');
            onOrderCreated?.();
            onDataChange?.();
            break;

          case 'order_updated':
            console.log('📝 Order updated');
            onOrderUpdated?.();
            onDataChange?.();
            break;

          case 'payment_received':
            console.log('💰 Payment received!');
            onPaymentReceived?.();
            onDataChange?.();
            break;

          case 'heartbeat':
            // Silent heartbeat to keep connection alive
            setIsConnected(true);
            break;

          default:
            console.log('📬 Unknown event:', data.type);
        }
      } catch (error) {
        console.error('Error parsing real-time event:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ Real-time connection error:', error);
      setIsConnected(false);
      eventSource.close();

      // Attempt to reconnect after 5 seconds
      if (enabled) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          connect();
        }, 5000);
      }
    };

    eventSourceRef.current = eventSource;
  }, [enabled, onOrderCreated, onOrderUpdated, onPaymentReceived, onDataChange]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('🔌 Disconnecting from real-time updates');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [enabled]); // Only re-run when enabled changes

  return {
    connect,
    disconnect,
    isConnected,
  };
}

