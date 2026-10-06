import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { converterEvento } from './eventos'
import { montarMensagemMime } from './mime'

describe('mensagem MIME do rascunho', () => {
  const mime = montarMensagemMime(
    {
      assunto: 'Relatório de indicadores — 09/2026',
      corpo: 'Olá, segue o relatório.',
      anexo: { nome: 'relatorio.xlsx', tipo: 'application/vnd.ms-excel', conteudo: new Uint8Array([1, 2, 3]) },
    },
    'fronteira-teste',
  )

  it('codifica o assunto com acentos e anexa o arquivo', () => {
    expect(mime).toContain(`Subject: =?UTF-8?B?${Buffer.from('Relatório de indicadores — 09/2026').toString('base64')}?=`)
    expect(mime).toContain('Content-Disposition: attachment; filename="relatorio.xlsx"')
    expect(mime).toContain(Buffer.from([1, 2, 3]).toString('base64'))
    expect(mime.trimEnd().endsWith('--fronteira-teste--')).toBe(true)
  })

  it('não tem destinatário: o rascunho é revisado e enviado pelo próprio usuário', () => {
    expect(mime).not.toMatch(/^(To|Cc|Bcc):/m)
  })

  it('impede injeção de cabeçalhos pelo assunto', () => {
    const malicioso = montarMensagemMime({
      assunto: 'Oi\r\nBcc: alguem@exemplo.com',
      corpo: 'x',
      anexo: { nome: 'a.xlsx', tipo: 'x/y', conteudo: new Uint8Array() },
    })
    expect(malicioso).not.toMatch(/^Bcc:/m)
  })
})

describe('garantia: o portal nunca envia e-mails', () => {
  it('nenhum código chama os endpoints de envio do Gmail', () => {
    const raiz = join(__dirname, '..', '..')
    const arquivos = listarArquivos(raiz).filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith('.test.ts'))
    const proibidos = /messages\/send|drafts\/send|\.send\(\s*\{\s*userId/
    const ofensores = arquivos.filter((f) => proibidos.test(readFileSync(f, 'utf8')))
    expect(ofensores).toEqual([])
  })
})

describe('eventos da agenda', () => {
  it('converte evento com horário e link do Meet', () => {
    const r = converterEvento({
      id: '1',
      summary: ' Comitê de investimentos ',
      start: { dateTime: '2026-10-07T10:00:00-03:00' },
      end: { dateTime: '2026-10-07T11:00:00-03:00' },
      conferenceData: { entryPoints: [{ entryPointType: 'video', uri: 'https://meet.google.com/abc' }] },
      htmlLink: 'https://calendar.google.com/x',
    })
    expect(r).toMatchObject({ titulo: 'Comitê de investimentos', diaInteiro: false, linkVideo: 'https://meet.google.com/abc' })
  })

  it('dia inteiro, sem título e link não-https descartado', () => {
    const r = converterEvento({ id: '2', start: { date: '2026-10-08' }, end: { date: '2026-10-09' }, htmlLink: 'javascript:alert(1)' })
    expect(r).toMatchObject({ titulo: '(sem título)', diaInteiro: true, inicio: '2026-10-08', linkEvento: null })
  })
})

function listarArquivos(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listarArquivos(join(pasta, e.name)) : [join(pasta, e.name)],
  )
}
