// reg0000: Patch 注册侦察 — 开/signup, dump SPA 交互元素
import { CDP } from "./cdp.mjs";
const PORT = 9224;
await (await fetch(`http://127.0.0.1:${PORT}/json/new?https://patch.com/signup`, { method: "PUT" })).json();
await new Promise(r => setTimeout(r, 8000));
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find(t => t.type === "page" && /patch\.com/.test(t.url));
if (!page) { console.log("NO_TAB"); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener("open", res); setTimeout(() => rej(new Error("ws timeout")), 8000); });
const c = new CDP(ws);
await c.send("Page.enable");
try { await fetch(`http://127.0.0.1:${PORT}/json/activate/${page.id}`); } catch {}
console.log("TITLE:", await c.evalT("document.title", 12000));
console.log("URL:", await c.evalT("location.href", 6000));
console.log("INPUTS:", await c.evalT(`JSON.stringify([...document.querySelectorAll("input,button,a[href*=signup],a[href*=join]")].map(el => ({tag: el.tagName, type: el.type||"", name: el.name||"", ph: (el.placeholder||"").slice(0,40), label: el.getAttribute("aria-label")||"", txt: (el.innerText||"").trim().slice(0,25), href: el.href? el.href.slice(0,50):"", vis: el.offsetParent !== null})).filter(x => x.vis).slice(0,25))`, 12000));
console.log("BODY_HEAD:", (await c.evalT('(document.body.innerText||"").replace(/\\n+/g," | ").slice(0,500)', 8000)));
