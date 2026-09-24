import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const log = (s) => fs.writeSync(1, s + '\n');
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('creatorlink'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error('ws超时')), 8000); });
const c = new CDP(ws);
await c.send('Page.enable');
const click = async (x, y, wait = 2000) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(wait);
};
// 点닫기(191,143) 关引导
await click(191, 143, 1500);
// 引导还在吗
const g1 = await c.evalT(`document.body.innerText.includes('메뉴를 추가')`, 6000);
log('GUIDE STILL: ' + g1);
if (g1 === true) { await click(246, 143, 1500); } // 다음不行就点X(141,383)
// 再点메뉴/페이지 설정 (133,18)
await click(133, 18, 3000);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000_cl_menupanel2.png', Buffer.from(shot.data, 'base64'));
log('SHOT DONE');
