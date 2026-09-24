<?php
// 枚举 nekoweb 常见路径找 zakaihu 第2篇
$paths=['zakaihu.html','zakaihu','blog.html','blog/','blog/zakaihu.html','post.html','posts.html','2.html','post-2.html','articles.html','notes.html','journal.html','about.html','archive.html','page2.html','virtual-bank.html','za-bank.html'];
foreach($paths as $p){
  $u='https://leoxm.nekoweb.org/'.$p;
  $ch=curl_init($u);
  curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>true,CURLOPT_TIMEOUT=>15,CURLOPT_CONNECTTIMEOUT=>8,
    CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126',CURLOPT_SSL_VERIFYPEER=>false]);
  $h=curl_exec($ch);$c=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);
  $hit = ($c==200 && stripos($h,'zakaihu')!==false);
  echo $p,"\t$c".($hit?"\t★ZAKAIHU-HIT":"")."\n";
  if($hit){
    preg_match('/<a[^>]*href=["\'][^"\']*zakaihu\.com[^>]*>/i',$h,$mm);
    echo "  anchor=", ($mm?'yes':'no'), "\n";
  }
}
