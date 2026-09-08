<?php
$apikey='81cee6d033045d5d827eb4e9f1053d8c32913b18a7bfe1c525cf43503738860e';
function neko($path,$apikey){
  $ch=curl_init('https://nekoweb.org/api/files/list?pathname='.urlencode($path));
  curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>20,
    CURLOPT_HTTPHEADER=>['Authorization:'.$apikey],CURLOPT_SSL_VERIFYPEER=>false]);
  $r=curl_exec($ch);$c=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);
  return [$c,(string)$r];
}
foreach(['/','/leoxm.nekoweb.org','/leoxm.nekoweb.org/'] as $p){
  [$c,$r]=neko($p,$apikey);
  echo "PATH $p => $c\n";
  $j=json_decode($r,true);
  if(is_array($j)){
    foreach($j as $f){
      if(is_array($f)) echo "  ", ($f['type']??'?'), " ", ($f['pathname']??($f['name']??json_encode($f))), "\n";
      else echo "  ", $f, "\n";
    }
    break;
  } else echo "  ", substr($r,0,200), "\n";
}
