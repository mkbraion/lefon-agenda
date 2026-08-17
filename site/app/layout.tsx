import type { Metadata, Viewport } from 'next';
import { Fraunces, Karla } from 'next/font/google';
import './globals.css';

const karla = Karla({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lefon Agenda — a agenda inteligente do corretor',
  description:
    'Agende visitas em segundos, acompanhe sua equipe em tempo real e nunca mais perca uma venda por esquecimento.',
  openGraph: {
    title: 'Lefon Agenda — a agenda inteligente do corretor',
    description:
      'Agende visitas em segundos, acompanhe sua equipe em tempo real e nunca mais perca uma venda por esquecimento.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export const viewport: Viewport = {
  themeColor: '#100D0B',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${karla.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
