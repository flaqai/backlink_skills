// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const r = await (await fetch('https://morefunz.com/submit-url', { headers: H })).text();
// 找提交按钮/表单处理JS
for (const pat of [/sitenm[\s\S]{0,300}/, /\$\("#submit"\)[\s\S]{0,400}/, /submit\.click[\s\S]{0,300}/i, /\.post\([^)]{0,200}/g]) {
  const found = [...r.matchAll(new RegExp(pat.source, 'gi'))].slice(0,3);
  for (const f of found) console.log('>>', f[0].replace(/\s+/g,' ').slice(0,320), '\n');
}
// serialize / FormData 相关
for (const f of [...r.matchAll(/[a-z\.]*(?:serialize|FormData)[\s\S]{0,180}/gi)].slice(0,6)) console.log('SER:', f[0].replace(/\s+/g,' ').slice(0,200));
// 表单form[4]块完整dump（前1200字符）
const i4 = r.indexOf('<form method="post">', r.indexOf('act'));
const blk = r.slice(i4, i4+1400);
console.log('FORM4:', blk.replace(/\s+/g,' ').slice(0,900));
