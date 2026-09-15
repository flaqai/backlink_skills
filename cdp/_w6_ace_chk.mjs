// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

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
