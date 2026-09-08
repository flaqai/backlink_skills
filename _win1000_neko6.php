<?php
function fetch($url){
  $ch=curl_init($url);
  curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>true,CURLOPT_TIMEOUT=>20,
    CURLOPT_USERAGENT=>'Mozilla/5.0 Chrome/126',CURLOPT_SSL_VERIFYPEER=>false]);
  $h=curl_exec($ch);$c=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);return [$c,(string)$h];
}
[$c,$h]=fetch('https://leoxm.nekoweb.org/za-bank-account-guide.html');
$anch = preg_match('/<a[^>]*href=["\'][^"\']*zakaihu\.com[^>]*>/i',$h)?'yes':'no';
echo "996\t$c\tlen=".strlen($h)."\tzakaihu_mention=".(stripos($h,'zakaihu')!==false?'y':'n')."\tanchor=$anch\n";
if($anch==='yes'){
  $pdo = new PDO('mysql:host=127.0.0.1;dbname=seoadmin;charset=utf8mb4','root','root');
  $pdo->exec("UPDATE blog_writer_posts SET published_url='https://leoxm.nekoweb.org/za-bank-account-guide.html' WHERE id=996 AND (published_url IS NULL OR published_url='')");
  echo "996 backfilled\n";
}
