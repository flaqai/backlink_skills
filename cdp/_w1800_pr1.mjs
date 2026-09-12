// win1800: pressrelease.top 新闻稿提交 (Symfony+占位token模式)
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const URL_ = 'https://pressrelease.top/submit';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = tabs.find(t => (t.url || '').includes('pressrelease') && t.type === 'page');
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
  for (let i = 0; i < 12; i++) { await sleep(2000); ready = await cdp.eval(`(() => document.querySelector('input[name="press_release[companyName]"]') ? 'YES' : 'NO')()`); if (ready === 'YES') break; }
  if (ready !== 'YES') { console.log('FORM_NOT_READY'); process.exit(1); }
  await sleep(1500);
  const F = [
    ['input[name="press_release[companyName]"]', 'Generator for House'],
    ['input[name="press_release[companyWebsite]"]', 'https://generatorforhouse.org/'],
    ['textarea[name="press_release[companyDescription]"]', 'Generator for House is a home power guide covering portable generators, standby units and inverter models, helping homeowners compare fuel types, wattage needs and safety practices for outages and emergencies.'],
    ['input[name="press_release[contactFullName]"]', 'Leo Xm'],
    ['input[name="press_release[contactEmailAddress]"]', 'task8dir25@92ng.com'],
    ['input[name="press_release[submitterFullName]"]', 'Leo Xm'],
    ['input[name="press_release[submitterEmailAddress]"]', 'task8dir25@92ng.com'],
    ['input[name="press_release[pressReleaseHeadline]"]', 'Generator for House Expands Free Guides on Home Backup Power and Generator Safety'],
    ['textarea[name="press_release[pressReleaseSummary]"]', 'The home power resource publishes expanded comparisons of portable, standby and inverter generators to help households prepare for outages.'],
  ];
  for (const [sel, val] of F) {
    const st = await cdp.eval(`(() => { const el=document.querySelector('${sel}'); if(!el) return 'MISS'; el.scrollIntoView({block:'center'}); el.focus(); el.value=''; return 'ok'; })()`);
    if (st.includes('MISS')) { console.log('miss', sel); continue; }
    await sleep(120); await cdp.send('Input.insertText', { text: val }); await sleep(120);
  }
  const inv = await cdp.eval(`(() => { const f=document.querySelector('form[name=press_release]'); const bad=[...f.querySelectorAll(':invalid')].map(e=>e.name||e.id).filter(Boolean); return JSON.stringify(bad.slice(0,6)); })()`);
  console.log('INVALID:', inv);
  const btn = await cdp.eval(`(() => { const f=document.querySelector('form[name=press_release]'); const b=f.querySelector('button[type=submit]'); if(!b) return 0; b.scrollIntoView({block:'center'}); b.click(); return 1; })()`);
  console.log('SUBMIT:', btn);
  await sleep(8000);
  const after = await cdp.eval(`(() => { const t=document.body.innerText.slice(0,1500); const marks=[]; for(const p of ['thank','submitted','success','review','received','error','required','already','payment']){ const i=t.toLowerCase().indexOf(p); if(i>=0) marks.push(t.slice(Math.max(0,i-40),i+80).replace(/\s+/g,' ')); } return JSON.stringify({url:location.href.slice(0,110), marks:marks.slice(0,4)}); })()`);
  console.log('AFTER:', after);
  await cdp.send('Page.captureScreenshot').then(r => { fs.writeFileSync('D:/Github/backlink_skills/cdp/_w1800_pr_shot.png', Buffer.from(r.data, 'base64')); }).catch(() => {});
} finally { ws.close(); }
