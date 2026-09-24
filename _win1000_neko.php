<?php
function fetch($url){
  $ch=curl_init($url);
  curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>true,CURLOPT_TIMEOUT=>25,CURLOPT_CONNECTTIMEOUT=>12,
    CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',CURLOPT_ENCODING=>'',CURLOPT_SSL_VERIFYPEER=>false]);
  $h=curl_exec($ch);$c=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);return [$c,(string)$h];
}
[$c,$h]=fetch('https://leoxm.nekoweb.org/cdn-cgi/content?id=yGrp4cEG7AFqWOAh8ZCIEwWhbSubUdk.cuvy3jwMBSI-1788401094.5572996-1.2.1.1-bKCDApSR7M0ChVyuIiSpqdMYXTPcklyId2pA5d6ZhA1etxO6XfBmwzPb44YFFaJS');
echo "neko-cdn\t$c\tlen=".strlen($h)."\tzakaihu=".(stripos($h,'zakaihu')!==false?'y':'n')."\tanchor=".(preg_match('/<a[^>]*href=["\'][^"\']*zakaihu\.com[^>]*>/i',$h)?'yes':'no')."\n";
echo substr($h,0,600),"\n";
