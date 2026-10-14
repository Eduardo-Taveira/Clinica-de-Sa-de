// Cloudflare Pages Function: roteia /api/* para o backend público do Render.
// O navegador fala com o próprio domínio do site e mantém cookies HttpOnly de primeira parte.
// Configure API_ORIGIN nas variáveis de ambiente do Cloudflare Pages, por exemplo:
// https://vida-clinica-api.onrender.com (sem caminho final).
export async function onRequest({ request, env }) {
  let origin;
  try {
    const configured = new URL(env.API_ORIGIN);
    if (
      configured.protocol !== 'https:' ||
      configured.pathname !== '/' ||
      configured.search ||
      configured.hash ||
      configured.username ||
      configured.password
    ) {
      throw new Error('API_ORIGIN inválida.');
    }
    origin = configured.origin;
  } catch {
    return Response.json(
      { error: 'API não configurada no Cloudflare Pages.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const incoming = new URL(request.url);
  const pathname = incoming.pathname.slice('/api'.length);
  if (!pathname.startsWith('/')) {
    return Response.json({ error: 'Rota não encontrada.' }, { status: 404 });
  }

  const upstreamUrl = origin + pathname + incoming.search;
  const upstreamRequest = new Request(upstreamUrl, request);
  upstreamRequest.headers.delete('host');

  try {
    const response = await fetch(upstreamRequest, { redirect: 'manual' });
    const safeResponse = new Response(response.body, response);
    // Não armazenar respostas da API, que podem incluir dados de pacientes.
    safeResponse.headers.set('Cache-Control', 'no-store');
    return safeResponse;
  } catch {
    return Response.json(
      { error: 'API temporariamente indisponível.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
