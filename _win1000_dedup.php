<?php
// 1. best-of-ai 提域名
$md = file_get_contents('D:/Github/backlink_skills/_win1000_bofai.md');
preg_match_all('/https?:\/\/([a-z0-9][a-z0-9\-\.]*\.[a-z]{2,})/i', $md, $m);
$dirs = [];
$skip = ['topaidirectories','altern','github','raw.githubusercontent','ghfast','img.shields','shields','s3','amazonaws','creativecommons','opensource'];
foreach($m[1] as $d){
  $d = strtolower(rtrim($d,'.'));
  $label = explode('.', $d)[0];
  if(in_array($label, $skip)) continue;
  if(strpos($d,'shields.io')!==false || strpos($d,'github')!==false) continue;
  $dirs[$d] = true;
}
$dirs = array_keys($dirs);
echo "BOFAI_DIRS=", count($dirs), "\n";
// 2. 对库去重: blog_accounts.domain + backlinks(域名) + 档案文件
$pdo = new PDO('mysql:host=127.0.0.1;dbname=seoadmin;charset=utf8mb4','root','root');
$known = [];
foreach($pdo->query("SELECT DISTINCT domain FROM blog_accounts WHERE domain IS NOT NULL AND domain!=''") as $r){ $known[strtolower(trim($r['domain']))]=1; }
foreach($pdo->query("SELECT DISTINCT url FROM backlinks WHERE url IS NOT NULL AND url!=''") as $r){
  $h = strtolower(parse_url($r['url'], PHP_URL_HOST) ?: '');
  $h = preg_replace('/^www\./','',$h);
  if($h) $known[$h]=1;
}
// 档案文件里的域名(全部new-sources+blog-platform-sources)
foreach(glob('C:/Users/Administrator/.zcode/skills/seoadmin-skill/sync-data/new-sources-*.md') as $f){
  preg_match_all('/([a-z0-9][a-z0-9\-]{2,60}\.[a-z]{2,})/i', file_get_contents($f), $mm);
  foreach($mm[1] as $d) $known[strtolower($d)]=1;
}
foreach(glob('C:/Users/Administrator/.zcode/skills/seoadmin-skill/sync-data/blog-platform-sources-*.md') as $f){
  preg_match_all('/([a-z0-9][a-z0-9\-]{2,60}\.[a-z]{2,})/i', file_get_contents($f), $mm);
  foreach($mm[1] as $d) $known[strtolower($d)]=1;
}
echo "KNOWN_TOTAL=", count($known), "\n";
$new = [];
foreach($dirs as $d){ if(!isset($known[$d]) && !isset($known['www.'.$d])) $new[]=$d; }
echo "NEW_DIRS=", count($new), "\n";
file_put_contents('D:/Github/backlink_skills/_win1000_newdirs.json', json_encode($new));
foreach($new as $d) echo $d, "\n";
