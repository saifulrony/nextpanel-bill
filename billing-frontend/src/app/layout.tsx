import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { DefaultPageProvider } from '@/contexts/DefaultPageContext'
import { StripeProvider } from '@/contexts/StripeContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
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
      </body>
    </html>
  )
}

