export interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
}

interface LinkPreview {
  image: string
  title: string
  price: string
  siteName: string
}

function extractMeta(html: string, attr: 'property' | 'name', key: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${key}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) return m[1]
  }
  return ''
}

function parsePreview(html: string): LinkPreview {
  const titleTagMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return {
    image: extractMeta(html, 'property', 'og:image'),
    title: extractMeta(html, 'property', 'og:title') || (titleTagMatch ? titleTagMatch[1].trim() : ''),
    price: extractMeta(html, 'property', 'product:price:amount') || extractMeta(html, 'property', 'og:price:amount'),
    siteName: extractMeta(html, 'property', 'og:site_name'),
  }
}

async function handlePreview(request: Request): Promise<Response> {
  const target = new URL(request.url).searchParams.get('url')
  const jsonHeaders = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' }

  if (!target) {
    return new Response(JSON.stringify({ error: 'url 파라미터 필요' }), { status: 400, headers: jsonHeaders })
  }

  let targetUrl: URL
  try {
    targetUrl = new URL(target)
  } catch {
    return new Response(JSON.stringify({ error: '유효하지 않은 URL' }), { status: 400, headers: jsonHeaders })
  }
  if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
    return new Response(JSON.stringify({ error: '허용되지 않는 프로토콜' }), { status: 400, headers: jsonHeaders })
  }

  try {
    const res = await fetch(targetUrl.toString(), {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; FitLogPreviewBot/1.0)',
        accept: 'text/html',
      },
      redirect: 'follow',
    })
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `상품 페이지 응답 실패 (${res.status})` }), {
        status: 502,
        headers: jsonHeaders,
      })
    }
    const html = await res.text()
    const preview = parsePreview(html)
    return new Response(JSON.stringify(preview), { headers: jsonHeaders })
  } catch {
    return new Response(JSON.stringify({ error: '페이지를 가져오지 못함' }), { status: 502, headers: jsonHeaders })
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/api/preview') {
      return handlePreview(request)
    }
    return env.ASSETS.fetch(request)
  },
}
