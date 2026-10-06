import { ImageResponse } from 'next/og'

/**
 * Ícones do PWA gerados no servidor (provisórios, com a inicial "P" nas cores Perfin).
 * Quando o logo oficial for fornecido, substitua por arquivos PNG em /public/icones.
 */
const TAMANHOS: Record<string, { lado: number; margem: number }> = {
  '180': { lado: 180, margem: 0 },
  '192': { lado: 192, margem: 0 },
  '512': { lado: 512, margem: 0 },
  '512-maskable': { lado: 512, margem: 80 },
}

export function generateStaticParams() {
  return Object.keys(TAMANHOS).map((tamanho) => ({ tamanho }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ tamanho: string }> }) {
  const config = TAMANHOS[(await params).tamanho]
  if (!config) return new Response('Não encontrado', { status: 404 })
  const { lado, margem } = config
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#221f20', padding: margem }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f9f4f4',
            fontSize: (lado - margem * 2) * 0.62,
            fontWeight: 900,
            borderBottom: `${Math.round(lado * 0.05)}px solid #4cac87`,
          }}
        >
          P
        </div>
      </div>
    ),
    { width: lado, height: lado },
  )
}
