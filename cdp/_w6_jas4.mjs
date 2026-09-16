// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

import { writeFileSync } from 'fs';
const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const fd = new FormData();
fd.append('Email_Address__req_email_max64', 'jas.qr@92ng.com');
fd.append('Site_Title__req_txt_max100', 'QR Code Generator - Free Online QR Code Maker');
fd.append('Site_Description__req_txt_max2000', 'Free online QR code generator: create high-resolution QR codes for URLs, text, WiFi access and contact cards with custom colors and instant PNG download. No signup required and no watermark on downloads.');
fd.append('Keywords__txt_max200', 'qr code generator, qr code maker, free qr code');
fd.append('Password__txt_req_min6', 'Xx@Jas26!Xm');
fd.append('Full_Description__txt_max10000', 'QR Code Generator is a browser-based tool for creating custom QR codes. Users can generate codes for website URLs, plain text, WiFi network access and digital contact cards, with full control over colors and embedded logos. Every code downloads instantly as a high-resolution PNG without watermarks or registration. The interface works on desktop and mobile browsers and requires no account.');
fd.append('URL__req_url_max100', 'https://qrcodegenerator.vip');
fd.append('Comments__txt_max1024', '');
fd.append('Voucher_Code__txt_max32', '');
fd.append('express', '0');
fd.append('submitListingNext', 'Continue');
const r = await fetch('https://www.jasminedirectory.com/index.php?a=2070753691', { method: 'POST', headers: { ...H, Referer: 'https://www.jasminedirectory.com/index.php?a=2070753691' }, body: fd, redirect: 'follow' });
const h = await r.text();
console.log('HTTP', r.status, 'len', h.length);
const fields = [...new Set([...h.matchAll(/<(?:input|textarea|select)\b[^>]*name=["']?([^"'>\s]+)["']?/gi)].map(m => m[1]))];
console.log('FIELDS:', fields.slice(0,20).join(','));
const text = h.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
for (const kw of [/thank/i, /error/i, /required/i, /invalid/i, /categor/i, /received/i]) {
  const mm = text.match(new RegExp('.{40}' + kw.source + '.{90}', 'i'));
  if (mm) console.log('KW', kw.source, '→', mm[0].trim());
}
console.log('TEXT:', text.slice(0,250));
writeFileSync('D:/Github/seoadminC/storage/_w6_jas_step3.html', h);
