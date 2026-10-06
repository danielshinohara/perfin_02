import 'server-only'
import { GoogleGenAI } from '@google/genai'
import { envServidor } from '@/lib/env'
import { INSTRUCAO_SISTEMA } from './contexto'

/** Modelo do Gemini usado pelo assistente. Atualize aqui quando o Google descontinuar a versão. */
const MODELO = 'gemini-2.5-flash'

let cliente: GoogleGenAI | null = null
function obterCliente(): GoogleGenAI {
  cliente ??= new GoogleGenAI({ apiKey: envServidor().GEMINI_API_KEY })
  return cliente
}

export class AssistenteIndisponivelError extends Error {}

export async function responderPergunta(pergunta: string, contexto: string): Promise<string> {
  try {
    const resposta = await obterCliente().models.generateContent({
      model: MODELO,
      contents: [{ role: 'user', parts: [{ text: `CONTEXTO:\n${contexto}\n\nPERGUNTA:\n${pergunta}` }] }],
      config: { systemInstruction: INSTRUCAO_SISTEMA, temperature: 0.2, maxOutputTokens: 1024 },
    })
    const texto = resposta.text?.trim()
    if (!texto) throw new AssistenteIndisponivelError('O assistente não retornou resposta.')
    return texto
  } catch (erro) {
    if (erro instanceof AssistenteIndisponivelError) throw erro
    // Não repassa a mensagem original (pode conter detalhes da chave ou da requisição).
    throw new AssistenteIndisponivelError('O assistente está indisponível no momento. Tente novamente.')
  }
}
