// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { writeFileSync } from 'fs';
const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
// ---------- 1. morefunz 表单归属 ----------
let r = await (await fetch('https://morefunz.com/submit-url', { headers: H })).text();
const forms = [];
const re = /<form\b[^>]*>/gi;
let m;
while ((m = re.exec(r))) {
  const start = m.index;
  const end = r.indexOf('</form>', start);
  const block = r.slice(start, end);
  const fields = [...block.matchAll(/<(?:input|textarea|select)\b[^>]*name=["']?([^"'>\s]+)["']?/gi)].map(x => x[1]);
  forms.push({ tag: m[0], fields: [...new Set(fields)] });
}
forms.forEach((f, i) => console.log(`MF form[${i}] ${f.tag}\n   fields: ${f.fields.join(',')}`));
// ---------- 2. directory-free step1 POST ----------
const post = async (url, body, ref) => {
  const res = await fetch(url, { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', ...(ref ? { Referer: ref } : {}) }, body });
  return { code: res.status, html: await res.text(), url: res.url };
};
let df = await post('https://www.directory-free.com/submit/add.php', 'categorie=Computers%2FInternet', 'https://www.directory-free.com/submit/submit.php');
console.log(`\nDF step1 POST → HTTP${df.code} final=${df.url} len=${df.html.length}`);
const f2 = [...df.html.matchAll(/<(?:input|textarea|select)\b[^>]*>/gi)].map(x => x[0].replace(/\s+/g,' ').slice(0,140)).filter(s => !/hidden|search|cuvant/i.test(s));
console.log('step2 fields:\n  ' + f2.slice(0, 20).join('\n  '));
writeFileSync('D:/Github/seoadminC/storage/_w6_df_step2.html', df.html);
