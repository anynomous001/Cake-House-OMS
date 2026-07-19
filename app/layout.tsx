import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Outfit, Inter } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kamai — Stop Chasing Payments. Start Tracking Your Kamai.',
  description: 'The all-in-one operating system and digital escrow for India’s independent creators, home bakers, and local merchants.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kamai',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1E3A8A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${outfit.variable} ${inter.variable}`}>
      <body className="font-sans antialiased text-gray-900 bg-[#FBFBFA]">{children}</body>
    </html>
  );
}
