// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const r = await (await fetch('https://morefunz.com/submit-url', { headers: H })).text();
for (const pat of [/setload[\s\S]{0,250}/g, /\$\('#act'\)[\s\S]{0,200}/g, /act"\)[\s\S]{0,150}/g, /submit-url[\s\S]{0,150}/g]) {
  for (const f of [...r.matchAll(pat)].slice(0,4)) console.log('>>', f[0].replace(/\s+/g,' ').slice(0,260), '\n');
}
// tabord 表单的 submit 事件绑定
for (const f of [...r.matchAll(/#tabord[\s\S]{0,300}/g)].slice(0,5)) console.log('TABORD:', f[0].replace(/\s+/g,' ').slice(0,300), '\n');
