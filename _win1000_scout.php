<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

$files = [
    'blog' => ['D:/Github/backlink_skills/tmp_recon/awesome-blogging.md'],
    'dir'  => ['D:/Github/backlink_skills/tmp_recon/t1.md', 'D:/Github/backlink_skills/tmp_recon/kites.md'],
];
// 已知墙/已用（journal 固化）
$known = ['dirhello','pakadtrader','123-directory','99webdirectory','avivadirectory','jasmine','techbasedirectory','unltd','altern','earlyhunt','alabamainindex','aidreamhub','doforai','postfreedirectory','elitesitesdirectory','9sites','sonicrun','247webdirectory','lemon-directory','onemilliondirectory','directorynode','dizila','prolinkdirectory','digabusiness','directory-free','sitepromotiondirectory','usawebsitesdirectory','gtawebdirectory','ukinternetdirectory','allstatesusadirectory','canadawebdir','morefunz','linkcentre','txtlinks','gmawebdirectory','usalistingdirectory','britainbusinessdirectory','australiawebdirectory','canadiandirectory','abc-directory','allbusinessdirectory','the-web-directory','bloghints','goworkable','submit.biz','flowtools','aitoolsmagazine','dynamite-ai','exactseek','siteswebdirectory','qualityinternetdirectory','gainweb','thenextai','aipulse','angelfire','viesearch','submitaiagent','tooldirs','rankmyai','aiagentsverse','dofollow','deeplaunch','aitoolsmarketer','futuretools','producthunt','fazier','toolpilot','wired','novatools','startupguys','dang','tipseason','thestartupinc','ko-fi','aifindar','aidrips','getlatka','paid'=>''];
// 库内已有域名
$have = [];
foreach (DB::table('blog_accounts')->get(['domain','platform']) as $a) { $have[strtolower($a->domain ?: $a->platform)] = 1; }
foreach (DB::table('backlinks')->get(['url']) as $b) { $h = parse_url($b->url, PHP_URL_HOST); if ($h) $have[strtolower(preg_replace('/^www\./','',$h))] = 1; }

$out = ['blog'=>[], 'dir'=>[]];
foreach ($files as $kind => $fs) {
    foreach ($fs as $f) {
        $txt = file_get_contents($f);
        preg_match_all('#https?://([a-z0-9][a-z0-9\.\-]+\.[a-z]{2,})#i', $txt, $m);
        foreach ($m[1] as $host) {
            $host = strtolower(preg_replace('/^www\./','',$host));
            if (preg_match('/\.(png|jpg|gif|svg|zip|shields|github|githubusercontent|youtube|twitter|x\.com|reddit|discord|telegram)$/i', $host)) continue;
            if (isset($have[$host]) || isset($known[$host])) continue;
            foreach ($known as $k => $v) { if (is_string($k) && strpos($host, $k) !== false) continue 2; }
            $out[$kind][$host] = 1;
        }
    }
}
foreach ($out as $k => $hosts) {
    $hosts = array_keys($hosts);
    echo strtoupper($k) . " 新候选 " . count($hosts) . " 个:\n" . implode(', ', $hosts) . "\n\n";
    file_put_contents("D:/Github/backlink_skills/tmp_recon/fresh_$kind.txt", implode("\n", $hosts));
}
