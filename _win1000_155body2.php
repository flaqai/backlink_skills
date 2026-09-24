<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=seoadmin;charset=utf8mb4','root','root');
$body = $pdo->query("SELECT body FROM blog_writer_posts WHERE id=155")->fetchColumn();
echo "aitools mention: ", substr_count(strtolower($body), 'aitoolsdirectory'), "\n";
echo "has <a href: ", (int)preg_match_all('/<a[^>]*href/i', $body), "\n";
preg_match('/<a[^>]*href=["\']([^"\']*)["\'][^>]*>(.*?)<\/a>/is', $body, $m);
if($m) echo "anchor: {$m[1]} | text: ", strip_tags($m[2]), "\n";
// 找锚链所在段
$pos = stripos($body, 'aitoolsdirectory');
if($pos !== false) echo "CTX: ...", mb_substr($body, max(0,$pos-200), 420), "...\n";
