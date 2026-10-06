import { codigoServiceWorker } from '@/lib/pwa/codigo-sw'

// Variáveis de sistema da Vercel (não são segredos): mudam a cada deploy.
const VERSAO = process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev'

export function GET() {
  return new Response(codigoServiceWorker(VERSAO), {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  })
}
