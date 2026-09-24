<?php
// 155 正文 markdown → HTML, 存文件供 mjs 灌入
$pdo = new PDO('mysql:host=127.0.0.1;dbname=seoadmin;charset=utf8mb4','root','root');
$body = $pdo->query("SELECT body FROM blog_writer_posts WHERE id=155")->fetchColumn();
$lines = explode("\n", $body);
$html = '';
foreach($lines as $ln){
  $ln = rtrim($ln);
  if(trim($ln)==='') continue;
  if(preg_match('/^###\s+(.*)/',$ln,$m)) $html .= '<h3>'.htmlspecialchars($m[1]).'</h3>';
  elseif(preg_match('/^##\s+(.*)/',$ln,$m)) $html .= '<h2>'.htmlspecialchars($m[1]).'</h2>';
  elseif(preg_match('/^#\s+(.*)/',$ln,$m)) $html .= '<h1>'.htmlspecialchars($m[1]).'</h1>';
  else $html .= '<p>'.$ln.'</p>';
}
file_put_contents('D:/Github/backlink_skills/cdp/_win1000_155.html', $html);
echo "html_len=", strlen($html), "\n";
echo "anchors_in_html=", (int)preg_match_all('/<a[^>]*href/i', $html), "\n";
echo "h2=", (int)preg_match_all('/<h2>/i', $html), "\tp=", (int)preg_match_all('/<p>/i', $html), "\n";
