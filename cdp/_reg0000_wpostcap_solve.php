<?php
// reg0000 0916 固化: WPOST captcha_window 九宫格纯HTTP破解管线 (amoblog/blogkoo/blogdigy/mybloglicious/suomiblog族)
// 机制(解码captcha.js得出): ①POST ajax.php{new_captcha_session:1}→{successfully,category}发题 ②GET imgs.php?N&random=seed 九图 ③人判/AI判选格 ④POST ajax.php{valid_captchas:"abc"+格id序列,btn_verify:1}→{successfully}存服务端session ⑤立即POST /signup表单(同cookie)
// 用法: php _reg0000_wpostcap_solve.php <域名> [signout路径]  例: php _reg0000_wpostcap_solve.php blogkoo.com signup
// ★步骤④后必须同cookie立即⑤; 本脚本输出九图路径+category供AI判读, 判读结果作参数回填第2阶段
$dom = $argv[1] ?? '';
$path = '/' . ltrim($argv[2] ?? 'signup', '/ ');
$phase = $argv[3] ?? '1';               // 1=发题拉图, 2=提交答案(需第4参数"1,3,5")
$picks = $argv[4] ?? '';                 // 如 1,4,7
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36';
$jar = __DIR__ . "/_wc_" . preg_replace("/[^a-z0-9]/", "", $dom) . ".txt";

function http($url, $post = null, $ua, $jar) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_USERAGENT => $ua, CURLOPT_COOKIEFILE => $jar, CURLOPT_COOKIEJAR => $jar, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30, CURLOPT_REFERER => 'https://' . $GLOBALS['dom'] . $GLOBALS['path']]);
    if ($post !== null) { curl_setopt($ch, CURLOPT_POST, true); curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post)); }
    $r = curl_exec($ch);
    $c = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$c, $r];
}

// 步骤①: GET页面建session
list($c, $html) = http("https://$dom$path", null, $ua, $jar);
echo "page: $c (" . strlen($html) . "b)\n";

if ($phase == '1') {
    // 步骤②: new_captcha_session→category
    list($c, $r) = http("https://$dom/plugins/captcha/ajax.php", ['new_captcha_session' => '1'], $ua, $jar);
    echo "session: $c $r\n";
    $j = json_decode(trim($r), true);
    if (empty($j['successfully'])) { echo "NO-SESSION\n"; exit(1); }
    echo "CATEGORY: " . ($j['category'] ?? '?') . "\n";
    // 步骤③: 拉九图
    $rnd = (string)(mt_rand() / mt_getrandmax());
    echo "SEED: $rnd
";
    for ($i = 1; $i <= 9; $i++) {
        list($ic, $img) = http("https://$dom/plugins/captcha/imgs.php?$i&random=$rnd", null, $ua, $jar);
        $f = sys_get_temp_dir() . "/wc_{$i}.png";
        file_put_contents($f, $img);
        echo "img$i: $ic -> $f (" . strlen($img) . "b)\n";
    }
    echo "NEXT: AI判图后 -> php _reg0000_wpostcap_solve.php $dom " . ltrim($path, '/ ') . " 2 <格号如1,4,7>\n";
} else {
    // 步骤④: 提交答案——captcha.js: valid_captchas = "abc" + 每个选中td里img id.substr(7)拼接
    // img id 形如 captcha_imgN → substr(7) = N; js: string "abc"+id? 实测按 "1,4,7"格号构造
    $seed = $argv[5] ?? '';
    $ids = '';
    $n = count(array_filter(array_map('trim', explode(',', $picks))));
    for ($i = 0; $i < $n; $i++) $ids .= $seed;
    echo "valid_captchas=abc$ids (seed=$seed × $n)
";
    list($c, $r) = http("https://$dom/plugins/captcha/ajax.php", ['valid_captchas' => 'abc' . $ids, 'btn_verify' => '1'], $ua, $jar);
    echo "verify: $c $r\n";
    $j = json_decode(trim($r), true);
    if (!empty($j['successfully'])) {
        echo "CAPTCHA-VALID-NOW-POST-SIGNUP (同jar立即POST $path: email/password/username/sent=1/jsession/use_ssl)\n";
    } else {
        echo "VERIFY-FAILED(重跑phase1换题)\n";
    }
}
