import { CDP, sleep } from './CDP.mjs';
import { readFileSync } from 'fs';
const html = readFileSync('_win2000_posts/paperwf.html', 'utf8').trim();
// HTML → Markdown (writefreely 惯例)
function h2md(h) {
  let s = h;
  s = s.replace(/<h2>([\s\S]*?)<\/h2>/g, '\n\n## $1\n\n');
  s = s.replace(/<h3>([\s\S]*?)<\/h3>/g, '\n\n### $1\n\n');
  s = s.replace(/<p>([\s\S]*?)<\/p>/g, '$1\n\n');
  s = s.replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**');
  s = s.replace(/<em>([\s\S]*?)<\/em>/g, '*$1*');
  s = s.replace(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)');
  s = s.replace(/<ul>([\s\S]*?)<\/ul>/g, (m, inner) => '\n' + inner.replace(/<li>([\s\S]*?)<\/li>/g, '- $1\n').replace(/\n\n/g, '\n') + '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}
const title = 'ZA Bank 汇率与多币种账户：换汇时机和手续费的真实体验';
const bodyFull = title + '\n\n' + h2md(html);
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url === 'https://paper.wf/');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
// 重注入 MD 版
console.log('注入MD:', await c.eval(`(function(){ var ta = document.querySelector('textarea'); if (!ta) return 'nf'; ta.focus(); var d = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; d.call(ta, ${JSON.stringify(bodyFull)}); ta.dispatchEvent(new Event('input', {bubbles:true})); return 'len=' + ta.value.length; })()`));
await sleep(1500);
// 右上角纸飞机 Publish (aria-label 或最后按钮)
const pb = await c.eval(`(() => { const cand = [...document.querySelectorAll('button, a, [role=button]')].filter(e => e.offsetWidth > 0); const b = cand.find(e => /publish/i.test(e.getAttribute('aria-label') || '')) || cand.find(e => (e.textContent || '').includes('➤')) || cand[cand.length - 1]; if (!b) return 'NO'; const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), label: b.getAttribute('aria-label') || (b.textContent||'').trim().slice(0,20) }); })()`);
console.log('Publish:', pb);
if (pb === 'NO') process.exit(1);
const p = JSON.parse(pb);
await clickXY(p.x, p.y);
await sleep(9000);
console.log('终态:', await c.eval(`(() => JSON.stringify({ url: location.href, h1: (document.querySelector('h1')||{}).textContent?.trim()?.slice(0,60) || null, err: (document.querySelector('.alert, .error, [role=alert]')||{}).textContent?.trim()?.slice(0,80) || null }))()`));
