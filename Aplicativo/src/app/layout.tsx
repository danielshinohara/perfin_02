import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Portal Perfin', template: '%s · Portal Perfin' },
  description: 'Central de análise econômica da Perfin: indicadores, insights e relatórios.',
  applicationName: 'Portal Perfin',
  appleWebApp: { capable: true, title: 'Portal Perfin', statusBarStyle: 'default' },
  icons: { icon: '/icones/192', apple: '/icones/180' },
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9f4f4' },
    { media: '(prefers-color-scheme: dark)', color: '#221f20' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
