// VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
import { ProxyAgent as _PxAg, setGlobalDispatcher as _PxSet } from 'undici';
import { connect as _PxC } from 'node:net';
const _pxUp = await new Promise(r => { const s = _PxC(5780, '127.0.0.1'); s.once('connect', () => { s.destroy(); r(true); }); s.once('error', () => r(false)); });
if (_pxUp) _PxSet(new _PxAg('http://127.0.0.1:5780'));

import { writeFileSync } from 'fs';
const TASKS = {
  t8: { site: 'generatorforhouse.org', title: 'Generator For House - Sizing, Costs and Brand Guides', desc: 'Practical guide to home backup power: portable generator sizing by wattage, running cost breakdowns, inverter vs conventional comparisons, brand roundups and cold-weather safety tips for homeowners.', mk: 'home generator, backup power, portable generator' },
  t9: { site: 'spravs.com', title: 'SPRAVS - Phone Charger Reviews and Charging Guides', desc: 'SPRAVS reviews phone chargers, cables, GaN adapters and wireless charging pads with real-world speed tests. Practical guides cover fast-charge standards, power bank picks and battery health tips.', mk: 'phone charger, power bank, usb-c' },
};
const DOMS = ['businessfreedirectory.com','addgoodsites.com','alive-directory.com','acedirectory.org','bestdirectory4you.com','one-sublime-directory.com','activdirectory.net','abstractdirectory.net'];
const results = [];
for (let i = 0; i < DOMS.length; i++) {
  const d = DOMS[i];
  const taskKey = i % 2 === 0 ? 't8' : 't9';
  const t = TASKS[taskKey];
  const email = d.split('-')[0].slice(0,3) + '.' + t.site.split('.')[0].slice(0,3) + '@92ng.com';
  try {
    // GET /submit 落cookie
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 18000);
    const r1 = await fetch(`https://www.${d}/submit`, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126' } });
    const cookies = (r1.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ');
    const h1 = await r1.text();
    clearTimeout(timer);
    // 解析分类+LINK_TYPE
    const catOpt = [...h1.matchAll(/<option[^>]*value="(\d+)"[^>]*>\s*(?:[_|~>-]*\s*)?([A-Za-z &]{3,30})/gi)].map(m => ({ v: m[1], n: m[2].trim() }));
    const cat = catOpt.find(c => /business|computers|internet|shopping/i.test(c.n))?.v || catOpt[0]?.v || '';
    const lt = h1.match(/name="LINK_TYPE"[^>]*value="([^"]*)"/)?.[1] || 'normal';
    const hasCaptcha = /name="CAPTCHA"|image_verification/i.test(h1);
    if (!cat && !/CATEGORY_ID|categorie/i.test(h1)) { console.log(`${d}: GET ok(${r1.status}) 但无分类字段, form字段异常`); continue; }
    const body = new URLSearchParams({
      LINK_TYPE: lt, TITLE: t.title, URL: 'https://' + t.site,
      DESCRIPTION: t.desc, META_KEYWORDS: t.mk, META_DESCRIPTION: t.desc.slice(0,180),
      OWNER_NAME: 'Leo Xm', OWNER_EMAIL: email,
      CATEGORY_ID: cat, RECPR_URL: '', RECPR_TEXT: '',
      AGREERULES: '1', submit: 'Continue',
    });
    const r2 = await fetch(`https://www.${d}/submit`, { method: 'POST', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126', 'Content-Type': 'application/x-www-form-urlencoded', Referer: `https://www.${d}/submit`, ...(cookies ? { Cookie: cookies } : {}) }, body: body.toString(), redirect: 'follow' });
    const h2 = await r2.text();
    clearTimeout(0);
    const text2 = h2.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
    let verdict = 'no-match';
    if (/invalid code|security code|wrong (validation|verification)|image verification/i.test(text2)) verdict = 'CAPTCHA-ENFORCED';
    else if (/awaiting approval|link submitted|thank you|successfully submitted|has been received/i.test(text2)) verdict = 'OK';
    else if (/already|duplicate|exist/i.test(text2)) verdict = 'DUP';
    else if (/required|error|invalid/i.test(text2)) verdict = 'ERR:' + (text2.match(/.{0,30}(?:required|error|invalid).{0,50}/i)?.[0] || '').trim().slice(0,70);
    console.log(`${d} [${taskKey} cat=${cat} lt=${lt} cap=${hasCaptcha?'Y':'n'}] HTTP${r2.status} → ${verdict}`);
    results.push({ d, taskKey, verdict, email });
  } catch (e) { console.log(`${d} ERR ${(e.cause?.code||e.message).slice(0,40)}`); results.push({ d, taskKey, verdict: 'UNREACHABLE', email }); }
}
writeFileSync('D:/Github/seoadminC/storage/_w6_46blast_results.json', JSON.stringify(results, null, 1));
