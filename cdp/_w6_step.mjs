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
