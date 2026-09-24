// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
import { ProxyAgent as _PxAg, fetch as _PxF } from 'undici';
const _pxAg = new _PxAg('http://127.0.0.1:5780');
const _dfF = globalThis.fetch;
globalThis.fetch = (..._dfA) => _dfF(..._dfA).catch(_dfE => {
  if (_dfE instanceof TypeError && /fetch failed/i.test(String(_dfE.message))) return _PxF(_dfA[0], { ...(_dfA[1] || {}), dispatcher: _pxAg });
  throw _dfE;
});

import { readFileSync } from 'fs';
const login = await fetch('https://write.otter.homes/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({alias:'leoxm', pass:'Xx@Otter26!Xm'}) });
const token = (await login.json()).data?.access_token;
const del = await fetch('https://write.otter.homes/api/posts/t7t0ppdsha', { method:'DELETE', headers:{'Authorization':'Token '+token} });
console.log('delete:', del.status);
const chk = await fetch('https://write.otter.homes/t7t0ppdsha');
console.log('post-check:', chk.status, chk.status===404 ? 'GONE_OK' : 'STILL_LIVE');
