<?php
// 剥www重去重 + 批量curl验活(首页+提交入口探测+OAuth检测)
$pdo = new PDO('mysql:host=127.0.0.1;dbname=seoadmin;charset=utf8mb4','root','root');
$known = [];
foreach($pdo->query("SELECT DISTINCT domain FROM blog_accounts WHERE domain IS NOT NULL AND domain!=''") as $r){ $h=strtolower(trim($r['domain'])); $h=preg_replace('/^www\./','',$h); $known[$h]=1; }
foreach($pdo->query("SELECT DISTINCT url FROM backlinks WHERE url IS NOT NULL AND url!=''") as $r){
  $h = strtolower(parse_url($r['url'], PHP_URL_HOST) ?: ''); $h = preg_replace('/^www\./','',$h); if($h) $known[$h]=1;
}
foreach(glob('C:/Users/Administrator/.zcode/skills/seoadmin-skill/sync-data/new-sources-*.md') as $f){
  preg_match_all('/([a-z0-9][a-z0-9\-]{2,60}\.[a-z]{2,})/i', file_get_contents($f), $mm);
  foreach($mm[1] as $d){ $d=strtolower($d); $d=preg_replace('/^www\./','',$d); $known[$d]=1; }
}
foreach(glob('C:/Users/Administrator/.zcode/skills/seoadmin-skill/sync-data/blog-platform-sources-*.md') as $f){
  preg_match_all('/([a-z0-9][a-z0-9\-]{2,60}\.[a-z]{2,})/i', file_get_contents($f), $mm);
  foreach($mm[1] as $d){ $d=strtolower($d); $d=preg_replace('/^www\./','',$d); $known[$d]=1; }
}
$md = file_get_contents('D:/Github/backlink_skills/_win1000_bofai.md');
preg_match_all('/https?:\/\/([a-z0-9][a-z0-9\-\.]*\.[a-z]{2,})/i', $md, $m);
$skip = ['topaidirectories','altern','github','raw\.githubusercontent','ghfast','img','shields','s3','amazonaws','creativecommons','opensource'];
$cands = [];
foreach($m[1] as $d){
  $d = strtolower(preg_replace('/^www\./','',rtrim($d,'.')));
  $label = explode('.',$d)[0];
  if(preg_match('/^(topaidirectories|altern|github|shields|s3|amazonaws|creativecommons|opensource|img)$/', $label)) continue;
  if(strpos($d,'github')!==false || strpos($d,'shields')!==false) continue;
  if(strlen($d)<6) continue;
  $cands[$d]=1;
}
$new = [];
foreach(array_keys($cands) as $d){ if(!isset($known[$d])) $new[]=$d; }
echo "NEW_AFTER_WWWSTRIP=", count($new), "\n";
// 并发验活
$mh = curl_multi_init();
$handles = [];
foreach($new as $i=>$d){
  $ch = curl_init('https://'.$d.'/');
  curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>true,CURLOPT_TIMEOUT=>18,CURLOPT_CONNECTTIMEOUT=>9,
    CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126',CURLOPT_ENCODING=>'',CURLOPT_SSL_VERIFYPEER=>false]);
  curl_multi_add_handle($mh,$ch);
  $handles[$d] = $ch;
}
do { curl_multi_exec($mh,$running); curl_multi_select($mh,1); } while($running>0);
$results = [];
foreach($handles as $d=>$ch){
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $html = (string)curl_multi_getcontent($ch);
  curl_multi_remove_handle($mh,$ch); curl_close($ch);
  $hasForm = preg_match_all('/<form/i',$html);
  $hasEmail = stripos($html,'name="email"')!==false||stripos($html,"name='email'")!==false||stripos($html,'type="email"')!==false||stripos($html,'type=list')!==false;
  $oauth = stripos($html,'Sign in with Google')!==false||stripos($html,'oauth/authorize')!==false||stripos($html,'accounts.google.com')!==false;
  $submitHit = preg_match('/(submit|add[-_]?(tool|app|listing)|list[-_]?your)/i', $html) ? 1 : 0;
  $results[$d] = [$code, strlen($html), $hasForm, $submitHit, $oauth];
  echo $d, "\t$code\tlen=".strlen($html)."\tform=$hasForm\tsubmitkw=$submitHit\toauth=".($oauth?'y':'n')."\n";
}
file_put_contents('D:/Github/backlink_skills/_win1000_dirprobe.json', json_encode($results));
