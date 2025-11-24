import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { DefaultPageProvider } from '@/contexts/DefaultPageContext'
import { StripeProvider } from '@/contexts/StripeContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export const metadata: Metadata = {
  title: 'NextPanel Billing - License Management',
  description: 'Purchase and manage your NextPanel hosting licenses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <ThemeProvider>
        <NotificationProvider>
          <AuthProvider> 
            <CartProvider>
              <DefaultPageProvider>
                <StripeProvider>
                  {children}
                  <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                  />
                </StripeProvider>
              </DefaultPageProvider>
            </CartProvider>
          </AuthProvider>
        </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

