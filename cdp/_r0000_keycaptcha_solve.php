<?php

// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
function _df_px() { $f = @fsockopen('127.0.0.1', 5780, $e, $c, 2); if ($f) { fclose($f); return 'http://127.0.0.1:5780'; } return ''; }

// reg0000 0910 固化: KEY-Captcha 拼图验证码通用破解器 (ua.gz/abcdwebsites 系站点通用)
// 用法: php _r0000_keycaptcha_solve.php <域名> [login路径]  例: php _r0000_keycaptcha_solve.php onesmablog.com /login
// 机制(反混淆 captcha.js 得出): GET登录页(PHPSESSID)→img.php?background&random=X + img.php?puzzle&random=X 双图
//  →背景图上白色拼图剪影=答案位置(掩码MSE匹配)→POST img.php {p_xx,p_yy,check_valid_puzzle:btn}→{"valid":true}
// ★答案坐标=剪影bbox左上角, 服务端容差约±5px; valid:false 不销session可重试, 每次重取双图
// ★已知限制(reg0000 0910): 掩码MSE在「照片自带白色背景」图上会偏(白像素多=比较点少=误配, onesmablog berries图实测false)
//   下班正确姿势: 连通域洞检测——阈值≥240白, 找不接触图像边界的最大白色连通域(即拼图洞), 其bbox左上角即答案, 无需MSE
//   流程已全通: 登录页GET✓→双图GET✓→POST p_xx/p_yy✓→{"valid":true/false}✓(onesmablog手测valid:true一次)
$dom = $argv[1] ?? '';
// ★Git Bash会把"/login"参数MSYS转换成Windows路径——传不带前导斜杠的 login
$path = '/' . ltrim($argv[2] ?? 'login', '/ ');
if (!$dom) { fwrite(STDERR, "usage: php _r0000_keycaptcha_solve.php <domain> [loginPath]\n"); exit(1); }
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36';
$jar = __DIR__ . "/_kc_" . preg_replace("/[^a-z0-9]/", "", $dom) . ".txt";

function http($url, $post = null, $ua = null, $jar = null) {
    $ch = curl_init($url);
    $opts = [CURLOPT_HTTPHEADER => ['X-Requested-With: XMLHttpRequest', 'Referer: https://' . $GLOBALS['dom'] . $GLOBALS['path']], CURLOPT_USERAGENT => $ua, CURLOPT_COOKIEFILE => $jar, CURLOPT_COOKIEJAR => $jar, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30];
    if ($post !== null) { $opts[CURLOPT_POST] = true; $opts[CURLOPT_POSTFIELDS] = $post; }
    curl_setopt_array($ch, $opts);
    $r = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $em = curl_errno($ch) . ':' . curl_error($ch);
    curl_close($ch);
    if (($r === false || $code === 0) && _df_px()) {
        $opts[CURLOPT_PROXY] = _df_px();
        $ch = curl_init($url);
        curl_setopt_array($ch, $opts);
        $r = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $em = curl_errno($ch) . ':' . curl_error($ch);
        curl_close($ch);
    }
    return [$code, $r, $em];
}

// 503 shed 重试GET登录页
$html = '';
$c = 0;
$em = '';
for ($i = 0; $i < 5; $i++) {
    list($c, $html, $em) = http("https://$dom$path", null, $ua, $jar);
    if ($c == 200 && strpos($html, 'KEY-Captcha') !== false) break;
    echo "  attempt$i: http=$c err=$em\n";
    sleep(4);
}
if (empty($html)) { echo "LOGIN-PAGE-FAIL http=$c\n"; exit(1); }

// 503 shed 重试拉双图(同random)
$ok = false;
for ($i = 0; $i < 6; $i++) {
    $rnd = (string)(mt_rand() / mt_getrandmax());
    list($c1, $bg) = http("https://$dom/plugins/KEY-Captcha/img.php?background&random=$rnd", null, $ua, $jar);
    list($c2, $pz) = http("https://$dom/plugins/KEY-Captcha/img.php?puzzle&random=$rnd", null, $ua, $jar);
    if ($c1 == 200 && $c2 == 200 && strlen($bg) > 5000 && strlen($pz) > 3000) { $ok = true; break; }
    sleep(4);
}
if (!$ok) { echo "IMG-FAIL bg=$c1 pz=$c2\n"; exit(1); }
file_put_contents(sys_get_temp_dir() . "/kc_bg.jpg", $bg);
file_put_contents(sys_get_temp_dir() . "/kc_pz.png", $pz);

// GD 洞检测(主): 白≥235掩码→从图像边界泛洪标记照片背景白→剩余最大白色连通域=拼图洞→bbox左上角
$bi = imagecreatefromstring($bg);
$bw = imagesx($bi); $bh = imagesy($bi);
$white = [];
for ($y = 0; $y < $bh; $y++) {
    for ($x = 0; $x < $bw; $x++) {
        $c = imagecolorat($bi, $x, $y);
        if ((($c >> 16) & 0xFF) >= 235 && (($c >> 8) & 0xFF) >= 235 && ($c & 0xFF) >= 235) $white[$y * $bw + $x] = true;
    }
}
// 边界泛洪
$queue = new SplQueue();
for ($x = 0; $x < $bw; $x++) { foreach ([0, $bh - 1] as $y) { if (isset($white[$y * $bw + $x])) { $white[$y * $bw + $x] = false; $queue->enqueue([$x, $y]); } } }
for ($y = 0; $y < $bh; $y++) { foreach ([0, $bw - 1] as $x) { if (isset($white[$y * $bw + $x])) { $white[$y * $bw + $x] = false; $queue->enqueue([$x, $y]); } } }
while (!$queue->isEmpty()) {
    list($x, $y) = $queue->dequeue();
    foreach ([[$x + 1, $y], [$x - 1, $y], [$x, $y + 1], [$x, $y - 1]] as $n) {
        if ($n[0] < 0 || $n[0] >= $bw || $n[1] < 0 || $n[1] >= $bh) continue;
        if (!empty($white[$n[1] * $bw + $n[0]])) { $white[$n[1] * $bw + $n[0]] = false; $queue->enqueue($n); }
    }
}
// 剩余最大白色连通域 = 洞
$best = ['sz' => 0, 'x' => -1, 'y' => -1, 'x2' => -1, 'y2' => -1];
$seen = [];
for ($y = 0; $y < $bh; $y++) {
    for ($x = 0; $x < $bw; $x++) {
        $k = $y * $bw + $x;
        if (empty($white[$k]) || isset($seen[$k])) continue;
        $q2 = new SplQueue(); $q2->enqueue([$x, $y]); $seen[$k] = true;
        $sz = 0; $minX = $x; $minY = $y; $maxX = $x; $maxY = $y;
        while (!$q2->isEmpty()) {
            list($cx, $cy) = $q2->dequeue(); $sz++;
            $minX = min($minX, $cx); $minY = min($minY, $cy); $maxX = max($maxX, $cx); $maxY = max($maxY, $cy);
            foreach ([[$cx + 1, $cy], [$cx - 1, $cy], [$cx, $cy + 1], [$cx, $cy - 1]] as $n) {
                if ($n[0] < 0 || $n[0] >= $bw || $n[1] < 0 || $n[1] >= $bh) continue;
                $nk = $n[1] * $bw + $n[0];
                if (!empty($white[$nk]) && !isset($seen[$nk])) { $seen[$nk] = true; $q2->enqueue($n); }
            }
        }
        if ($sz > $best['sz']) $best = ['sz' => $sz, 'x' => $minX, 'y' => $minY, 'x2' => $maxX, 'y2' => $maxY];
    }
}
echo "hole: ({$best['x']},{$best['y']})-({$best['x2']},{$best['y2']}) size={$best['sz']}px\n";
if ($best['sz'] < 300) { echo "NO-HOLE-FOUND\n"; exit(1); }

// 提交答案
list($vc, $vr) = http("https://$dom/plugins/KEY-Captcha/img.php", http_build_query(['p_xx' => $best['x'], 'p_yy' => $best['y'], 'check_valid_puzzle' => 'btn']), $ua, $jar);
echo "verify: $vc $vr\n";
$j = json_decode($vr, true);
echo ($j['valid'] ?? false) ? "CAPTCHA-SOLVED session=$jar\n" : "CAPTCHA-FAILED(可重跑, 每轮新图)\n";
