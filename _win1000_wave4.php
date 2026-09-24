<?php
// _win1000_wave4.php: 强目录提交入口页深挖(字段数+验证码指纹)
$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
function fetchMulti(array $urls): array {
    $mh = curl_multi_init(); $ch = [];
    foreach ($urls as $i => $u) {
        $c = curl_init($u);
        curl_setopt_array($c, [CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>true,CURLOPT_MAXREDIRS=>4,CURLOPT_TIMEOUT=>14,CURLOPT_CONNECTTIMEOUT=>9,CURLOPT_USERAGENT=>$GLOBALS['UA'],CURLOPT_SSL_VERIFYPEER=>false,CURLOPT_SSL_VERIFYHOST=>0,CURLOPT_ENCODING=>'']);
        curl_multi_add_handle($mh,$c); $ch[$i]=$c;
    }
    do { $st=curl_multi_exec($mh,$active); if($active) curl_multi_select($mh,0.3); } while($active && $st===CURLM_OK);
    $out=[];
    foreach ($ch as $i=>$c) {
        $out[$i]=['code'=>curl_getinfo($c,CURLINFO_RESPONSE_CODE),'final'=>curl_getinfo($c,CURLINFO_EFFECTIVE_URL),'body'=>substr((string)curl_multi_getcontent($c),0,150000)];
        curl_multi_remove_handle($mh,$c); curl_close($c);
    }
    curl_multi_close($mh); return $out;
}
$strong = ['01webdirectory.com','zipleaf.com','bizbangboom.com','freeprwebdirectory.com','sonicrun.com','somuch.com','sites-plus.com','ntdirectory.com','ringmybiz.com','seodeeplinks.net','techpluto.com','fivetaco.com','bizidex.com','bizpages.org','elf08.com','comoestamos.com','piseries.com','listedai.co','goworkable.com','ezistreet.com','caida.eu','gtglax.net','onemilliondirectory.com','ayroo.com'];
// 第一波: 首页找submit入口链接
$urls = array_map(fn($d)=>"https://{$d}/", $strong);
$res = fetchMulti($urls);
$entries = [];
foreach ($strong as $i => $d) {
    $b = $res[$i]['body'];
    $entry = '';
    if (preg_match('~href="(https?://[^"]*(?:submit|add[_-]?url|suggest|add\.php|addurl)[^"]*)"~i', $b, $m)) $entry = $m[1];
    elseif (preg_match('~href="(/(?:submit|add[_-]?url|suggest)[^"]*)"~i', $b, $m)) $entry = 'https://' . $d . $m[1];
    elseif (preg_match('~href="((?:submit|add)[^"]*)"~i', $b, $m)) $entry = 'https://' . $d . '/' . $m[1];
    $entries[$d] = $entry ?: ('https://' . $d . '/submit.php');
}
// 第二波: 抓入口页
$urls = array_values($entries);
$res2 = fetchMulti($urls);
foreach ($entries as $d => $u) {
    $r = $res2[array_search($u, $urls, true)] ?? null;
    if (!$r) { echo "$d|ENTRY_FETCH_FAIL|$u\n"; continue; }
    $b = $r['body'];
    $inputs = preg_match_all('/<input/i', $b);
    $textarea = preg_match_all('/<textarea/i', $b);
    $select = preg_match_all('/<select/i', $b);
    $captcha = (preg_match('/captcha|recaptcha|secureimg|turnstile/i', $b)) ? 1 : 0;
    $emailF = (preg_match('/type=["\']?email|name=["\']?email/i', $b)) ? 1 : 0;
    echo implode('|', [$d, $r['code'], substr($u, 0, 55), "in={$inputs},ta={$textarea},sel={$select}", "captcha={$captcha}", "email={$emailF}"]) . "\n";
}
