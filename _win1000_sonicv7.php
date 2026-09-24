<?php
// _win1000_sonicv9.php: sonicrun t9 spravs 验证闭环 (win1000)
require __DIR__.'/../seoadminC/vendor/autoload.php';
$app = require __DIR__.'/../seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$j = ['e'=>'sr7b@92ng.com', 'c'=>'A4wkJh', 'site'=>'zakaihu.com'];
$jar = sys_get_temp_dir()."/w1000_sonic_t7.txt"; @unlink($jar);
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
$vurl = 'https://www.sonicrun.com/cgi-bin/v.cgi?e='.urlencode($j['e']).'&c='.$j['c'];
[$c1, $r1] = httpReq($jar, $vurl);
$t1 = html_entity_decode(strip_tags($r1 ?: ''));
echo "v.cgi GET $c1: ".substr(preg_replace('/\s+/',' ',trim($t1)),0,200)."\n";
if (!preg_match('/verify|add your site|confirm/i', $t1)) { echo "非验证页, 停\n"; exit(1); }
$forms = [];
if (preg_match_all('/<form[^>]*action="([^"]*)"[^>]*>(.*?)<\/form>/is', $r1, $fm, PREG_SET_ORDER)) { $forms = $fm; }
echo "表单数: ".count($forms)."\n";
if (!$forms) exit(1);
$f = $forms[0];
$action = $f[1];
if (!preg_match('/^https?:/', $action)) $action = 'https://www.sonicrun.com/cgi-bin/'.ltrim($action,'/');
$post = [];
if (preg_match_all('/<input[^>]*name="([^"]*)"[^>]*value="([^"]*)"/is', $f[2], $im, PREG_SET_ORDER)) {
    foreach ($im as $m) { $post[$m[1]] = $m[2]; echo "  field {$m[1]}={$m[2]}\n"; }
}
[$c2, $r2] = httpReq($jar, $action, $post, $vurl);
$t2 = html_entity_decode(strip_tags($r2 ?: ''));
echo "POST $c2: ".substr(preg_replace('/\s+/',' ',trim($t2)),0,250)."\n";
if (preg_match('/thank|received|added|approved|success|has been/i', $t2)) echo "FINAL_OK\n"; else echo "需人工复核\n";
