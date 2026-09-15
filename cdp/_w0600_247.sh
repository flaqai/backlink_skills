#!/bin/bash
# win0600 247webdirectory首投: GET取token+算术码 → POST /submit/save
# 用法: _w0600_247.sh <site_url> <title> <desc> <email> [categ_cd]
# VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
PXG="-x http://127.0.0.1:5780"; (exec 3<>/dev/tcp/127.0.0.1/5780) 2>/dev/null || PXG=""

set -e
URL="$1"; TITLE="$2"; DESC="$3"; EMAIL="$4"; CAT="${5:-178}"
W=/d/Github/backlink_skills/cdp/_w0600_tmp
PW=D:/Github/backlink_skills/cdp/_w0600_tmp
mkdir -p $W
curl $PXG -s -m 20 -c $W/jar.txt -b $W/jar.txt -L "https://www.247webdirectory.com/submit" -o $W/page.html
python - "$URL" "$TITLE" "$DESC" "$EMAIL" "$CAT" <<'PYEOF'
import re, sys, subprocess
url, title, desc, email, cat = sys.argv[1:6]
W = 'D:/Github/backlink_skills/cdp/_w0600_tmp'
h = open(W+'/page.html', encoding='utf-8', errors='ignore').read()
tok = re.search(r'name="__RequestVerificationToken"[^>]*value="([^"]+)"', h)
mathq = re.search(r'Verification:\s*(\d+)\s*(?:\+|&#x2B;)\s*(\d+)\s*=', h)
assert tok, 'no token'
assert mathq, 'no math question. ctx: ' + re.sub(r'\s+',' ',h[h.find('Verification')-50:h.find('Verification')+150] if 'Verification' in h else h[:200])
ans = str(int(mathq.group(1)) + int(mathq.group(2)))
print('math:', mathq.group(1), '+', mathq.group(2), '=', ans, '| token:', tok.group(1)[:20]+'...')
def run(args):
    r = subprocess.run(['curl','-s','-m','30','-c',W+'/jar.txt','-b',W+'/jar.txt','-w','\nHTTP=%{http_code} URL=%{url_effective}']+args, capture_output=True, text=True)
    return r.stdout
args = ['https://www.247webdirectory.com/submit/save','-o',W+'/resp.html']
for k,v in [('__RequestVerificationToken',tok.group(1)),('website_confirm',''),('site_title',title),('site_url',url),('site_desc',desc),('email_add',email),('categ_cd',cat),('paid','N'),('captcha_answer',ans)]:
    args += ['--form-string', k+'='+v]
out = run(args)
print('POST:', out[-200:])
body = open(W+'/resp.html', encoding='utf-8', errors='ignore').read()
for pat in ['thank','success','received','will be reviewed','error','invalid','captcha','already','verify']:
    for m in list(re.finditer(r'[^>]{0,80}'+pat+r'[^<]{0,80}', body, re.I))[:2]:
        print('HIT['+pat+']:', re.sub(r'\s+',' ',m.group(0)).strip()[:130])
t = re.search(r'<title>([^<]*)</title>', body)
print('TITLE:', t.group(1) if t else 'n/a', '| LEN:', len(body))
PYEOF
