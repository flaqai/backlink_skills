#!/bin/bash
# win0600 101bookmarks PhaseA: 取表单+验证码图(4x放大)
# VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
PXG="-x http://127.0.0.1:5780"; (exec 3<>/dev/tcp/127.0.0.1/5780) 2>/dev/null || PXG=""

W=/d/Github/backlink_skills/cdp/_w0600_tmp
PW=D:/Github/backlink_skills/cdp/_w0600_tmp
rm -f $W/b101_jar.txt
curl $PXG -s -m 20 -c $W/b101_jar.txt -b $W/b101_jar.txt "http://www.101bookmarks.com/submit.php?c=4" -o $W/b101_form.html
python - <<'PYEOF'
import re, subprocess
W='D:/Github/backlink_skills/cdp/_w0600_tmp'
h=open(W+'/b101_form.html',encoding='utf-8',errors='ignore').read()
ih=re.search(r'name="IMAGEHASH"[^>]*value="([^"]+)"',h)
assert ih, 'no IMAGEHASH: '+re.sub(r'\s+',' ',h[:300])
hash=ih.group(1)
print('IMAGEHASH:', hash)
subprocess.run(['curl','-s','-m','20','-c',W+'/b101_jar.txt','-b',W+'/b101_jar.txt',
  'http://www.101bookmarks.com/captcha.php?imagehash='+hash,'-o',W+'/b101_captcha.png'])
# PIL 4x NEAREST 放大
from PIL import Image
im=Image.open(W+'/b101_captcha.png').convert('RGB')
print('captcha size:', im.size)
im.resize((im.width*4, im.height*4), Image.NEAREST).save(W+'/b101_captcha_big.png')
print('saved big captcha')
PYEOF