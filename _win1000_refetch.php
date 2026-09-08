<?php
// 复核：exblog带全headers重试；wordpress/paper.wf再抓全文找url；列表页找996/997/998
function fetch($url, $extra=[]){
  $h = ['Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8','Accept-Language: en-US,en;q=0.9,ja;q=0.8','Upgrade-Insecure-Requests: 1','Sec-Fetch-Dest: document','Sec-Fetch-Mode: navigate','Sec-Fetch-Site: none','Sec-Fetch-User: ?1'];
  $ch = curl_init($url);
  curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>true,CURLOPT_TIMEOUT=>25,CURLOPT_CONNECTTIMEOUT=>12,
    CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    CURLOPT_HTTPHEADER=>$h, CURLOPT_ENCODING=>'', CURLOPT_SSL_VERIFYPEER=>false]);
  $html = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
  return [$code,(string)$html];
}
// 1. exblog 3条
foreach(['1009'=>'https://leoxm.exblog.jp/31048057/','1011'=>'https://leoxm.exblog.jp/31048063/','1012'=>'https://leoxm.exblog.jp/31048112/'] as $id=>$u){
  [$code,$html]=fetch($u);
  $has = stripos($html,'aiimageeditorfree.com');
  $anch = 'no';
  if($has!==false && preg_match('/<a[^>]*href=["\'][^"\']*aiimageeditorfree\.com[^>]*>/i',$html)) $anch='yes';
  echo "$id\t$code\thost=".(strlen($html)>1000?'y':'n')."\tmention=".($has!==false?'y':'n')."\tanchor=$anch\n";
}
// 2. wordpress 1002 全文
[$c2,$h2]=fetch('https://leoxmseo2.wordpress.com/2026/09/02/generator-fuel-types-compared-propane-natural-gas-gasoline-and-solar/');
echo "1002\t$c2\tlen=".strlen($h2)."\tmention=".(stripos($h2,'generatorforhouse')!==false?'y':'n')."\tanchor=";
echo (preg_match('/<a[^>]*href=["\'][^"\']*generatorforhouse\.org[^>]*>/i',$h2)?'yes':'no')."\n";
// 3. ugo.florist 1006
[$c6,$h6]=fetch('https://lpo4mwr00.ugo.florist');
echo "1006\t$c6\tlen=".strlen($h6)."\tanchor=".(preg_match('/<a[^>]*href=["\'][^"\']*ugo\.florist[^>]*>/i',$h6)?'self-a':'no')."\ttitle=";
preg_match('/<title>([^<]*)<\/title>/i',$h6,$t); echo ($t[1]??'')."\n";
// 4. write.as/leoxm 列表找 997 (generatorforhouse)
[$c4,$h4]=fetch('https://write.as/leoxm/');
preg_match_all('/href=["\'](https:\/\/write\.as\/leoxm\/[^"\']+)["\'][^>]*>([^<]{0,80})/i',$h4,$mm);
echo "WALIST\t$c4\n";
foreach($mm[1] as $i=>$u){ echo "  $u\t".trim($mm[2][$i])."\n"; }
// 5. journoportfolio articles 列表找 998 (smogcheck) + 155 复核
[$c5,$h5]=fetch('https://leoxm.journoportfolio.com/');
preg_match_all('/<a[^>]*href=["\']([^"\']*\/articles\/[^"\']*)["\'][^>]*>(.*?)<\/a>/is',$h5,$m5);
echo "JPLIST\t$c5\n";
foreach($m5[1] as $i=>$u){ echo "  $u\t".trim(preg_replace('/\s+/u',' ',strip_tags($m5[2][$i])))."\n"; }
