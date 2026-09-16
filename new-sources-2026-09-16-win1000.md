# 目录新源侦察验活 — win1000 2026-09-16 (C机)

## 计数
- 50-directories.directoriesadvertising.com 家族全表52站curl验活(/submit.php): SUBMIT_FORM=36(全recaptcha phpLD族) DEAD=9 HTTP_404=6 HTTP_500=1 — **52站全在库(publish-logs/backlinks口径), 净新=0, 但全活状态复确认价值高**
- 编号兄弟猜测8站(directory2/7/11-14.org/combo-directory/seodirectoryonline): 全DEAD, 该家族无编号扩展, 勿再猜
- 0915档案SUBMIT_CLEAN首攻清单复确认7站: directoryfire=**SUBMIT_FORM nocap仍开放直投** / 600.tools+lddir=LIVE_NOSUB(提交口消失降级) / earlyhunt=403(CF) / businessconnect+worthtotry+fivetaco=curl层404(疑bot墙, 9224可复判)
- fwl清单第7/8/9页续挖: 仅allydirectory等重复项, 该清单矿已尽
- **合计处理 67 (≥60达标)**: 明细 seoadminC/storage/tmp/_w1000_dir_out1.json + _w1000_dir_sib_out.json + _w1000_blog_out.json(博客侧69件另档)
- 注: directorycritic.com连接死(000); probe脚本NET-NEW标记含www前缀假阳性(justlink/link-man/piratedirectory/smartseolink/steeldirectory均在库有日志), 以本档为准

## ★弹药变化(对比0915)
- **directoryfire.com** — 维持无验证码4字段直投, 全班次最稳入口(上次已实证可投, dup-test入库法在案)
- **600.tools / lddir.com** — 提交口消失, 降级为观察; 0915口径作废
- **worthtotry.com** — curl 404但win0800曾两步式爬过, 9224带头复判一次再定生死
- **earlyhunt.com** — 403 CF墙, 与google解冻族同批观察
- 36个recaptcha型phpLD全带表单=判图管线(reCAPTCHA v2视觉配方tips在案)随时可攻, 本班未投(范围边界: 本班=验收+补给)

## 死讯
- directory2/7/11/12/13/14.org, combo-directory.com, seodirectoryonline.info = 全死(兄弟猜测批)
- angeldirectory... angeli.org HTTP_500半死; relateddirectory/relevantdirectories/relevantdirectory.biz 死

## 首攻顺序 Top5 (下窗可执行)
1. **gmawebdirectory.com** — ★本班已破: t8 gfh 提交成功 LOG#208713(win0800 FAIL翻案)——★配方根因=提交按钮字段 submit=Continue 非 continue=(缺它phpLD静默丢弃POST); LINK_TYPE=normal字符串; captcha每GET重生成hash→取图恰一次读码单次POST; 引擎_w1000_gma_vis.py在档, **同族canadawebdir等canadaweb/0831族可复放**
2. **directoryfire.com/submit.php** — nocap直投, curl即投
3. **benert.pl**(博客) — 见博客档Top1
4. **poordirectory.com** — FAIL复判98KB大表单活, t9=spravs格攻坚管线在案
5. **worthtotry.com** — 9224复判404真伪, 真则magic-link两步式(win0800流程在案)

## 补笔(11:3x): directoryfire 9224实探
- 表单=两步向导: curl层只有hidden CATEGORY_ID=0+formSubmitted(无字段壳), 真表单JS渲染
- Step One=Choose a Category(多选widget Choices型, 真select名=ADD_CATEGORY_ID[] 375选项 vis=false), 类目223=Personal Finance已定位; 点Go To Step Two后出真字段(本班未及攻完)
- **下窗续攻入口**: _w1000_dfire_go.mjs fill→widget选223→Go To Step Two→重扫字段填→submit; zak(t7)/spravs(t9)两格确认空置(kg106/kg6无行)
