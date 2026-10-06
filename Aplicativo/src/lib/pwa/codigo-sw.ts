/**
 * Código do service worker do PWA. É servido por /sw.js com a versão do deploy embutida,
 * para que cada publicação na Vercel gere o aviso "Nova versão disponível".
 *
 * Estratégias:
 *  - estáticos (/_next/static, ícones, manifesto): cache-first;
 *  - páginas de dados (painéis): rede primeiro, cache se estiver offline (máx. 30 páginas);
 *  - login, APIs, relatórios, agenda, assistente e admin: somente rede (nunca vão para o cache);
 *  - o cache de páginas é apagado ao sair (POST /auth/sair) e sempre que a sessão acaba
 *    (navegação para /login ou /acesso-negado), para não mostrar dados de outro usuário.
 */
const MODELO = String.raw`
const VERSAO = '__VERSAO__';
const CACHE_ESTATICOS = 'perfin-estaticos-' + VERSAO;
const CACHE_PAGINAS = 'perfin-paginas';
const PAGINA_OFFLINE = '/offline';

const PAGINAS_COM_CACHE = ['/', '/paineis', '/inflacao', '/juros', '/cambio', '/atividade', '/expectativas'];
const PAGINAS_SEM_SESSAO = ['/login', '/acesso-negado'];
const MAXIMO_PAGINAS = 30;

function estrategiaPara(url, metodo, ehNavegacao) {
  if (metodo !== 'GET') return 'rede';
  if (url.origin !== self.location.origin) return 'rede';
  const caminho = url.pathname;
  if (caminho.startsWith('/_next/static/') || caminho.startsWith('/icones/') || caminho === '/manifest.webmanifest') {
    return 'cache-primeiro';
  }
  if (url.searchParams.has('_rsc')) return 'rede';
  if (ehNavegacao && PAGINAS_COM_CACHE.includes(caminho)) return 'rede-primeiro';
  if (ehNavegacao) return 'rede-com-pagina-offline';
  return 'rede';
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE_ESTATICOS).then((cache) => cache.add(PAGINA_OFFLINE)));
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n.startsWith('perfin-estaticos-') && n !== CACHE_ESTATICOS).map((n) => caches.delete(n))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (evento) => {
  if (evento.data && evento.data.tipo === 'ATIVAR_NOVA_VERSAO') self.skipWaiting();
});

function podeGuardar(resposta) {
  return resposta && resposta.ok && !resposta.redirected && resposta.type === 'basic';
}

async function cachePrimeiro(requisicao) {
  const guardada = await caches.match(requisicao);
  if (guardada) return guardada;
  const resposta = await fetch(requisicao);
  if (podeGuardar(resposta)) (await caches.open(CACHE_ESTATICOS)).put(requisicao, resposta.clone());
  return resposta;
}

function semSessao(resposta) {
  return PAGINAS_SEM_SESSAO.includes(new URL(resposta.url).pathname);
}

async function guardarPagina(requisicao, resposta) {
  const cache = await caches.open(CACHE_PAGINAS);
  await cache.put(requisicao, resposta);
  const chaves = await cache.keys();
  await Promise.all(chaves.slice(0, Math.max(0, chaves.length - MAXIMO_PAGINAS)).map((k) => cache.delete(k)));
}

async function redePrimeiro(requisicao) {
  try {
    const resposta = await fetch(requisicao);
    if (resposta.redirected && semSessao(resposta)) await caches.delete(CACHE_PAGINAS);
    else if (podeGuardar(resposta)) await guardarPagina(requisicao, resposta.clone());
    return resposta;
  } catch (erro) {
    return (await caches.match(requisicao)) || (await caches.match(PAGINA_OFFLINE));
  }
}

async function redeComPaginaOffline(requisicao) {
  try {
    const resposta = await fetch(requisicao);
    if (semSessao(resposta)) await caches.delete(CACHE_PAGINAS);
    return resposta;
  } catch (erro) {
    return caches.match(PAGINA_OFFLINE);
  }
}

self.addEventListener('fetch', (evento) => {
  const requisicao = evento.request;
  const url = new URL(requisicao.url);
  if (requisicao.method === 'POST' && url.pathname === '/auth/sair') {
    evento.respondWith(caches.delete(CACHE_PAGINAS).then(() => fetch(requisicao)));
    return;
  }
  const estrategia = estrategiaPara(url, requisicao.method, requisicao.mode === 'navigate');
  if (estrategia === 'cache-primeiro') evento.respondWith(cachePrimeiro(requisicao));
  else if (estrategia === 'rede-primeiro') evento.respondWith(redePrimeiro(requisicao));
  else if (estrategia === 'rede-com-pagina-offline') evento.respondWith(redeComPaginaOffline(requisicao));
});
`

export function codigoServiceWorker(versao: string): string {
  return MODELO.replace('__VERSAO__', versao.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64) || 'dev')
}
