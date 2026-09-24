<?php
// 247webdirectory task2 smogcheck 复放 (win1000)
require __DIR__.'/../seoadminC/vendor/autoload.php';
$app = require __DIR__.'/../seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$TID = 2;
$siteUrl = 'https://smogcheck-nearme.com';
$title = 'Smog Check Near Me - Stations, Prices and STAR Info';
$desc = 'Find smog check stations near you in California, with prices, STAR station info and passing tips. Covers what to expect during the test and common failure causes.';
$CAT = 4; // 待动态覆盖: Automotive
$jar = sys_get_temp_dir() . '/w1000_247.txt'; @unlink($jar);
function httpReq($jar, $url, $post = null, $ref = null) {
    $ch = curl_init($url);
    $opt = [CURLOPT_RETURNTRANSFER=>true, CURLOPT_TIMEOUT=>30, CURLOPT_SSL_VERIFYPEER=>false, CURLOPT_SSL_VERIFYHOST=>0,
        CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0 Safari/537.36', CURLOPT_FOLLOWLOCATION=>true, CURLOPT_MAXREDIRS=>4,
        CURLOPT_COOKIEJAR=>$jar, CURLOPT_COOKIEFILE=>$jar];
    if ($post !== null) { $opt[CURLOPT_POST]=true; $opt[CURLOPT_POSTFIELDS]=http_build_query($post); }
    if ($ref) $opt[CURLOPT_REFERER]=$ref;
    curl_setopt_array($ch, $opt); $res = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    return [$code, $res];
}
$base = 'https://www.247webdirectory.com';
[$c1, $r1] = httpReq($jar, "$base/submit");
if ($c1 != 200) { echo "GET /submit HTTP$c1\n"; exit(1); }
// 动态抓 Automotive 分类码
if (preg_match('/<option[^>]*value="(\d+)"[^>]*>\s*[^<]*Automotive/i', $r1, $mc)) { $CAT = $mc[1]; }
elseif (preg_match('/<option[^>]*value="(\d+)"[^>]*>[^<]*Auto/i', $r1, $mc)) { $CAT = $mc[1]; }
echo "categ_cd=$CAT\n";
$token = '';
if (preg_match('/name="__RequestVerificationToken"[^>]*value="([^"]+)"/', $r1, $m)) $token = $m[1];
elseif (preg_match('/value="([^"]+)"[^>]*name="__RequestVerificationToken"/', $r1, $m)) $token = $m[1];
if (!$token) { echo "无token\n"; exit(1); }
$cap = '';
if (preg_match('/Verification:\s*(\d+)\s*([+\-*x])\s*(\d+)\s*=/i', html_entity_decode($r1), $m)) {
    $a=(int)$m[1]; $op=$m[2]; $b=(int)$m[3];
    $cap = (string)($op==='+'?$a+$b:($op==='-'?$a-$b:$a*$b));
    echo "验证码: $a $op $b = $cap\n";
}
if ($cap==='') { echo "未解析到算术题\n"; exit(1); }
$post = ['__RequestVerificationToken'=>$token, 'website_confirm'=>'', 'site_title'=>$title, 'site_url'=>$siteUrl, 'site_desc'=>$desc, 'email_add'=>'w247s@92ng.com', 'categ_cd'=>$CAT, 'paid'=>'N', 'captcha_answer'=>$cap];
[$c2, $r2] = httpReq($jar, "$base/submit/save", $post, "$base/submit");
$t2 = html_entity_decode(strip_tags($r2 ?: ''));
$ok = false;
foreach (['thank','submitted','received','pending','success','approval','review'] as $sig) { if (stripos($t2,$sig)!==false) { $ok=true; break; } }
$err = '';
if (preg_match('/(invalid|error|incorrect|wrong|failed|try again|already)[^<]{0,80}/i', $t2, $m)) $err = trim($m[1]);
echo ($ok?"✓":"△")." POST$c2 ok=".($ok?'Y':'N')." err=$err\n";
echo '  resp: '.substr(preg_replace('/\s+/',' ',trim($t2)),0,300)."\n";
if ($ok) {
    \DB::table('backlink_publish_logs')->insert([
        'backlink_publish_task_id'=>$TID,
        'keyword_group_id'=>\DB::table('backlink_publish_tasks')->where('id',$TID)->value('keyword_group_id'),
        'backlink_id'=>\DB::table('backlinks')->where('domain','like','%247webdirectory%')->value('id'),
        'note'=>"win1000: 247webdirectory.com 复放 task2 smogcheck-nearme, ASP.NET token+明文算术码 curl 直投(paid=N Free档, categ$CAT) 成功回执✓",
        'url'=>"$base/submit", 'publish_type'=>'submitted', 'published_at'=>now(), 'status'=>'completed', 'created_at'=>now(), 'updated_at'=>now(),
    ]);
    echo "  ↳ 已回写 completed\n";
}
