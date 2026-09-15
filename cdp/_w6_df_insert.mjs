// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const code = process.argv[2] || '';
const body = new URLSearchParams({
  catname: 'Business/General',
  linkname: 'Smog Check Near Me - Stations, Prices and STAR Info',
  linkurl: 'https://smogcheck-nearme.com',
  descriere: 'Find smog check stations near you in California, with prices, STAR station info and passing tips. Covers what to expect during the test and common failure causes.',
  email: 'df.smog@92ng.com',
  txtNumber: code,
  Submit: 'Add URL',
});
const res = await fetch('https://www.directory-free.com/submit/insert.php', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://www.directory-free.com/submit/submit.php' }, body: body.toString() });
const html = await res.text();
console.log('HTTP', res.status, 'len', html.length);
const text = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
for (const kw of [/thank/i, /submitted/i, /success/i, /added/i, /already/i, /error/i, /invalid/i, /wrong/i, /incorrect/i, /code/i, /cuvant/i]) {
  const mm = text.match(new RegExp('.{50}' + kw.source + '.{110}', 'i'));
  if (mm) console.log('KW', kw.source, '→', mm[0].trim());
}
console.log('HEAD:', text.slice(0, 400));
