<?php
$qm = curl_multi_init(); $tasks = [];
foreach (['dreamwidth.org','insanejournal.com','livejournal.com','blog.fc2.com'] as $i => $b) {
    $ch = curl_init("https://$b/");
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_FOLLOWLOCATION=>true, CURLOPT_TIMEOUT=>12, CURLOPT_CONNECTTIMEOUT=>8, CURLOPT_SSL_VERIFYPEER=>false, CURLOPT_ENCODING=>'', CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0']);
    curl_multi_add_handle($qm, $ch); $tasks[$i] = ['b'=>$b, 'ch'=>$ch];
}
do { $st = curl_multi_exec($qm, $running); if ($running) curl_multi_select($qm, 0.3); } while ($running && $st == CURLM_OK);
foreach ($tasks as $i => $t) {
    $code = curl_getinfo($t['ch'], CURLINFO_HTTP_CODE);
    $html = (string)curl_multi_getcontent($t['ch']);
    $sig = stripos($html,'create account')!==false || stripos($html,'create your')!==false || stripos($html,'sign up')!==false || stripos($html,'register')!==false;
    echo "  {$t['b']} | root={$code} 注册入口=" . ($sig ? 'Y' : '?') . " len=" . strlen($html) . "\n";
    curl_multi_remove_handle($qm, $t['ch']); curl_close($t['ch']);
}
curl_multi_close($qm);
