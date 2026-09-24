<?php

// 直连优先、失败代理兜底（出口IP总政策 2026-09-16 curl-df口径）
function _df_px() { $f = @fsockopen('127.0.0.1', 5780, $e, $c, 2); if ($f) { fclose($f); return 'http://127.0.0.1:5780'; } return ''; }

// win2000: bedirectory.com t9 spravs curl直投 (phpLD克隆, captcha侦测跳过)
$ctx = stream_context_create(['ssl'=>['verify_peer'=>false,'verify_peer_name'=>false]]);
$domain='bedirectory.com'; $path='/submit.php';
$site='spravs.com';
$title='Spravs';
$desc='Spravs is an online shopping destination offering curated deals, product reviews and buying guides across electronics, home goods and everyday essentials for smart shoppers.';
$email='bedir.spravs@92ng.com';
$url="https://www.{$domain}{$path}";
$html=@file_get_contents($url,false,stream_context_create(['http'=>['timeout'=>15,'header'=>"User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0\r\n"],'ssl'=>['verify_peer'=>false,'verify_peer_name'=>false]]));
if($html===false){echo "UNREACHABLE\n";exit(1);}
if(preg_match('/name="CAPTCHA"|image_verification|recaptcha/i',$html)){echo "CAPTCHA_PRESENT_SKIP\n";exit(2);}
$cat=0;
if(preg_match('/<select[^>]*name="CATEGORY_ID"[^>]*>([\s\S]*?)<\/select>/',$html,$sm)){
  if(preg_match('/value="(\d+)"[^>]*>[^<]*(shopping|business|computers|internet)/i',$sm[1],$cm))$cat=$cm[1];
  elseif(preg_match('/value="(\d+)"/',$sm[1],$cm2))$cat=$cm2[1];
}
$lt='';
if(preg_match('/name="LINK_TYPE"[^>]*value="([^"]*)"/',$html,$lm))$lt=$lm[1];
echo "CAT=$cat LT=$lt\n";
$post=['LINK_TYPE'=>$lt,'TITLE'=>$title,'URL'=>"https://{$site}",'DESCRIPTION'=>$desc,'OWNER_NAME'=>'Leo Xm','OWNER_EMAIL'=>$email,'CATEGORY_ID'=>$cat,'AGREERULES'=>'1','submit'=>'Submit','META_KEYWORDS'=>'','META_DESCRIPTION'=>substr($desc,0,200)];
$opts=[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>http_build_query($post),CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>true,CURLOPT_TIMEOUT=>25,CURLOPT_SSL_VERIFYPEER=>false,CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0'];
$ch=curl_init($url);
curl_setopt_array($ch, $opts);
$res=curl_exec($ch);$code=curl_getinfo($ch,CURLINFO_HTTP_CODE);
if(($res===false||$code===0)&&_df_px()){curl_close($ch);$opts[CURLOPT_PROXY]=_df_px();$ch=curl_init($url);curl_setopt_array($ch,$opts);$res=curl_exec($ch);$code=curl_getinfo($ch,CURLINFO_HTTP_CODE);}
curl_close($ch);
$txt=strip_tags($res);$txt=preg_replace('/\s+/',' ',$txt);
$bad=[];foreach(['invalid code','error','required','already exist','wrong'] as $b){if(stripos($txt,$b)!==false)$bad[]=$b;}
$good=[];foreach(['awaiting approval','thank','submitted','review','accepted','link has been'] as $g){if(stripos($txt,$g)!==false)$good[]=$g;}
echo "HTTP $code BAD[".implode(',',$bad)."] GOOD[".implode(',',$good)."]\n";
echo "HEAD: ".substr($txt,0,300)."\n";
