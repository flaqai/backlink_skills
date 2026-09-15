// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { readFileSync } from 'fs';
const login = await fetch('https://write.otter.homes/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({alias:'leoxm', pass:'Xx@Otter26!Xm'}) });
const token = (await login.json()).data?.access_token;
const del = await fetch('https://write.otter.homes/api/posts/t7t0ppdsha', { method:'DELETE', headers:{'Authorization':'Token '+token} });
console.log('delete:', del.status);
const chk = await fetch('https://write.otter.homes/t7t0ppdsha');
console.log('post-check:', chk.status, chk.status===404 ? 'GONE_OK' : 'STILL_LIVE');
