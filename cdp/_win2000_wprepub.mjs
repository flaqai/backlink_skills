// wp2 补Publish: edit.php->首行Edit->状态检查->Publish三级流程
import { CDP, sleep } from './CDP.mjs';
const base = 'http://127.0.0.1:9224';
const tabs = await (await fetch(base + '/json/list')).json();
const tab = tabs.find(t => t.type === 'page' && t.url.includes('wordpress.com'));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const clickXY = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
// 1) edit.php 找首行 Edit 链接
await c.send('Page.navigate', { url: 'https://leoxmseo2.wordpress.com/wp-admin/edit.php' });
await sleep(9000);
const editLink = await c.evalT('(function(){var a=[...document.querySelectorAll("a")].find(function(x){return x.innerText.trim()==="Edit"&&x.href.indexOf("post=")>0});return a?a.href:"NO";})()', 10000);
console.log('editLink:', editLink);
if (editLink === 'NO' || editLink === 'TIMEOUT') { console.log('FAIL=NO_EDITLINK'); process.exit(1); }
await c.send('Page.navigate', { url: editLink });
await sleep(12000);
// 2) 状态
const st = await c.evalT('(function(){var m=document.body.innerText.match(/Status[: ]+([A-Za-z ]+)/);return JSON.stringify({status:m?m[1].slice(0,20):"unknown", href:location.href.slice(0,80)});})()', 10000);
console.log('state:', st);
// 3) Publish 流程(仅当非Published)
const pub1 = await c.evalT('(function(){var b=document.querySelector(".editor-post-publish-button__button");if(!b)return "NO";b.scrollIntoView({block:"center"});var q=b.getBoundingClientRect();return JSON.stringify({x:Math.round(q.x+q.width/2),y:Math.round(q.y+q.height/2),dis:b.disabled});})()', 10000);
console.log('pub1btn:', pub1);
if (pub1 !== 'NO' && pub1 !== 'TIMEOUT') {
  const p = JSON.parse(pub1);
  if (!p.dis) {
    await clickXY(p.x, p.y);
    await sleep(6000);
    // 确认按钮
    const pub2 = await c.evalT('(function(){var b=document.querySelector(".editor-post-publish-panel__header-publish-button button")||document.querySelector(".components-button.is-primary");if(!b)return "NO";b.scrollIntoView({block:"center"});var q=b.getBoundingClientRect();return JSON.stringify({x:Math.round(q.x+q.width/2),y:Math.round(q.y+q.height/2),t:(b.innerText||"").slice(0,30)});})()', 10000);
    console.log('pub2btn:', pub2);
    if (pub2 !== 'NO' && pub2 !== 'TIMEOUT') {
      const q = JSON.parse(pub2);
      await clickXY(q.x, q.y);
      await sleep(15000);
    }
  }
}
// 4) 验证
const fin = await c.evalT('(function(){var m=document.body.innerText.match(/(is now live|published)/i);var a=[...document.querySelectorAll("a")].find(function(x){return /leoxmseo2\\.wordpress\\.com\\//.test(x.href)&&/20\\d\\d\\//.test(x.href)});return JSON.stringify({live:m?m[0]:"none", url:a?a.href:"none"});})()', 12000);
console.log('fin:', fin);
process.exit(0);
