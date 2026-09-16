// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const r = await (await fetch('https://morefunz.com/submit-url', { headers: H })).text();
for (const pat of [/setload[\s\S]{0,250}/g, /\$\('#act'\)[\s\S]{0,200}/g, /act"\)[\s\S]{0,150}/g, /submit-url[\s\S]{0,150}/g]) {
  for (const f of [...r.matchAll(pat)].slice(0,4)) console.log('>>', f[0].replace(/\s+/g,' ').slice(0,260), '\n');
}
// tabord 表单的 submit 事件绑定
for (const f of [...r.matchAll(/#tabord[\s\S]{0,300}/g)].slice(0,5)) console.log('TABORD:', f[0].replace(/\s+/g,' ').slice(0,300), '\n');
