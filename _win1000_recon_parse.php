<?php
// 提取域名: WF实例表 + phpLD主页/404页
$domains = [];
// WF 实例表: 表格里 <td>域名</td>
$h1 = file_get_contents('D:/Github/backlink_skills/_win1000_wf.html');
preg_match_all('/<td[^>]*>\s*<a[^>]*href=["\']https?:\/\/([^"\'\/]+)["\']/i',$h1,$m1);
foreach($m1[1] as $d) $domains[trim(strtolower($d))]='writefreely-instances';
preg_match_all('/href=["\']https?:\/\/([^"\'\/\.]+\.[^"\'\/]+)["\'][^>]*class=["\'][^"\']*instance/i',$h1,$m1b);
foreach($m1b[1] as $d) $domains[trim(strtolower($d))]='writefreely-instances';
// 备用: 直接找 *.domain 形态
preg_match_all('/([a-z0-9][a-z0-9\-\.]+\.(?:com|net|org|io|blog|page|site|xyz|me|app|dev|club|community|zone|link|blog|ink|world|today|life|online|space|website|cc|to|is))/i', strip_tags($h1), $m1c);
foreach($m1c[1] as $d) { $d=strtolower(trim($d)); if(!isset($domains[$d])) $domains[$d]='writefreely-text'; }
// phpLD 页面外链域名
$h4 = file_get_contents('D:/Github/backlink_skills/_win1000_phpld.html');
preg_match_all('/href=["\']https?:\/\/(?:www\.)?([a-z0-9][a-z0-9\-\.]+\.[a-z]{2,})\/?["\']/i',$h4,$m4);
foreach($m4[1] as $d){ $d=strtolower(trim($d)); if(!isset($domains[$d])) $domains[$d]='phpld-page'; }
echo "RAW_DOMAINS=", count($domains), "\n";
file_put_contents('D:/Github/backlink_skills/_win1000_rawdomains.json', json_encode($domains));
foreach($domains as $d=>$src){ echo $d, "\t", $src, "\n"; }
