// win1800: probusinessdirectory 参数化提交 用法: node _w1800_pbd3.mjs <name> <headline> <desc> <url> <email> <catval>
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const [NAME, HEAD, DESC, SURL, EMAIL, CAT] = process.argv.slice(2);
const URL_ = 'https://www.probusinessdirectory.com/business/submit';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = tabs.find(t => (t.url || '').includes('probusiness') && t.type === 'page');
let created = false;
if (!tab) { const nw = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json(); tab = nw; created = true; await sleep(2000); }
const tabId = tab.id;
await fetch('http://127.0.0.1:9224/json/activate/' + tabId).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
try {
  await cdp.send('Page.navigate', { url: URL_ });
  let ready = 'NO';
  for (let i = 0; i < 12; i++) { await sleep(2000); ready = await cdp.eval(`(() => document.querySelector('input[name="listing[name]"]') ? 'YES' : 'NO')()`); if (ready === 'YES') break; }
  if (ready !== 'YES') { console.log('FORM_NOT_READY'); process.exit(1); }
  await sleep(2000);
  const F = [
    ['input[name="listing[name]"]', NAME],
    ['input[name="listing[headline]"]', HEAD],
    ['textarea[name="listing[description]"]', DESC],
    ['input[name="listing[url]"]', SURL],
    ['input[name="listing[submitterFullName]"]', 'Leo Xm'],
    ['input[name="listing[submitterEmailAddress]"]', EMAIL],
    ['input[name="listing[streetAddress]"]', '1000 N Main St'],
    ['input[name="listing[city]"]', 'Los Angeles'],
    ['input[name="listing[state]"]', 'CA'],
    ['input[name="listing[postalCode]"]', '90012'],
  ];
  for (const [sel, val] of F) {
    const st = await cdp.eval(`(() => { const el=document.querySelector('${sel}'); if(!el) return 'MISS'; el.scrollIntoView({block:'center'}); el.focus(); el.value=''; return 'ok'; })()`);
    if (st.includes('MISS')) { console.log('miss', sel); continue; }
    await sleep(120); await cdp.send('Input.insertText', { text: val }); await sleep(120);
  }
  await cdp.eval(`(() => { const s=document.querySelector('select[name="listing[categories]"]'); s.value='${CAT}'; s.dispatchEvent(new Event('change',{bubbles:true})); const c=document.querySelector('select[name="listing[country]"]'); if(c){ const o=[...c.options].find(o=>/United States/i.test(o.text)); if(o){ c.value=o.value; c.dispatchEvent(new Event('change',{bubbles:true})); } } return 1; })()`);
  const btn = await cdp.eval(`(() => { const f=document.querySelector('form[name=listing]'); const b=f.querySelector('button[type=submit]'); b.scrollIntoView({block:'center'}); b.click(); return 1; })()`);
  console.log('SUBMIT:', btn);
  await sleep(8000);
  const after = await cdp.eval(`(() => { const t=document.body.innerText.slice(0,1500); const marks=[]; for(const p of ['submitted','success','payment','error','required','already']){ const i=t.toLowerCase().indexOf(p); if(i>=0) marks.push(t.slice(Math.max(0,i-40),i+80).replace(/\s+/g,' ')); } return JSON.stringify({url:location.href.slice(0,110), marks:marks.slice(0,4)}); })()`);
  console.log('AFTER:', after);
} finally { ws.close(); }
