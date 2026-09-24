<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=seoadmin;charset=utf8mb4','root','root');
foreach($pdo->query("SELECT id, title, target_url, LENGTH(body) blen, LEFT(body, 500) head FROM blog_writer_posts WHERE id=155") as $r){
  echo "id={$r['id']}\tlen={$r['blen']}\nTITLE={$r['title']}\nTARGET={$r['target_url']}\nHEAD={$r['head']}\n";
}
