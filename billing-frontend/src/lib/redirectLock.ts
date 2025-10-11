// Global lock to prevent simultaneous redirects
let isRedirecting = false;
let redirectTimer: NodeJS.Timeout | null = null;

export const setRedirecting = (value: boolean) => {
  isRedirecting = value;
  
  // Auto-clear after 2 seconds to prevent getting stuck
  if (value && redirectTimer) {
    clearTimeout(redirectTimer);
  }
  
  if (value) {
    redirectTimer = setTimeout(() => {
      isRedirecting = false;
    }, 2000);
  }
};

export const isCurrentlyRedirecting = () => isRedirecting;

