
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-provider';
import { ThemeProvider } from '@/context/theme-provider';
import Snowfall from '@/components/snowfall';

export const metadata: Metadata = {
  metadataBase: new URL('https://bigcosta.lk'), // Replace with your actual domain
  title: {
    default: 'Big Costa Construction - Construction, Home Solutions & Tech',
    template: `%s | Big Costa Construction`,
  },
  description: 'Big Costa Construction is a leading conglomerate in Sri Lanka, specializing in construction, custom home solutions like pantry cupboards, and retail of computer parts and electronics.',
  keywords: 'construction companies in Sri Lanka, pantry cupboards sri lanka, computer parts sri lanka, electronics store colombo, best construction company in Sri Lanka, house construction Sri Lanka, building contractors Sri Lanka, kitchen design sri lanka, custom furniture, pc components, gaming pc sri lanka, Big Costa Construction, Big Costa Homes, Big Costa Tech',
  openGraph: {
    title: 'Big Costa Construction (Private) Limited',
    description: 'Leading services in construction, home solutions, and tech retail in Sri Lanka.',
    url: 'https://bigcosta.lk', // Replace with your actual domain
    siteName: 'Big Costa Construction (Private) Limited',
    images: [
      {
        url: '/logobc.png', // Path to your logo
        width: 800,
        height: 600,
        alt: 'Big Costa Construction Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Big Costa Construction (Private) Limited',
    description: 'Quality construction, home, and tech solutions in Sri Lanka.',
    images: ['/logobc.png'], // Path to your logo
  },
  icons: {
    icon: '/logobc.png',
    shortcut: '/logobc.png',
    apple: '/logobc.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const showHolidayFeatures = new Date() < new Date('2026-01-01');

  return (
    <html lang="en" className="!scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="default"
          enableSystem={false}
          storageKey="bigcosta-theme"
        >
          <AuthProvider>
            {showHolidayFeatures && <Snowfall />}
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
