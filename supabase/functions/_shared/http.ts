const allowedOrigins = new Set([
  'http://localhost:3000',
  'https://tournament-x-vfinal.vercel.app',
]);

export function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'http://localhost:3000',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export function jsonResponse(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
  });
}

export function safeReturnOrigin(request: Request) {
  const origin = request.headers.get('origin') || '';
  return allowedOrigins.has(origin) ? origin : 'http://localhost:3000';
}
