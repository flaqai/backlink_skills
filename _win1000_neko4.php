<?php
$apikey='81cee6d033045d5d827eb4e9f1053d8c32913b18a7bfe1c525cf43503738860e';
function neko($path,$apikey){
  $ch=curl_init('https://nekoweb.org/api/files/list?pathname='.urlencode($path));
  curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>20,
    CURLOPT_HTTPHEADER=>['Authorization:'.$apikey],CURLOPT_SSL_VERIFYPEER=>false]);
  $r=curl_exec($ch);$c=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);
  return [$c,(string)$r];
}
[$c,$r]=neko('/leoxm.nekoweb.org/',$apikey);
echo "LIST\t$c\n";
$j=json_decode($r,true);
if(is_array($j)){ foreach($j as $f){ echo (is_array($f)?($f['pathname']??json_encode($f)):$f),"\n"; } }
else echo substr($r,0,500),"\n";
