// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { readFileSync } from 'fs';
const jar = readFileSync('D:/Github/seoadminC/storage/_w6_saas_jar.txt', 'utf8').trim();
const html = readFileSync('D:/Github/seoadminC/storage/_w6_saas_submit.html', 'utf8');
const token = html.match(/name="csrfmiddlewaretoken" value="([^"]+)"/)?.[1];
if (!token) { console.log('no token'); process.exit(1); }
const body = new URLSearchParams({
  csrfmiddlewaretoken: token,
  website_url: 'https://qrcodegenerator.vip',
  name: 'QR Code Generator',
  tagline: 'Free online QR code maker with custom colors and PNG download',
  description: 'Create high-resolution QR codes for URLs, text, WiFi access and contact cards directly in the browser. Custom colors and logo embedding, instant PNG download, no signup required, no watermark on downloads.',
  categories: '14', categories2: '', email: 'saas.qr@92ng.com', tier: 'free',
});
// 多值categories: 手工拼
const bodyStr = new URLSearchParams({
  csrfmiddlewaretoken: token,
  website_url: 'https://qrcodegenerator.vip',
  name: 'QR Code Generator',
  tagline: 'Free online QR code maker with custom colors and PNG download',
  description: 'Create high-resolution QR codes for URLs, text, WiFi access and contact cards directly in the browser. Custom colors and logo embedding, instant PNG download, no signup required, no watermark on downloads.',
  email: 'saas.qr@92ng.com',
  tier: 'free',
}).toString() + '&categories=14&categories=27';
const res = await fetch('https://thesaasdir.com/submit/', { method: 'POST', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36', 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://thesaasdir.com/submit/', Origin: 'https://thesaasdir.com', Cookie: jar }, body: bodyStr, redirect: 'follow' });
const h = await res.text();
console.log('HTTP', res.status, 'len', h.length, 'final', res.url.slice(0,70));
const text = h.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
for (const kw of [/thank/i, /submitted/i, /success/i, /received/i, /review/i, /approve/i, /live/i, /error/i, /invalid/i, /already/i]) {
  const mm = text.match(new RegExp('.{40}' + kw.source + '.{100}', 'i'));
  if (mm) console.log('KW', kw.source, '→', mm[0].trim());
}
console.log('HEAD:', text.slice(0, 300));
