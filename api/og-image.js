export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Wedding Prop Bets';
  const players = searchParams.get('players') || '';

  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2e1065"/>
          <stop offset="50%" stop-color="#4c1d95"/>
          <stop offset="100%" stop-color="#5b21b6"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <text x="600" y="200" text-anchor="middle" font-size="120" font-family="sans-serif">🎲</text>
      <text x="600" y="320" text-anchor="middle" font-size="48" font-weight="800" fill="white" font-family="Inter, sans-serif">${escapeXml(title)}</text>
      <text x="600" y="380" text-anchor="middle" font-size="24" fill="#a78bfa" font-family="Inter, sans-serif">Wedding Prop Bets</text>
      ${players ? `<text x="600" y="430" text-anchor="middle" font-size="20" fill="#c4b5fd" font-family="Inter, sans-serif">${escapeXml(players)} players</text>` : ''}
      <text x="600" y="580" text-anchor="middle" font-size="16" fill="#6d28d9" font-family="Inter, sans-serif">weddingpropbets.com</text>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
