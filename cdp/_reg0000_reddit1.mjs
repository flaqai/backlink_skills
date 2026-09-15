// reg0000: Reddit 注册第一攻 — 打开注册页, dump 表单结构
import { CDP } from "./cdp.mjs";
const PORT = 9224;
await (await fetch(`http://127.0.0.1:${PORT}/json/new?https://www.reddit.com/register`, { method: "PUT" })).json();
await new Promise(r => setTimeout(r, 9000));
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find(t => t.type === "page" && /reddit\.com/.test(t.url));
if (!page) { console.log("NO_TAB"); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener("open", res); setTimeout(() => rej(new Error("ws timeout")), 8000); });
const c = new CDP(ws);
await c.send("Page.enable");
await c.send("Target.activateTarget", { targetId: page.id });
console.log("TITLE:", await c.evalT("document.title", 10000));
console.log("URL:", await c.evalT("location.href", 8000));
console.log("FIELDS:", await c.evalT(`JSON.stringify([...document.querySelectorAll("input,button")].map(el => ({tag: el.tagName, type: el.type||"", name: el.name||"", id: el.id||"", ph: (el.placeholder||"").slice(0,30), txt: (el.innerText||"").trim().slice(0,25), vis: el.offsetParent !== null})).filter(x => x.vis).slice(0,20))`, 10000));
console.log("BODY_HEAD:", (await c.evalT('(document.body.innerText||"").replace(/\\n+/g," | ").slice(0,400)', 8000)));
