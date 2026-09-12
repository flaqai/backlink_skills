// win1800: WP-listing族 参数化填表+recaptcha.net镜像注入+选类目
// 用法: node _w1800_wpl1.mjs <域片段> <title> <siteurl> <desc> <email> <catvalue>
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const [DOM, TITLE, SURL, DESC, EMAIL, CAT] = process.argv.slice(2);
const URL_ = `https://www.${DOM}/submit-a-listing/`;
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = tabs.find(t => (t.url || '').includes(DOM) && t.type === 'page');
let created = false;
if (!tab) { const nw = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json(); tab = nw; created = true; await sleep(2000); }
const tabId = tab.id;
await fetch('http://127.0.0.1:9224/json/activate/' + tabId).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
await cdp.send('Network.enable');
await cdp.send('Network.setBlockedURLs', { urls: ['*google.com/recaptcha*'] });
try {
  await cdp.send('Page.navigate', { url: URL_ });
  let ready = 'NO';
  for (let i = 0; i < 15; i++) { await sleep(2000); ready = await cdp.eval(`(() => document.querySelector('input[name=dcx-listing-title]') ? 'YES' : 'NO')()`); if (ready === 'YES') break; }
  if (ready !== 'YES') { console.log('FORM_NOT_READY'); process.exit(1); }
  console.log('FORM_READY');
  const F = [['dcx-listing-title', TITLE], ['dcx-listing-website-url', SURL], ['dcx-listing-description', DESC], ['dcx-listing-submitter-name', 'Leo Xm'], ['dcx-listing-submitter-email-address', EMAIL]];
  for (const [name, val] of F) {
    const st = await cdp.eval(`(() => { const el=document.querySelector('input[name=${name}], textarea[name=${name}]'); if(!el) return 'MISS'; el.scrollIntoView({block:'center'}); el.focus(); el.value=''; return 'ok'; })()`);
    if (st.includes('MISS')) { console.log('miss', name); continue; }
    await sleep(150); await cdp.send('Input.insertText', { text: val }); await sleep(150);
  }
  const cs = await cdp.eval(`(() => { const s=document.querySelector('select[name=dcx-listing-category]'); if(!s) return 'NOSEL'; s.value='${CAT}'; s.dispatchEvent(new Event('change',{bubbles:true})); return 'CAT='+s.options[s.selectedIndex].textContent.trim(); })()`);
  console.log(cs);
  const chk = await cdp.eval(`(() => { const g=n=>{const e=document.querySelector('[name='+n+']');return e?e.value.length:0;}; return JSON.stringify({t:g('dcx-listing-title'),u:g('dcx-listing-website-url'),d:g('dcx-listing-description'),e:g('dcx-listing-submitter-email-address')}); })()`);
  console.log('VALLEN:', chk);
  const g = await cdp.eval(`(async () => {
    document.querySelectorAll('script[src*="recaptcha"]').forEach(s => s.remove());
    if (window.grecaptcha) { try { delete window.grecaptcha; } catch(e) {} }
    await new Promise(res => { const s=document.createElement('script'); s.src='https://www.recaptcha.net/recaptcha/api.js'; s.onload=()=>res(1); s.onerror=()=>res(0); document.head.appendChild(s); setTimeout(()=>res(0),10000); });
    await new Promise(r => setTimeout(r, 2000));
    try { if (window.grecaptcha && document.querySelector('.g-recaptcha')) window.grecaptcha.render(document.querySelector('.g-recaptcha')); } catch(e) {}
    await new Promise(r => setTimeout(r, 1500));
    const box = document.querySelector('.g-recaptcha');
    if (box) box.scrollIntoView({block:'center'});
    const r = box ? box.getBoundingClientRect() : null;
    return JSON.stringify({box: !!box, x: r?Math.round(r.x):null, y: r?Math.round(r.y):null});
  })()`);
  console.log('RECAP:', g);
  await cdp.send('Page.captureScreenshot').then(r => { fs.writeFileSync(`D:/Github/backlink_skills/cdp/_w1800_wpl_${DOM}_s1.png`, Buffer.from(r.data, 'base64')); }).catch(() => {});
} finally { ws.close(); }
