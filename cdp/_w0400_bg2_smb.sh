#!/bin/bash
# smblogsites 超长挑战等待版: wlogin后若见挑战, 直接在sign-in会话里等待放行再导航
# 直连优先、失败代理兜底=出口IP总政策 2026-09-16（curl-df: 直连失败自动 -x 127.0.0.1:5780 重试）

D=smblogsites.com; ACC=200313; BANK=278
S=/d/Github/seoadminC/storage; C=/d/Github/backlink_skills/cdp
PASS=$(/c/BtSoft/php/82/php.exe -r "require '$S/../vendor/autoload.php'; \$app=require '$S/../bootstrap/app.php'; \$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); echo Illuminate\Support\Facades\DB::table('blog_accounts')->where('id',$ACC)->value('password');")
node $C/_w0400_wlogin2.mjs $D leoxm26 "$PASS" 2>&1 | grep -E '"status"' | tail -1
node $C/_w0400_pub2.mjs $D 2>&1 | tee /tmp/_bg2_pub.log | grep -E "post-result"
PUBURL=$(grep -E '^\{"status"' /tmp/_bg2_pub.log | grep -oE '"url":"[^"]+"' | head -1 | sed 's/"url":"//;s/"$//')
[ -z "$PUBURL" ] && { echo "BG2-FAIL no url $(date +%H:%M:%S)"; exit 1; }
sleep 4
ANCHOR=$(curl-df -sL --max-time 30 "$PUBURL" | grep -cE 'href="https://generatorforhouse')
echo "anchor=$ANCHOR url=$PUBURL"
if [ "$ANCHOR" -ge 1 ]; then
  /c/BtSoft/php/82/php.exe $S/_w0400_upost.php $BANK "{\"blog_account_id\":$ACC}" > /dev/null
  /c/BtSoft/php/82/php.exe $S/_w0400_mark.php $BANK "$PUBURL"
  echo "BG2-OK"
fi
