<?php
function fetch($url){
  $ch = curl_init($url);
  curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>true,CURLOPT_TIMEOUT=>25,CURLOPT_CONNECTTIMEOUT=>12,
    CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    CURLOPT_ENCODING=>'',CURLOPT_SSL_VERIFYPEER=>false]);
  $html=curl_exec($ch);$code=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);
  return [$code,(string)$html];
}
// 155 slug 直连
[$c,$h]=fetch('https://leoxm.journoportfolio.com/articles/a-student-ai-stack-on-a-budget-what-to-actually-pay-for/');
echo "155\t$c\tlen=".strlen($h)."\tmention_aitoolsdir=".(stripos($h,'aitoolsdirectory')!==false?'y':'n')."\tanchor=";
echo (preg_match('/<a[^>]*href=["\'][^"\']*aitoolsdirectory\.vip[^>]*>/i',$h)?'yes':'no')."\n";
// 997 写实核查:锚链
[$c7,$h7]=fetch('https://write.as/leoxm/how-to-size-a-home-generator-without-overspending');
echo "997\t$c7\tanchor_gfh=".(preg_match('/<a[^>]*href=["\'][^"\']*generatorforhouse\.org[^>]*>/i',$h7)?'yes':'no')."\tno_anchor_mention=".(stripos($h7,'generatorforhouse')!==false?'y':'n')."\n";
// 998 写实核查:锚链
[$c8,$h8]=fetch('https://leoxm.journoportfolio.com/articles/smog-check-preparation-a-first-timers-checklist/');
echo "998\t$c8\tanchor_smog=".(preg_match('/<a[^>]*href=["\'][^"\']*smogcheck-nearme\.com[^>]*>/i',$h8)?'yes':'no')."\tlen=".strlen($h8)."\n";
// nekoweb 站内找 zakaihu: 抓主页找内链
[$cn,$hn]=fetch('https://leoxm.nekoweb.org/');
preg_match_all('/href=["\']([^"\']+)["\']/i',$hn,$mn);
$links=array_unique($mn[1]);
echo "NEKO\t$cn\tlinks=".count($links)."\n";
foreach($links as $u){ if(stripos($u,'neko')===false || stripos($u,'.nekoweb.org')!==false) echo "  $u\n"; }
