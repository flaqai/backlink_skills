// reg0000: Reddit redo stageA — 新tab→register→填email→继续
import { CDP } from "./cdp.mjs";
const PORT = 9224;
await (await fetch(`http://127.0.0.1:${PORT}/json/new?https://www.reddit.com/register/`, { method: "PUT" })).json();
await new Promise(r => setTimeout(r, 9000));
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find(t => t.type === "page" && /reddit\.com/.test(t.url));
if (!page) { console.log("NO_TAB"); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener("open", res); setTimeout(() => rej(new Error("ws timeout")), 8000); });
const c = new CDP(ws);
await c.send("Page.enable");
try { await fetch(`http://127.0.0.1:${PORT}/json/activate/${page.id}`); } catch {}
console.log("TITLE:", await c.evalT("document.title", 12000));
// 填 email
const foc = await c.evalT(`(() => { const el = document.querySelector('#register-email'); const inp = el && el.shadowRoot && el.shadowRoot.querySelector('input'); if(inp){ inp.focus(); return 'ok'; } return 'noinp:' + (document.body.innerText||'').slice(0,80); })()`, 10000);
console.log("FOCUS:", foc);
if (!foc.startsWith("ok")) process.exit(1);
await c.send("Input.insertText", { text: "reddit@92ng.com" });
await new Promise(rr => setTimeout(rr, 800));
console.log("EMAIL_VAL:", await c.evalT(`(() => { const el = document.querySelector('#register-email'); const inp = el && el.shadowRoot && el.shadowRoot.querySelector('input'); return inp ? inp.value : '?'; })()`, 6000));
const r2 = await c.send("Runtime.evaluate", { expression: `(() => { const btn = [...document.querySelectorAll('button')].find(b => (b.innerText||'').trim()==='继续' && b.offsetParent !== null); if(!btn) return null; btn.scrollIntoView({block:'center'}); const rc = btn.getBoundingClientRect(); return JSON.stringify({x: rc.x + rc.width/2, y: rc.y + rc.height/2}); })()`, returnByValue: true });
if (!r2.result.value) { console.log("NO_BTN"); process.exit(1); }
const { x, y } = JSON.parse(r2.result.value);
await c.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
await c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
await new Promise(rr => setTimeout(rr, 4000));
console.log("BODY:", (await c.evalT('(document.body.innerText||"").replace(/\\n+/g," | ").slice(0,300)', 8000)));
