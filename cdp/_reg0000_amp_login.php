<?php
// reg0000: ampblogs 一步登录——拼图过→立即POST登录→收集Set-Cookie
$dom = 'ampblogs.com';
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36';
$jar = __DIR__ . '/_kc_ampblogscom2.txt';
@unlink($jar);

function http($url, $post = null, $ua, $jar, $hdr = false) {
    $ch = curl_init($url);
    $opts = [CURLOPT_USERAGENT => $ua, CURLOPT_COOKIEFILE => $jar, CURLOPT_COOKIEJAR => $jar, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30, CURLOPT_HEADER => $hdr];
    if ($post !== null) { $opts[CURLOPT_POST] = true; $opts[CURLOPT_POSTFIELDS] = $post; }
    curl_setopt_array($ch, $opts);
    $r = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, $r];
}

// 1. 拼图循环
$solved = false;
for ($try = 0; $try < 6 && !$solved; $try++) {
    list($c, $html) = http("https://$dom/login", null, $ua, $jar);
    if ($c != 200) { echo "login page $c\n"; sleep(3); continue; }
    $rnd = (string)(mt_rand() / mt_getrandmax());
    list($c1, $bg) = http("https://$dom/plugins/KEY-Captcha/img.php?background&random=$rnd", null, $ua, $jar);
    list($c2, $pz) = http("https://$dom/plugins/KEY-Captcha/img.php?puzzle&random=$rnd", null, $ua, $jar);
    if ($c1 != 200 || $c2 != 200) { echo "img $c1/$c2\n"; sleep(3); continue; }
    file_put_contents(sys_get_temp_dir() . "/kc_bg.jpg", $bg);
    file_put_contents(sys_get_temp_dir() . "/kc_pz.png", $pz);
    // GD洞检测
    $bi = imagecreatefromstring($bg);
    $bw = imagesx($bi); $bh = imagesy($bi);
    $white = [];
    for ($y = 0; $y < $bh; $y++) for ($x = 0; $x < $bw; $x++) {
        $col = imagecolorat($bi, $x, $y);
        if ((($col >> 16) & 0xFF) >= 235 && (($col >> 8) & 0xFF) >= 235 && ($col & 0xFF) >= 235) $white[$y * $bw + $x] = true;
    }
    $queue = new SplQueue();
    for ($x = 0; $x < $bw; $x++) foreach ([0, $bh - 1] as $y) if (!empty($white[$y * $bw + $x])) { $white[$y * $bw + $x] = false; $queue->enqueue([$x, $y]); }
    for ($y = 0; $y < $bh; $y++) foreach ([0, $bw - 1] as $x) if (!empty($white[$y * $bw + $x])) { $white[$y * $bw + $x] = false; $queue->enqueue([$x, $y]); }
    while (!$queue->isEmpty()) {
        list($x, $y) = $queue->dequeue();
        foreach ([[$x+1,$y],[$x-1,$y],[$x,$y+1],[$x,$y-1]] as $n) {
            if ($n[0] < 0 || $n[0] >= $bw || $n[1] < 0 || $n[1] >= $bh) continue;
            if (!empty($white[$n[1] * $bw + $n[0]])) { $white[$n[1] * $bw + $n[0]] = false; $queue->enqueue($n); }
        }
    }
    $best = ['sz' => 0, 'x' => 0, 'y' => 0];
    $seen = [];
    for ($y = 0; $y < $bh; $y++) for ($x = 0; $x < $bw; $x++) {
        $k = $y * $bw + $x;
        if (empty($white[$k]) || isset($seen[$k])) continue;
        $q2 = new SplQueue(); $q2->enqueue([$x, $y]); $seen[$k] = true;
        $sz = 0; $minX = $x; $minY = $y;
        while (!$q2->isEmpty()) {
            list($cx, $cy) = $q2->dequeue(); $sz++;
            $minX = min($minX, $cx); $minY = min($minY, $cy);
            foreach ([[$cx+1,$cy],[$cx-1,$cy],[$cx,$cy+1],[$cx,$cy-1]] as $n) {
                if ($n[0] < 0 || $n[0] >= $bw || $n[1] < 0 || $n[1] >= $bh) continue;
                $nk = $n[1] * $bw + $n[0];
                if (!empty($white[$nk]) && !isset($seen[$nk])) { $seen[$nk] = true; $q2->enqueue($n); }
            }
        }
        if ($sz > $best['sz']) $best = ['sz' => $sz, 'x' => $minX, 'y' => $minY];
    }
    if ($best['sz'] < 300) { echo "try$try no hole\n"; continue; }
    list($vc, $vr) = http("https://$dom/plugins/KEY-Captcha/img.php", http_build_query(['p_xx' => $best['x'], 'p_yy' => $best['y'], 'check_valid_puzzle' => 'btn']), $ua, $jar);
    $j = json_decode($vr, true);
    echo "try$try hole({$best['x']},{$best['y']}) verify: $vr\n";
    if (!empty($j['valid'])) { $solved = true; break; }
}
if (!$solved) { echo "SOLVE-FAIL\n"; exit(1); }

// 2. GET /login 提取 JS createCookie('session_id','xxx') 值
list($gc, $gh) = http("https://$dom/login", null, $ua, $jar);
$sid = '';
if (preg_match("/createCookie\('session_id'\s*,\s*'([^']+)'/", $gh, $sm)) $sid = $sm[1];
echo "session_id from JS: [$sid]\n";

// 3. 立即POST登录(带session_id cookie), 收集响应头
$ch = curl_init("https://$dom/login");
$cookieHeader = 'session_id=' . rawurlencode($sid);
curl_setopt_array($ch, [CURLOPT_USERAGENT => $ua, CURLOPT_COOKIEFILE => $jar, CURLOPT_COOKIEJAR => $jar, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30, CURLOPT_HEADER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => http_build_query(['username' => 'leoxmamp', 'password' => 'Xx@AmpBlogs26!Xm', 'rememberMe' => '1', 'login' => 'Sign in']), CURLOPT_HTTPHEADER => ['Cookie: ' . $cookieHeader]]);
$resp = curl_exec($ch);
$lc = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "login http=$lc\n";
preg_match_all('/Set-Cookie:\s*([^\r\n]+)/i', $resp, $m);
foreach ($m[1] as $s) echo "SET-COOKIE: " . substr($s, 0, 120) . "\n";
// 响应体里是否还有 createCookie(=仍在登录页)
if (preg_match("/createCookie\('session_id'\s*,\s*'([^']+)'/", $resp, $sm2)) echo "STILL-LOGIN-PAGE sid=" . $sm2[1] . "\n";

// 4. 验登录态(带全部cookie)
list($pc, $ph) = http("https://$dom/posts", null, $ua, $jar);
echo "posts http=$pc expired=" . (strpos($ph, 'Login Expired') !== false ? 'YES' : 'NO') . " dashboard=" . (strpos($ph, 'Dashboard') !== false ? 'Y' : 'N') . "\n";
