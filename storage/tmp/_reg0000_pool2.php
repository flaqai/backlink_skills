<?php
// reg0000: pending池 blog类全量复筛
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$rows = DB::table('blog_accounts')
    ->where('status', 'pending')
    ->whereNull('machine')
    ->where('dr', '>=', 20)
    ->orderByDesc('dr')
    ->limit(300)
    ->get(['id', 'domain', 'platform', 'dr']);

// 拦截名单/队列站/walls 已判死
$blocked = ['wix.com','jimdo.com','medium.com','livejournal.com','mozello.com','flickr.com','instructables.com','slashdot.org','about.me','behance.net','hubspot.com','issuu.com','plurk.com','dev.to','dzone.com','wikidot.com','webnode.com','postach.io','e27.co','teletype.in','hackernoon.com','indiehackers.com','posteezy.com','articlesblogger.com','blog.rollenspiel.monster','blog.dtth.ch','bcz.com','strikingly.com','ning.com','editthis.info','slideshare.net','writee.org','calameo.com','velog.io'];
$known = ['manage.wix.com','app.hubspot.com','app.kit.com','codeproject.com','newsbreak.com','steemit.com','peakd.com','onmogul.com','sooperarticles.com','diigo.com','ontoplist.com','zola.com','insanejournal.com','nerdbot.com','blogadda.com','tripod.com','growthhackers.com','hubpages.com','klusster.com','abduzeedo.com','agilealliance.org','superwebtricks.com','basiliscoderoko.com','benxiaotu.com','howtoadvice.com','searchenginemagazine.com','blog-lvup.com','1stchoiceketo.com','aaas.blog','chengrang.com','blogabond.com','helloblog.net','blog.froth.zone','notepin.co','blogacep.com','actoblog.com','atualblog.com','activosblog.com','blogadvize.com','suomiblog.com','mpeblog.com','ampblogs.com','sooperarticles.com','31.blog.reo.ink','articlealley.com','activerain.com'];

$c = 0;
foreach ($rows as $x) {
    if (in_array($x->domain, $blocked) || in_array($x->domain, $known)) continue;
    $anyReg = DB::table('blog_accounts')->where('domain', $x->domain)
        ->whereIn('status', ['registered', 'verified'])->where('machine', 'C')->count();
    if ($anyReg > 0) continue;
    printf("%s|%s|dr%s|id%s\n", $x->domain, $x->platform, $x->dr, $x->id);
    $c++;
}
echo "TOTAL={$c}\n";
