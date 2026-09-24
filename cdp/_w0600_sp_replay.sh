#!/bin/bash
# win0600 sites-plus复放: _w0600_sp_replay.sh <url> <title> <desc> <email> [cat]
# 直连优先、失败代理兜底=出口IP总政策 2026-09-16（curl-df: 直连失败自动 -x 127.0.0.1:5780 重试）

set -e
URL="$1"; TITLE="$2"; DESC="$3"; EMAIL="$4"; CAT="${5:-190}"
W=/d/Github/backlink_skills/cdp/_w0600_tmp
rm -f $W/sp_jar2.txt
curl-df -s -m 15 -c $W/sp_jar2.txt -b $W/sp_jar2.txt "https://www.sites-plus.com/submit?c=$CAT" -o $W/spA.html
# step2
curl-df -s -m 15 -c $W/sp_jar2.txt -b $W/sp_jar2.txt -d "formSubmitted=2&LINK_TYPE=9&choicemade=Go+To+Step+Three" "https://www.sites-plus.com/submit?c=$CAT" -o $W/spB.html
# step3 终提交
python - "$URL" "$TITLE" "$DESC" "$EMAIL" "$CAT" <<'PYEOF'
import re, sys, subprocess
url, title, desc, email, cat = sys.argv[1:6]
W='D:/Github/backlink_skills/cdp/_w0600_tmp'
h=open(W+'/spB.html',encoding='utf-8',errors='ignore').read()
assert 'name="TITLE"' in h, 'step2 did not advance: LEN='+str(len(h))
args=['curl','-s','-m','20','-c',W+'/sp_jar2.txt','-b',W+'/sp_jar2.txt','-w','\nHTTP=%{http_code}']
fields=[('formSubmitted','1'),('LINK_TYPE','9'),('TITLE',title),('URL',url),('CATEGORY_ID',cat),('DESCRIPTION',desc),('META_KEYWORDS','free online games,browser games'),('META_DESCRIPTION',desc[:150]),('OWNER_EMAIL',email),('AGREERULES','on'),('continue','Continue')]
for k,v in fields: args+=['--form-string',k+'='+v]
args+=['https://www.sites-plus.com/submit?c='+cat,'-o',W+'/spC.html']
subprocess.run(args,capture_output=True,text=True)
b=open(W+'/spC.html',encoding='utf-8',errors='ignore').read()
m=re.search(r'Link submitted[^<]{0,60}|already listed[^<]{0,40}|error[^<]{0,60}',b,re.I)
print('RESULT:', re.sub(r'\s+',' ',m.group(0))[:80] if m else ('NO-MSG LEN='+str(len(b))))
PYEOF
