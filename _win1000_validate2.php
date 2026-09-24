<?php
// _win1000_validate2.php: WF实例/register探活 + 目录第二波
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
        $out[$i]=['code'=>curl_getinfo($c,CURLINFO_RESPONSE_CODE),'final'=>curl_getinfo($c,CURLINFO_EFFECTIVE_URL),'body'=>substr((string)curl_multi_getcontent($c),0,60000)];
        curl_multi_remove_handle($mh,$c); curl_close($c);
    }
    curl_multi_close($mh); return $out;
}

echo "== WF instances /register ==\n";
$wf = array_filter(array_map('trim', file('D:/Github/seoadminC/storage/_win1000_wfnew.txt')), fn($d)=>$d && $d!=='twitter.com');
$urls=[]; 
foreach ($wf as $d) { $urls[] = "https://{$d}/register"; }
$res = fetchMulti($urls);
foreach (array_values($wf) as $i => $d) {
    $r = $res[$i]; $b = $r['body'];
    $pw = preg_match('/type=["\']?password/i', $b) ? 1 : 0;
    $form = preg_match('/<form/i', $b) ? 1 : 0;
    $invite = (stripos($b,'invite') !== false) ? 1 : 0;
    echo implode('|',[$d,$r['code'],$form."/pw={$pw}","invite={$invite}"])."\n";
}

echo "== DIR wave2 ==\n";
$w2 = ['pakranks.com','ezistreet.com','freeadstime.org','seodirectoryonline.org','canopusdirectory.com','taurusdirectory.com','pakadtrader.com','wlddirectory.com','worldweb-directory.com','seorange.com','urltrawler.com','stare-at.com','ayroo.com','caida.eu','blahoo.net','kawakaa.info','goworkable.com','gtglax.net','somuch.com','entireweb.com','sonicrun.com','hotvsnot.com','onemilliondirectory.com','freeadstime.org','callyourcountry.com'];
$urls=[];
foreach ($w2 as $d) $urls[] = "https://{$d}/";
$res = fetchMulti($urls);
foreach ($w2 as $i => $d) {
    $r=$res[$i]; $b=$r['body'];
    $inputs = preg_match_all('/<input/i',$b); $forms = preg_match_all('/<form/i',$b);
    $hint=''; foreach (['submit','add-url','addurl','suggest','add.php','submit.php'] as $p) if (stripos($b,$p)!==false) { $hint=$p; break; }
    echo implode('|',[$d,$r['code'],substr($r['final'],0,55),$forms.'/'.$inputs,$hint])."\n";
}
