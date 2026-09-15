// reg0000: Reddit step1v2 — 穿透shadowRoot聚焦真实input再insertText
import { attach } from "./_reg0000_attach.mjs";
const c = await attach(/reddit\.com\/register/);
// 查 shadow 结构
console.log("SHADOW:", await c.evalT(`(() => { const el = document.querySelector('#register-email'); if(!el||!el.shadowRoot) return 'NO_SHADOW'; const inp = el.shadowRoot.querySelector('input'); return inp ? JSON.stringify({tag: inp.tagName, type: inp.type, disabled: inp.disabled, rect: (r=>({x:r.x,y:r.y,w:r.width}))(inp.getBoundingClientRect())}) : 'NO_INPUT_IN_SHADOW, html='+el.shadowRoot.innerHTML.slice(0,200); })()`, 8000));
// 直接 focus 真实 input
await c.evalT(`(() => { const el = document.querySelector('#register-email'); const inp = el && el.shadowRoot && el.shadowRoot.querySelector('input'); if(inp){ inp.focus(); } return inp ? 'focused' : 'fail'; })()`, 6000);
await new Promise(rr => setTimeout(rr, 500));
await c.send("Input.insertText", { text: "reddit@92ng.com" });
await new Promise(rr => setTimeout(rr, 1000));
console.log("EMAIL_VAL:", await c.evalT(`(() => { const el = document.querySelector('#register-email'); const inp = el && el.shadowRoot && el.shadowRoot.querySelector('input'); return inp ? inp.value : 'noshadow'; })()`, 6000));
