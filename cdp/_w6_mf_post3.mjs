// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const base = {
  sitenm: 'QR Code Generator - Free Online QR Code Maker',
  site: 'QR Code Generator - Free Online QR Code Maker',
  siteurl: 'https://qrcodegenerator.vip',
  url: 'https://qrcodegenerator.vip',
  pageurl: 'https://qrcodegenerator.vip',
  description: 'Free online QR code generator: create high-resolution QR codes for URLs, text, WiFi access and contact cards with custom colors and instant PNG download. No signup required.',
  cat1: '/computers/', cat2: '', cat3: '', seluri: '', load: '', act: 'send',
  siteml: 'mf.qr@92ng.com', phone: '', address: '', ext: '',
  name: 'Leo Xm', email: 'mf.qr@92ng.com', mess: '',
  privacy: 'on', review: '', submit: 'Submit',
};
const res = await fetch('https://morefunz.com/submit-url', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://morefunz.com/submit-url' }, body: new URLSearchParams(base).toString() });
const html = await res.text();
console.log('HTTP', res.status, 'len', html.length);
const text = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
for (const kw of [/thank/i, /submitted/i, /success/i, /added/i, /received/i, /error[^s]/i, /invalid/i, /required/i, /already/i, /will be/i, /moderat/i, /queue/i]) {
  const mm = text.match(new RegExp('.{50}' + kw.source + '.{110}', 'i'));
  if (mm) console.log('KW', kw.source, '→', mm[0].trim());
}
