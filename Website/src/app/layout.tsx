import type { Metadata, Viewport } from 'next'
import './globals.css'

const urlSite = process.env.NEXT_PUBLIC_SITE_URL

export const metadata: Metadata = {
  metadataBase: urlSite ? new URL(urlSite) : undefined,
  title: { default: 'Perfin · Termômetro da economia', template: '%s · Perfin' },
  description: 'Perfin: gestão de ativos e o termômetro da economia brasileira, com IPCA, Selic, CDI, dólar e IGP-M atualizados.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Perfin',
    title: 'Perfin · Termômetro da economia',
    description: 'Inflação, juros e câmbio do Brasil em um só lugar, com dados do Banco Central e do IBGE.',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9f4f4' },
    { media: '(prefers-color-scheme: dark)', color: '#221f20' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
