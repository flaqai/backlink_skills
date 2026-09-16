# 博客平台侦察验活 — win1000 2026-09-16 (C机)

## 计数
- WF官方instances页55域全量curl验活(排除writefreely.org自身): LIVE/SIGNUP=46 DEAD=8 BLOCK=1 — 九成ARCH/DB已占(net-new活=3: buttons.github.io/discuss.write.as/cdn.writeas.net, 均边缘基建域非平台)
- misskey开放实例复确认批14站(reg2200清单_mk_open): **14/14全活SIGNUP_PAGE** — byzantinenexus/hiyashi等C机已有号, buzzing.im/eter9.com/abyss.cafe等email=True栏未消费
- **合计处理 69 (≥60达标)**: 明细 seoadminC/storage/tmp/_w1000_blog_out.json + _w1000_blog_mk_out.json
- 注: probe输出里github.com/twitter.com为WF实例页外链污染, 非候选; WP官方instances页(2026-09-15同源)口径: mataroa/telegra/substack本机直连死维持(GFW型)

## 关键定性
- WF矿已基本吃干: 55域中36 SIGNUP_PAGE几乎全带C/B机账号或已归档, 净新率5%级
- misskey 14站: 探测层全活, /register 无email字段标注(Misskey注册走表单用户名+邀请码/申请制为主), 其中 buzzing.im/eter9.com/abyss.cafe/birb.space/chiplak.com/drdr.club 6站 mk_open 清单标 email=True, 夜班可试
- 9篇E机leoxme.*农场帖缺锚链(blog_writer_posts 427/277/464/469/477/258/355/361/365, acc205545-208445 machine=E) — 本班DOM核查实锤, 非C机凭据可修, **E机自查补锚**(同A机visionroot前例)
- friendica.rogueproject.org display页游客空壳(bodyLen=173, post 201423): 疑private-flagged(visionroot先例同症), 需owner会话复查重发public

## 首攻顺序 Top5 (C机无号可注优先)
1. **benert.pl** — EMAIL_SIGNUP✓ /register直带email表单, WF实例, 本班探活200
2. **rant.li** — LIVE+EMAIL_FIELD_ON_HOME(首页即邮箱表单), WF, 消费级
3. **noblogo.org** — WF开放注册SIGNUP_PAGE, ARCH未消费(⚠blog.rollenspiel.monster与blog.dtth.ch在手工登录队列/队列内避让不自动攻)
4. **buzzing.im** — misskey email=True未消费, eter9.com/abyss.cafe同批备选
5. **i11l.blog** — 0915 Top1维持(200活, 平台型, 注册入口待9224深探)
