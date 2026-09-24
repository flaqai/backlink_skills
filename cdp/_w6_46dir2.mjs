// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' };
const r = await fetch('http://46-directories.directoriesadvertising.com/advertising-46-directories.php', { headers: H });
const h = await r.text();
// 抓所有外域域名（目录清单通常是纯文本/链接混合）
const domains = [...new Set([...h.matchAll(/(?:https?:\/\/)?([a-z0-9-]+\.(?:com|net|org|info|biz|us|co))(?:\/|["'\s<)])/gi)].map(m => m[1].toLowerCase()))]
  .filter(d => !/directoriesadvertising|google|facebook|twitter|php$/.test(d));
console.log(domains.join('\n'));
