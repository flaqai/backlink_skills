// reg0000 0909: creatorlink 第四步——探게시판(board)管理入口与发文路径
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const log = (s) => fs.writeSync(1, s + '\n');

let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('creatorlink'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error('ws超时')), 8000); });
const c = new CDP(ws);
await c.send('Page.enable');

// 收集 dashboard 全部可见链接（找board/게시판 관리入口）
const links = await c.evalT(`(() => {
  const seen = new Set(); const out = [];
  for (const a of document.querySelectorAll('a[href]')) {
    const href = a.href; const txt = (a.innerText || '').replace(/\\s+/g, ' ').trim();
    if (!href || seen.has(href) || !txt) continue;
    if (/게시|board|post|글|쓰기|메뉴|관리|편집/.test(txt + href)) { seen.add(href); out.push(txt.slice(0, 30) + ' => ' + href.slice(0, 110)); }
  }
  return out.join('\\n') || 'NONE';
})()`, 10000);
log('LINKS:\\n' + links);

// 게시판 统计卡是否可点击
const card = await c.evalT(`(() => {
  const els = [...document.querySelectorAll('a,div,li,button')].filter(e => /게시판/.test(e.innerText || '') && (e.innerText || '').length < 30);
  return els.map(e => { const r = e.getBoundingClientRect(); return e.tagName + '|' + String(e.className).slice(0, 40) + '|[' + Math.round(r.x) + ',' + Math.round(r.y) + ']|' + (e.href || '').slice(0, 80); }).join('\\n') || 'NONE';
})()`, 8000);
log('BOARDCARD:\\n' + card);
log('DONE');
