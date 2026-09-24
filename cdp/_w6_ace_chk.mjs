// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126' };
const body = new URLSearchParams({
  LINK_TYPE: 'normal', TITLE: 'SPRAVS - Phone Charger Reviews and Charging Guides', URL: 'https://spravs.com',
  DESCRIPTION: 'SPRAVS reviews phone chargers, cables, GaN adapters and wireless charging pads with real-world speed tests.',
  META_KEYWORDS: 'phone charger, power bank', META_DESCRIPTION: 'Phone charger reviews.',
  OWNER_NAME: 'Leo Xm', OWNER_EMAIL: 'ace.spr@92ng.com',
  CATEGORY_ID: '2', RECPR_URL: '', RECPR_TEXT: '', AGREERULES: '1', submit: 'Continue',
});
const r = await fetch('https://www.acedirectory.org/submit', { method: 'POST', headers: { ...H, 'Content-Type': 'application/x-www-form-urlencoded', Referer: 'https://www.acedirectory.org/submit' }, body: body.toString(), redirect: 'follow' });
const h = await r.text();
const t = h.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
console.log('HTTP', r.status, 'len', h.length);
console.log('TEXT:', t.slice(0, 500));
