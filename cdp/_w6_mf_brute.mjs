// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const U = 'https://qrcodegenerator.vip/';
const body = new URLSearchParams({
  sitenm: 'QR Code Generator - Free Online QR Code Maker',
  surl: U, uri: U, website: U, weburl: U, webpage: U, link: U, href: U,
  homepage: U, adress: U, site_url: U, page_url: U, u: U,
  siteurl: U,
  description: 'Free online QR code generator: create high-resolution QR codes for URLs, text, WiFi access and contact cards with custom colors and instant PNG download. No signup required.',
  cat1: '/computers/', seluri: '/computers/', act: 'send', load: String(Math.random() * 8.9 + 3.05),
  siteml: 'mf.qr@92ng.com', name: 'Leo Xm', email: 'mf.qr@92ng.com', mess: '',
  privacy: 'on', submit: 'Submit',
});
const res = await fetch('https://morefunz.com/submit-url', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://morefunz.com/submit-url' }, body: body.toString() });
const html = await res.text();
console.log('HTTP', res.status, 'len', html.length);
const text = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
for (const kw of [/thank/i, /submitted/i, /success/i, /added/i, /already/i, /error[^s]/i, /required/i, /invalid/i, /moderat/i]) {
  const mm = text.match(new RegExp('.{40}' + kw.source + '.{100}', 'i'));
  if (mm) console.log('KW', kw.source, '→', mm[0].trim());
}
