// 解码 WPOST 族混淆 captcha.js，找校验机制
import fs from 'fs';
const s = fs.readFileSync('C:/Users/Administrator/.zcode/cli/exec/sess_579bb6cd-8999-4158-ad90-1ffbc8c3cce2/call_1abaf5a6eee14f7687251ec8-stdout.log', 'utf8');
const dec = s.replace(/\\x([0-9a-fA-F]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
// 去掉 php 输出的前面 usage 部分
const start = dec.indexOf('var _0x');
const code = start >= 0 ? dec.slice(start) : dec;
fs.writeFileSync('D:/Github/backlink_skills/storage/tmp/_reg0000_captcha_decoded.js', code);
// 找关键 URL / 逻辑片段
const kws = ['img.php', 'check.php', 'md5(', 'ajax', 'GET ', '/plugins/', 'captcha/', '.php'];
for (const kw of kws) {
  let idx = -1, n = 0;
  while ((idx = code.indexOf(kw, idx + 1)) >= 0 && n < 4) {
    console.log('--- [' + kw + ']:', code.slice(Math.max(0, idx - 100), idx + 140).replace(/\s+/g, ' '));
    n++;
  }
}
