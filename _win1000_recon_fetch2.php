<?php
function fetch($url){
  $ch=curl_init($url);
  curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>true,CURLOPT_TIMEOUT=>25,CURLOPT_CONNECTTIMEOUT=>12,
    CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126',CURLOPT_ENCODING=>'',CURLOPT_SSL_VERIFYPEER=>false]);
  $h=curl_exec($ch);$c=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);return [$c,(string)$h];
}
$sources = [
  'fedidb_wf' => 'https://fedidb.org/software/writefreely',
  'fedidb_pl' => 'https://fedidb.org/software/plume',
  'uppercut' => 'https://uppercutlinks.com/free-blog-sites/',
  'techasoft' => 'https://www.techasoft.com/blog/2023/10/a-list-of-free-blogging-platforms-to-publish-your-content',
];
$out = [];
foreach($sources as $k=>$u){
  [$c,$h]=fetch($u);
  file_put_contents("D:/Github/backlink_skills/_win1000_src_$k.html", $h);
  $out[$k] = [$c, strlen($h)];
  echo "$k\t$c\t".strlen($h)."\n";
}
