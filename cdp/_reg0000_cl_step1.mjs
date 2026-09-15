// reg0000 0909: creatorlink 恢复第一步——激活tab→/dashboard→诊断#site-publish-onoff+截图
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const log = (s) => fs.writeSync(1, s + '\n');

let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('creatorlink'));
if (!tab) {
  // 没有则开新tab
  const nt = await (await fetch('http://127.0.0.1:9224/json/new?https://creatorlink.com/dashboard', { method: 'PUT' })).json();
  tab = nt;
  log('NEW TAB ' + tab.id);
}
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error('ws连接超时8s')), 8000); });
const c = new CDP(ws);
await c.send('Target.activateTarget', { targetId: tab.id });
await c.send('Page.enable');
await c.send('Runtime.enable');

// 确保在 /dashboard
const cur = await c.evalT('location.href', 6000);
log('CUR: ' + cur);
if (!String(cur).includes('/dashboard')) {
  await c.goto('https://creatorlink.com/dashboard');
}
await sleep(6000); // 延迟加载

// 登录态检查
const who = await c.evalT('document.body ? document.body.innerText.slice(0,300) : "NOBODY"', 8000);
log('BODY300: ' + String(who).replace(/\n/g, ' | '));

// 找 #site-publish-onoff（主文档+iframe遍历）
const probe = await c.evalT(`(() => {
  const out = { main: null, frames: [] };
  const el = document.querySelector('#site-publish-onoff');
  if (el) {
    const r = el.getBoundingClientRect();
    out.main = { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), html: el.outerHTML.slice(0, 200) };
  }
  const pubs = [...document.querySelectorAll('[id*=publish],[class*=publish]')].map(e => ({ tag: e.tagName, id: e.id, cls: String(e.className).slice(0, 60), txt: (e.innerText || '').slice(0, 40), rect: (() => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })() }));
  out.publishish = pubs.slice(0, 12);
  out.ptext = (document.querySelector('.publish-text,#publish-text,[class*=publish-text]') || {}).innerText || null;
  try { out.frames = [...document.querySelectorAll('iframe')].map(f => ({ src: f.src.slice(0, 80), id: f.id })); } catch (e) { }
  out.hasWizard = !!document.querySelector('[class*=modal],[class*=wizard],[class*=layer],[class*=popup]');
  return JSON.stringify(out);
})()`, 10000);
log('PROBE: ' + probe);

// 截图
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000_cl_dash.png', Buffer.from(shot.data, 'base64'));
log('SHOT saved D:/Github/seoadminC/storage/_reg0000_cl_dash.png');
log('DONE');
