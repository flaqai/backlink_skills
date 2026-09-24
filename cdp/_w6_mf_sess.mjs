// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9' };
// 1. GET 落 session
const r1 = await fetch('https://morefunz.com/submit-url', { headers: H });
const cookies = (r1.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ');
const html1 = await r1.text();
console.log('GET cookies:', cookies || '(none)');
// 从页面JS再确认load公式
const m = html1.match(/var get = ([^;]+);/);
console.log('load formula:', m ? m[1] : '?');
// 2. 同session POST
const loadVal = String(Math.random() * 2.9 + 9.05);
const body = new URLSearchParams({
  sitenm: 'QR Code Generator - Free Online QR Code Maker',
  siteurl: 'https://qrcodegenerator.vip/',
  description: 'Free online QR code generator: create high-resolution QR codes for URLs, text, WiFi access and contact cards with custom colors and instant PNG download. No signup required.',
  cat1: '/computers/', seluri: '/computers/', act: 'send', load: loadVal,
  siteml: 'mf.qr@92ng.com', name: 'Leo Xm', email: 'mf.qr@92ng.com',
  privacy: 'on', submit: 'Submit',
});
const res = await fetch('https://morefunz.com/submit-url', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://morefunz.com/submit-url', ...(cookies ? { Cookie: cookies } : {}) }, body: body.toString() });
const html = await res.text();
console.log('POST HTTP', res.status, 'len', html.length);
const text = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
for (const kw of [/thank/i, /submitted/i, /success/i, /added/i, /already/i, /error[^s]/i, /required/i, /invalid/i]) {
  const mm = text.match(new RegExp('.{40}' + kw.source + '.{100}', 'i'));
  if (mm) console.log('KW', kw.source, '→', mm[0].trim());
}
