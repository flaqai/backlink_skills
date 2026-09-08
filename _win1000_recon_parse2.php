<?php
// 从4个源提域名
$domains = [];
$rx = '/([a-z0-9][a-z0-9\-]{2,60}\.(?:com|net|org|io|blog|site|xyz|me|app|dev|club|community|zone|link|world|today|life|online|space|website|cc|info|biz|us|uk|ca|eu|de|fr|it|es|nl|se|fi|no|dk|pl|cz|pt|gr|ro|hu|art|ink|page|tech|store|press|write|note|news))\b/i';
foreach(['fedidb_wf','fedidb_pl','uppercut'] as $k){
  $h = file_get_contents("D:/Github/backlink_skills/_win1000_src_$k.html");
  $text = $k==='uppercut' ? $h : preg_replace('/<script.*?<\/script>/is','',$h);
  preg_match_all($rx, strip_tags($text), $m);
  $n=0;
  foreach($m[1] as $d){
    $d = strtolower(trim($d));
    if(strlen($d)<5) continue;
    if(preg_match('/(fedidb|google|facebook|twitter|github|mozilla|w3\.org|schema\.org|apple|microsoft|amazon|cloudflare|googleapis|gstatic|jquery|bootstrap|fontawesome)/i',$d)) continue;
    if(!isset($domains[$d])){ $domains[$d]=[]; }
    $domains[$d][] = $k;
    $n++;
  }
  echo "$k raw_hits=$n uniq_total=".count($domains)."\n";
}
// 过滤明显非站: 单标签公域后缀误伤(如 xxx.co.uk 已被rx限制)——保守再排一级常用词
$bad = ['example','yourdomain','domain','test','localhost','sentry','sentry-next','browser','image','img','static','cdn','assets','api','mail','web','http','https','www','support','docs','doc','blog2'];
$clean = [];
foreach($domains as $d=>$srcs){
  $label = explode('.', $d)[0];
  if(in_array($label, $bad)) continue;
  if(strpos($d,'fedidb')!==false) continue;
  $clean[$d] = array_values(array_unique($srcs));
}
echo "CLEAN=", count($clean), "\n";
file_put_contents('D:/Github/backlink_skills/_win1000_cleandomains.json', json_encode($clean));
$i=0;
foreach($clean as $d=>$srcs){ if($i++<50) echo $d, "\t", implode('+',$srcs), "\n"; }
