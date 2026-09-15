// morefunz.com 首投 t10 qrcodegenerator.vip
// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const body = new URLSearchParams({
  site: 'QR Code Generator - Free Online QR Code Maker',
  siteurl: 'https://qrcodegenerator.vip',
  description: 'Free online QR code generator: create high-resolution QR codes for URLs, text, WiFi access and contact cards with custom colors and instant PNG download. No signup required.',
  cat1: '/computers/',
  cat2: '', cat3: '', seluri: '', load: '', act: 'send',
  siteml: 'mf.qr@92ng.com',
  phone: '', address: '', ext: '',
  name: 'Leo Xm',
  email: 'mf.qr@92ng.com',
  mess: '',
  privacy: 'on',
  submit: 'Submit',
});
const res = await fetch('https://morefunz.com/submit-url', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://morefunz.com/submit-url' }, body: body.toString() });
const html = await res.text();
console.log('HTTP', res.status, 'len', html.length, 'final', res.url);
const text = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
// 成功/失败特征
for (const kw of [/thank/i, /submitted/i, /success/i, /added/i, /received/i, /error/i, /invalid/i, /required/i, /already/i, /captcha/i, /review/i]) {
  const mm = text.match(new RegExp('.{60}' + kw.source + '.{100}', 'i'));
  if (mm) console.log('KW', kw.source, '→', mm[0].trim());
}
console.log('PAGE-HEAD:', text.slice(0, 500));
console.log('FORM-STILL?', /name=["']?siteurl/i.test(html), '| act=send still?', /name=["']?act["']?\s+id="act"\s+value="send"/i.test(html));
