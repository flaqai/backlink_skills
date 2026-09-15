// reg0000: Reddit 深挖 — 全量 input 扫描(含 shadow DOM 与不可见)
import { attach } from "./_reg0000_attach.mjs";
const c = await attach(/reddit\.com\/register/);
console.log("ALL_INPUTS:", await c.evalT(`JSON.stringify([...document.querySelectorAll("input")].map(el => ({type: el.type, name: el.name||"", id: el.id||"", ph: (el.placeholder||"").slice(0,30), vis: el.offsetParent !== null, rect: (r=>({x:r.x,y:r.y,w:r.width,h:r.height}))(el.getBoundingClientRect())})).slice(0,15))`, 10000));
console.log("CUSTOM_TAGS:", await c.evalT(`JSON.stringify([...document.querySelectorAll("faceplate-input,shreddit-input,faceplate-text-input,[autocomplete]")].map(el => ({tag: el.tagName.toLowerCase(), attr_autocomplete: el.getAttribute("autocomplete"), name: el.name||"", html: el.outerHTML.slice(0,150)})).slice(0,10))`, 10000));
