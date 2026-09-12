// win1800: probusinessdirectory Symfony表单 9224攻法 (tsd9224配方复用)
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const URL_ = 'https://www.probusinessdirectory.com/business/submit';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = tabs.find(t => (t.url || '').includes('probusiness') && t.type === 'page');
let created = false;
if (!tab) {
  const nw = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
  tab = nw; created = true; await sleep(2000);
}
const tabId = tab.id;
await fetch('http://127.0.0.1:9224/json/activate/' + tabId).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
try {
  await cdp.send('Page.navigate', { url: URL_ });
  let ready = 'NO';
  for (let i = 0; i < 12; i++) {
    await sleep(2000);
    ready = await cdp.eval(`(() => document.querySelector('input[name="listing[name]"]') ? 'YES' : 'NO')()`);
    if (ready === 'YES') break;
  }
  if (ready !== 'YES') { console.log('FORM_NOT_READY'); ws.close(); process.exit(1); }
  await sleep(3000); // 等csrf JS取真token
  console.log('FORM_READY');
  const F = [
    ['input[name="listing[name]"]', 'Smog Check Near Me'],
    ['input[name="listing[headline]"]', 'Smog Check Near Me - Certified STAR Smog Check Stations'],
    ['textarea[name="listing[description]"]', 'Smog Check Near Me helps California drivers find certified STAR smog check stations close to home. Compare smog inspection prices, check DMV renewal requirements and get a fast, licensed smog check for your vehicle at a trusted test-only or test-and-repair center.'],
    ['input[name="listing[url]"]', 'https://smogcheck-nearme.com/'],
    ['input[name="listing[emailAddress]"]', 'task2dir20@92ng.com'],
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
  await cdp.eval(`(() => { const s=document.querySelector('select[name="listing[categories]"]'); s.value='3'; s.dispatchEvent(new Event('change',{bubbles:true})); const c=document.querySelector('select[name="listing[country]"]'); if(c){ const o=[...c.options].find(o=>/United States/i.test(o.text)); if(o){ c.value=o.value; c.dispatchEvent(new Event('change',{bubbles:true})); } } return document.querySelector('select[name="listing[categories]"]').value; })()`);
  const chk = await cdp.eval(`(() => { const g=s=>{const e=document.querySelector(s);return e?e.value.length:0;}; return JSON.stringify({n:g('input[name="listing[name]"]'),h:g('input[name="listing[headline]"]'),u:g('input[name="listing[url]"]'),d:g('textarea[name="listing[description]"]'),e:g('input[name="listing[emailAddress]"]'),cat:document.querySelector('select[name="listing[categories]"]')?.value,tok:(document.querySelector('input[name="listing[_token]"]')||{}).value}); })()`);
  console.log('VALLEN:', chk);
  const btn = await cdp.eval(`(() => { const b=document.querySelector('button[type=submit]'); if(!b) return 0; b.scrollIntoView({block:'center'}); b.click(); return 1; })()`);
  console.log('SUBMIT:', btn);
  await sleep(8000);
  const after = await cdp.eval(`(() => { const t=document.body.innerText.slice(0,2000); const marks=[]; for(const p of ['thank','submitted','success','review','received','error','required','already','invalid','csrf','captcha']){ const i=t.toLowerCase().indexOf(p); if(i>=0) marks.push(t.slice(Math.max(0,i-40),i+90).replace(/\s+/g,' ')); } return JSON.stringify({url:location.href.slice(0,120), marks:marks.slice(0,5)}); })()`);
  console.log('AFTER:', after);
  await cdp.send('Page.captureScreenshot').then(r => {
    fs.writeFileSync('D:/Github/backlink_skills/cdp/_w1800_pbd_shot.png', Buffer.from(r.data, 'base64'));
  }).catch(() => {});
} finally {
  ws.close();
  if (created) { const all = await (await fetch('http://127.0.0.1:9224/json/list')).json(); if (all.filter(t => t.type === 'page').length > 1) await fetch('http://127.0.0.1:9224/json/close/' + tabId).catch(() => {}); }
}
