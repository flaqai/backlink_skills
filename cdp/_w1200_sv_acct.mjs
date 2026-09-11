// _w1200_sv_acct.mjs — win1200: svbtle /account onboarding表单细察(无嵌套模板版)
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await new Promise(r => setTimeout(r, 300));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
const shot = async (name) => {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  const fs = await import('fs');
  fs.writeFileSync(`D:/Github/backlink_skills/cdp/_w1200_${name}.jpg`, Buffer.from(data, 'base64'));
  console.log('shot:', name);
};

try {
  await cdp.send('Page.navigate', { url: 'https://svbtle.com/account' });
  await sleep(10000);
  const st = await cdp.eval('(function(){' +
    'function desc(e){ var lab=""; try{ if(e.id){ var l=document.querySelector("label[for=\\""+e.id+"\\"]"); if(l) lab=l.innerText; } }catch(x){} return { t: e.type || e.tagName, n: e.name||"", id: e.id||"", val: (e.value||"").slice(0,30), ph: e.placeholder||"", label: lab.slice(0,40) }; }' +
    'return JSON.stringify({' +
    'forms: [...document.querySelectorAll("form")].map(function(f){ return { action: f.action, method: f.method,' +
    ' fields: [...f.querySelectorAll("input, textarea, select")].filter(function(e){ return e.type !== "hidden"; }).map(desc),' +
    ' submits: [...f.querySelectorAll("input[type=submit], button")].map(function(b){ return { id: b.id, t: (b.innerText||b.value||"").trim() }; }) }; }),' +
    'h1: (document.querySelector("h1, h2")||{}).innerText||"",' +
    'body: document.body.innerText.replace(/\\s+/g," ").slice(0,400)' +
    '}); })()');
  console.log('account:', st);
  await shot('sv_acct');
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
