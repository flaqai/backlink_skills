#!/bin/bash
# 后台: smblogsites 挑战长等待→发布→核验→落库
# VPN代理优先、不通自动直连降级（注册发布分流铁律 2026-09-15）
PXG="-x http://127.0.0.1:5780"; (exec 3<>/dev/tcp/127.0.0.1/5780) 2>/dev/null || PXG=""

D=smblogsites.com; ACC=200313; BANK=278
S=/d/Github/seoadminC/storage; C=/d/Github/backlink_skills/cdp
PASS=$(/c/BtSoft/php/82/php.exe -r "require '$S/../vendor/autoload.php'; \$app=require '$S/../bootstrap/app.php'; \$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); echo Illuminate\Support\Facades\DB::table('blog_accounts')->where('id',$ACC)->value('password');")
echo "[$(date +%H:%M:%S)] relogin"
node $C/_w0400_wlogin2.mjs $D leoxm26 "$PASS" 2>&1 | grep -E "status|CHECK" | tail -2
echo "[$(date +%H:%M:%S)] export+publish"
$C/../../php/x 2>/dev/null
/c/BtSoft/php/82/php.exe $S/_w0400_export3.php 278 $D
node $C/_w0400_pub2.mjs $D 2>&1 | tee /tmp/_bg_smb_pub.log | grep -E "post-result"
PUBURL=$(grep -E '^\{"status"' /tmp/_bg_smb_pub.log | grep -oE '"url":"[^"]+"' | head -1 | sed 's/"url":"//;s/"$//')
[ -z "$PUBURL" ] && { echo "BG-FAIL no url"; exit 1; }
echo "[$(date +%H:%M:%S)] url=$PUBURL live-check"
sleep 4
ANCHOR=$(curl $PXG -sL --max-time 30 "$PUBURL" | grep -cE 'href="https://generatorforhouse')
echo "anchor_hits=$ANCHOR"
if [ "$ANCHOR" -ge 1 ]; then
  /c/BtSoft/php/82/php.exe $S/_w0400_upost.php $BANK "{\"blog_account_id\":$ACC}"
  /c/BtSoft/php/82/php.exe $S/_w0400_mark.php $BANK "$PUBURL"
  echo "BG-OK $PUBURL"
else
  echo "BG-FAIL no anchor"
fi
