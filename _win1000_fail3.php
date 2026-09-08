<?php
// 抽查深挖: aiwebsitedirectory/madewithlaravel/anyfp 提交页有无真表单(邮箱型); bai.tools根路径找入口
function fetch($url){
  $ch=curl_init($url);
  curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>true,CURLOPT_TIMEOUT=>20,CURLOPT_CONNECTTIMEOUT=>10,
    CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126',CURLOPT_ENCODING=>'',CURLOPT_SSL_VERIFYPEER=>false]);
  $h=curl_exec($ch);$c=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);return [$c,(string)$h];
}
$checks=[
  ['aiwebsitedirectory','https://aiwebsitedirectory.com/submit'],
  ['madewithlaravel','https://madewithlaravel.com/submit'],
  ['anyfp','https://anyfp.com/submit'],
];
foreach($checks as [$name,$u]){
  [$c,$h]=fetch($u);
  $forms = preg_match_all('/<form/i',$h);
  $inputs = preg_match_all('/<input/i',$h);
  $email = stripos($h,'type="email"')!==false||stripos($h,"type='email'")!==false||stripos($h,'name="email"')!==false;
  $oauth = stripos($h,'oauth')!==false||stripos($h,'Sign in with Google')!==false;
  echo "$name\t$c\tforms=$forms\tinputs=$inputs\temail=".($email?'y':'n')."\toauthmention=".($oauth?'y':'n')."\tlen=".strlen($h)."\n";
}
