// _reg0000_ukitF.mjs — ukit 灌养号文进主文本块 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const ARTICLE = `Welcome to House Plants, a small online home for everyone who loves living with greenery. Our shop brings together indoor plants from the best European and Asian nurseries, and this page is where we share what we know.

Our story began with a single pothos on a windowsill and grew into a passion for helping people build their own indoor garden. We believe that a plant is more than decoration: it is a quiet companion that purifies the air, softens a room, and rewards a little care with steady growth. Every plant in our catalogue is selected by hand, checked for health, and packed so that it arrives at your door ready to thrive.

Not sure where to start? Low-light favourites like pothos, snake plants, and ZZ plants forgive missed waterings and flourish in apartments. If you have bright windows, consider a fiddle leaf fig, a monstera, or a cluster of succulents. For flowering beauty, orchids and anthuriums bring colour that lasts for months. Each listing on our site includes simple care notes about light, water, and feeding, so even a complete beginner can succeed from day one.

Caring for plants should be joyful, not stressful. That is why we keep our guides short, practical, and honest. Learn when to water by touching the soil, repot in spring, and give every new plant a week to adjust before moving it again. Small habits like these turn a house into a living, breathing home.

Browse the collection, pick a plant that speaks to you, and start your own story today. Green living is not a trend — it is a way of making space feel alive, one leaf at a time.`;
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /constructor/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
// 定位并滚入视口
const pos = await c.evalT(`(() => {
  const s = [...document.querySelectorAll('span')].filter(el=>el.isContentEditable && el.textContent.length > 400)[0];
  if (!s) return 'notfound';
  s.scrollIntoView({block:'center'});
  const r = s.getBoundingClientRect();
  return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + Math.min(r.height/2, 200))});
})()`, 10000);
console.log('POS:', pos);
const {x, y} = JSON.parse(pos);
// 真实鼠标点击进入编辑
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x, y, button:'left', clickCount:1});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x, y, button:'left', clickCount:1});
await sleep(2500);
// 双击进入文本编辑
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x, y, button:'left', clickCount:2});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x, y, button:'left', clickCount:2});
await sleep(2000);
const st1 = await c.evalT(`(() => {
  const s = [...document.querySelectorAll('span')].filter(el=>el.isContentEditable && el.textContent.length > 400)[0];
  if (!s) return 'lost';
  const r = s.getBoundingClientRect();
  return JSON.stringify({editable: s.isContentEditable, focused: document.activeElement === s || s.contains(document.activeElement), x: Math.round(r.x), y: Math.round(r.y), len: s.textContent.length});
})()`, 8000);
console.log('STATE1:', st1);
// 全选后 insertText 替换
await c.send('Input.dispatchKeyEvent', {type:'keyDown', key:'a', code:'KeyA', windowsVirtualKeyCode:65, modifiers:2});
await c.send('Input.dispatchKeyEvent', {type:'keyUp', key:'a', code:'KeyA', windowsVirtualKeyCode:65, modifiers:2});
await sleep(500);
await c.send('Input.insertText', {text: ARTICLE});
await sleep(2000);
const st2 = await c.evalT(`(() => {
  const s = [...document.querySelectorAll('span')].filter(el=>el.isContentEditable && el.textContent.length > 400)[0];
  return s ? JSON.stringify({len: s.textContent.length, head: s.textContent.slice(0,60), ok: s.textContent.includes('Welcome to House Plants')}) : 'lost';
})()`, 8000);
console.log('STATE2:', st2);
const shot = await c.send('Page.captureScreenshot', {format:'jpeg', quality:60});
(await import('fs')).writeFileSync('_reg0000_ukit_after.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
