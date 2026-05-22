import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

const siteUrl = "https://travel-insurance-dashboard.onrender.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Compara Travel Insurance Dashboard',
  description: 'Dashboard para comparar y revisar coberturas, exclusiones y upgrades de seguros de viaje.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Compara Travel Insurance Dashboard',
    description: 'Compara coberturas, exclusiones y upgrades de seguros de viaje.',
    url: '/',
    siteName: 'Compara Travel Insurance Dashboard',
    locale: 'es_PE',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Compara Travel Insurance Dashboard',
    description: 'Compara coberturas, exclusiones y upgrades de seguros de viaje.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/icon-light-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geist.variable} ${geistMono.variable} bg-white`}>
      <body className="font-sans antialiased bg-white m-0 p-0">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
