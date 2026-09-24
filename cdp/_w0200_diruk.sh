#!/bin/bash
# win0200 dir.uk.com WSN suggest.php 复放: $1=task $2=cat $3=url $4=title $5=desc $6=email
# 直连优先、失败代理兜底=出口IP总政策 2026-09-16（curl-df: 直连失败自动 -x 127.0.0.1:5780 重试）

T=$1; CD=/d/Github/backlink_skills/cdp; JAR=$CD/_w0200_diruk_$T.jar
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/153.0.0.0"
curl-df -s -m 20 -L -c $JAR -b $JAR -A "$UA" "https://www.dir.uk.com/suggest.php?action=addlink" -o $CD/_w0200_diruk_${T}_form.html
node -e "
const fs=require('fs');
const h=fs.readFileSync('D:/Github/backlink_skills/cdp/_w0200_diruk_${T}_form.html','utf8');
const m=h.match(/uppercase letters in the following word:\s*([A-Za-z]+)/);
if(!m){console.log('NO_CHALLENGE');process.exit(1);}
const ans=[...m[1]].filter(c=>/[A-Z]/.test(c)).join('');
const gid=h.match(/name=\"challengeid\" value=\"([^\"]*)\"/)[1];
console.log(ans+' '+gid);
" > $CD/_w0200_diruk_${T}_ans.txt
read ANS GID < $CD/_w0200_diruk_${T}_ans.txt
echo "t$T challenge=$ANS chid=$GID cat=$2"
[ -z "$ANS" ] && exit 1
PASS="Xx@Diruk26!Xm"
curl-df -s -m 25 -b $JAR -c $JAR -A "$UA" -H "Referer: https://www.dir.uk.com/suggest.php?action=addlink" \
  -F "catid=$2" -F "type=regular" -F "url=$3" -F "title=$4" -F "description=$5" \
  -F "email=$6" -F "name=leoxm" -F "password=$PASS" \
  -F "challengeanswer=$ANS" -F "challengeid=$GID" \
  -F "stepvars=YTowOnt9" -F "isalbum=0" -F "customwrapper={CUSTOMWRAPPER}" -F "redirectto={REDIRECTTO}" \
  -F "currenttemplatename=templates/simplicity/suggestlink.tpl" -F "maxdesclen=3000" \
  -F "theurl=" -F "stopbrowserautofill=" -F "processform=1" \
  "https://www.dir.uk.com/suggest.php?action=addlink&filled=1" -o $CD/_w0200_diruk_${T}_resp.html -w "http=%{http_code} size=%{size_download}\n"
grep -oE "The listing details have [^<]{0,60}|already (exists|in|been)[^<]{0,50}|[Ee]rror[^<]{0,60}|challenge[^<]{0,60}" $CD/_w0200_diruk_${T}_resp.html | head -3
