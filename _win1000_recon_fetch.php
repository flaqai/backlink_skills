<?php
function fetch($url, $hdr=[]){
  $ch=curl_init($url);
  curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>true,CURLOPT_TIMEOUT=>25,CURLOPT_CONNECTTIMEOUT=>12,
    CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126',CURLOPT_ENCODING=>'',CURLOPT_SSL_VERIFYPEER=>false,CURLOPT_HTTPHEADER=>$hdr]);
  $h=curl_exec($ch);$c=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);return [$c,(string)$h];
}
// 1. WriteFreely 实例表
[$c1,$h1]=fetch('https://writefreely.org/instances');
file_put_contents('D:/Github/backlink_skills/_win1000_wf.html',$h1);
echo "WF=$c1 len=".strlen($h1)."\n";
// 2. the-federation writefreely+plume
[$c2,$h2]=fetch('https://the-federation.info/api/v1/project/writefreely');
echo "FED-WF=$c2 len=".strlen($h2)."\n";
file_put_contents('D:/Github/backlink_skills/_win1000_fedwf.json',$h2);
[$c3,$h3]=fetch('https://the-federation.info/api/v1/project/plume');
echo "FED-PL=$c3 len=".strlen($h3)."\n";
file_put_contents('D:/Github/backlink_skills/_win1000_fedpl.json',$h3);
// 3. phpLD showcase
[$c4,$h4]=fetch('https://www.phplinkdirectory.com/showcase.php');
echo "PHPLD=$c4 len=".strlen($h4)."\n";
file_put_contents('D:/Github/backlink_skills/_win1000_phpld.html',$h4);
if($c4!=200){ [$c4b,$h4b]=fetch('https://www.phplinkdirectory.com/'); echo "PHPLD-ROOT=$c4b len=".strlen($h4b)."\n"; file_put_contents('D:/Github/backlink_skills/_win1000_phpld.html',$h4b); }
