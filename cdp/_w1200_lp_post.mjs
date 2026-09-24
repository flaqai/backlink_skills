// _w1200_lp_post.mjs — win1200: letterpad 首篇养号文(theme=account-warming, 无锚链)
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TITLE = 'Small Tools, Kept Close';
const BODY = [
  'I keep a short list of web utilities on my homepage: a timer, a color picker, a unit converter, a QR maker. None of them are impressive on their own, but together they save me a dozen small trips into search results every week.',
  'The trick I have settled on is simple. When I catch myself doing the same fiddly task three times, I look for a single-purpose tool that does exactly that task and nothing else. If it loads fast and works without an account, it earns a place on the list.',
  'Big software suites have their place, but the small tools are the ones that quietly hold a workday together. This blog is where I plan to write down which ones survive more than a month of use, and why.'
].join('\n\n');

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
  // New Post 直接入口通常是 /posts/new 或点按钮
  await cdp.send('Page.navigate', { url: 'https://letterpad.app/posts/new' });
  await sleep(12000);
  console.log('url:', await cdp.eval('location.href.slice(0, 80)'));
  const ed = await cdp.eval(`JSON.stringify({
    ce: [...document.querySelectorAll('[contenteditable=true]')].map(e => ({ cls: (e.className || '').toString().slice(0, 40), ph: (e.dataset ? e.dataset.placeholder : '') || '' })),
    textareas: [...document.querySelectorAll('textarea')].map(e => ({ ph: (e.placeholder || '').slice(0, 30) })),
    inputs: [...document.querySelectorAll('input')].filter(e => e.offsetParent !== null).map(e => ({ ph: (e.placeholder || '').slice(0, 30) })).slice(0, 6),
    btns: [...document.querySelectorAll('button')].filter(e => e.offsetParent !== null).map(e => (e.innerText || '').trim()).filter(Boolean).slice(0, 12)
  })`);
  console.log('editor:', ed);
  await shot('lp_editor');
} catch (e) { console.error('ERR', e.message); await shot('lp_err').catch(() => {}); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
