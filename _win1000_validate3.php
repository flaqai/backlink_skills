<?php
// _win1000_validate3.php: WF首页探活 + 榜单平台注册入口探测
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
        $out[$i]=['code'=>curl_getinfo($c,CURLINFO_RESPONSE_CODE),'final'=>curl_getinfo($c,CURLINFO_EFFECTIVE_URL),'body'=>substr((string)curl_multi_getcontent($c),0,80000)];
        curl_multi_remove_handle($mh,$c); curl_close($c);
    }
    curl_multi_close($mh); return $out;
}
$wf = array_filter(array_map('trim', file('D:/Github/seoadminC/storage/_win1000_wfnew.txt')), fn($d)=>$d && $d!=='twitter.com' && $d!=='rant.li');
echo "== WF homepage ==\n";
$urls = array_map(fn($d)=>"https://{$d}/", array_values($wf));
$res = fetchMulti($urls);
foreach (array_values($wf) as $i=>$d) {
    $r=$res[$i]; $b=$r['body'];
    $wfp = (stripos($b,'writefreely')!==false) ? 1 : 0;
    $reg = (preg_match('~href="[^"]*/register~i',$b) || preg_match('~href="[^"]*/signup~i',$b)) ? 1 : 0;
    echo implode('|',[$d,$r['code'],"writefreely={$wfp}","reglink={$reg}"])."\n";
}
echo "== listicle platforms ==\n";
$plat = ['pen.io','postach.io','yola.com','dev.to','hubs.to'];
$urls=[]; foreach ($plat as $d) { $urls[]="https://{$d}/"; $urls[]="https://{$d}/register"; $urls[]="https://{$d}/signup"; }
$res = fetchMulti($urls);
foreach ($plat as $i=>$d) {
    $h=$res[$i*3]; $rg=$res[$i*3+1]; $sg=$res[$i*3+2];
    $pwH = preg_match('/type=["\']?password/i',$h['body'])?1:0;
    $pwR = preg_match('/type=["\']?password/i',$rg['body'])?1:0;
    $pwS = preg_match('/type=["\']?password/i',$sg['body'])?1:0;
    echo implode('|',[$d,"home={$h['code']}","register={$rg['code']}/pw{$pwR}","signup={$sg['code']}/pw{$pwS}","homepw={$pwH}"])."\n";
}
