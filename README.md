# Backlink Skills：用 Codex 管理外链提交与 SEO 内容生产

![Backlink Skills：Codex 驱动的 SEO 写作、目录提交与外链渠道管理](assets/backlink-skills-hero.png)

[![GitHub Stars](https://img.shields.io/github/stars/flaqai/backlink_skills?style=for-the-badge&logo=github&label=Stars&color=2563eb)](https://github.com/flaqai/backlink_skills/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/flaqai/backlink_skills?style=for-the-badge&logo=github&label=Forks&color=0891b2)](https://github.com/flaqai/backlink_skills/forks)
[![License](https://img.shields.io/github/license/flaqai/backlink_skills?style=for-the-badge&color=7c3aed)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/flaqai/backlink_skills?style=for-the-badge&color=475569)](https://github.com/flaqai/backlink_skills/commits/main)

> 这是 Flaq AI 团队在实际产品推广过程中整理并持续维护的一套开源工作流，包含外链渠道清单、两种产品目录提交 Skill、通用 SEO 写作 Skill，以及面向 LinkedIn、Medium 和微信公众号的定制写作 Skill。

这个项目不是“一键群发外链”工具，也不承诺收录、Dofollow、流量或排名。我们希望分享的是一套更可复用的做法：让 Codex 先检查渠道，再按授权执行，遇到验证码时交给用户，提交后保留证据；需要内容时，再根据发布平台生成适合当地读者和规则的文章，而不是把同一篇 SEO 文案复制到所有网站。

**语言：** [简体中文（主文档）](README.md) · [English](README_en.md) · [繁體中文](README_tw.md) · [日本語](README_ja.md) · [한국어](README_ko.md) · [ไทย](README_th.md) · [Tiếng Việt](README_vi.md) · [Bahasa Indonesia](README_id.md) · [Español](README_es.md) · [Français](README_fr.md) · [Deutsch](README_de.md) · [Italiano](README_it.md) · [Português](README_pt.md) · [Русский](README_ru.md) · [العربية](README_ar.md) · [हिन्दी](README_hi.md) · [Türkçe](README_tr.md) · [Nederlands](README_nl.md) · [Polski](README_pl.md)

## 项目热度与 Star 增长

[![flaqai/backlink_skills 的 GitHub Star 近期增长趋势](assets/github-stars-growth.svg)](https://github.com/flaqai/backlink_skills/stargazers)

## 项目里有什么

| 内容 | 适合场景 | 核心特点 |
|---|---|---|
| [`SPD V1 Batch`](submit-product-directories-v1-batch/SKILL.md) | 已经有一批合法、相关的目录 URL，希望用 Codex 批量推进 | URL 规范化、去重、分片、验证优先、逐站提交、断点恢复、吞吐统计 |
| [`SPD V2 Quality`](submit-product-directories-v2-quality/SKILL.md) | 希望 Codex 按顺序少量提交，更重视渠道质量和长期价值 | 每批最多 10 个站点、质量门槛、逐动作授权、证据记录、发布后质量检查 |
| [`writer`](writer/SKILL.md) | 官网博客、教程、对比、榜单、解释文等通用 SEO 内容 | 选题、提纲、事实核查、SEO 审计、改写、humanization、图片与文件打包 |
| [`linkedin-writer`](writer/linkedin-writer/SKILL.md) | LinkedIn Article、newsletter、B2B 长文 | LinkedIn 话题研究、商务深度、专业观点、SEO 设置和发布包 |
| [`medium-writer`](writer/medium-writer/SKILL.md) | Medium story、Publication 投稿、教程、随笔和案例 | Topic/Publication 匹配、作者视角、叙事结构、AI 披露和发布包 |
| [`wechat-writer`](writer/wechat-writer/SKILL.md) | 微信公众号长文、教程、观点、热点解读和复盘 | 中文选题、证据账本、移动端阅读、标题摘要、审稿和微信交付包 |
| [免费外链渠道清单](Free-backlink-list.md) | 自己筛选候选目录、社区和内容渠道 | 743 个网站分别配有中文简介，并保留批次/日期和实操备注 |

## 两种外链提交方式

### 1. 用 Codex 批量推进：SPD V1 Batch

`$submit-product-directories-v1-batch` 适合已经准备好一批目标 URL，并且更关心覆盖率、处理效率和可恢复性的任务。

它会：

- 规范化 URL、清理追踪参数并提前去重；
- 为站点建立稳定的队列 ID、幂等键和执行分片；
- 先做只读检查，提前暴露登录、CAPTCHA、Turnstile、邮箱验证等人工步骤；
- 把需要用户处理的验证集中成一个队列，不让整批任务卡在第一个验证码上；
- 按字段长度复用已批准的产品介绍，但保持品牌、网址和事实一致；
- 在同一浏览器配置中逐站提交，每完成一个站点就先写入结果，再移动队列游标；
- 记录草稿、等待验证、等待审核、已发布、结果未知、失败和排除项，方便中断后继续。

“批量”指的是批量整理、分片和推进队列，不代表无节制并发，更不代表绕过网站限制。V1 仍然要求真实信息、合法渠道、授权提交和逐项留证。

### 2. 用 Codex 按顺序精细提交：SPD V2 Quality

`$submit-product-directories-v2-quality` 适合更在意受众相关性、推荐流量、条目质量、治理和长期存活率的任务。

它会：

- 先研究站点的真实受众、相关性、编辑治理、链接售卖、互链要求和条款兼容性；
- 过滤低质量目录网络、只卖排名链接、强制互链、与产品无关或没有真实发现价值的站点；
- 以小批次运行，每批最多 10 个候选站点；
- 先完成研究与验证，再按顺序进入表单执行；
- 对注册、填写、同意协议、上传素材和最终提交分别检查授权；
- 为执行动作、结果、公开页面和链接属性保留结构化证据；
- 以合格发布率、推荐访问、转化、资料准确性和存活时间衡量结果，而不是只数提交量或外链数。

简单选择：已有大量已筛选 URL，优先 V1；候选不多、品牌要求高，优先 V2。拿不准时先用 V2 做小批次验证，再决定是否扩大到 V1。

## 免费外链渠道清单

仓库开源了我们整理、尝试或待核验的候选渠道：

- [Free-backlink-list.md](Free-backlink-list.md) 包含 **743 个网站或提交入口**；
- 清单已经移除历史提交状态，避免把其他产品的执行结果误用到新任务；
- 每个网站都补充了独立的中文简介，说明它大致属于产品目录、AI 工具导航、创业社区、软件评测、内容平台、企业目录或表单入口中的哪一类；
- 备注保留了批次/日期、收费提示、验证问题和历史实操结果；无来源、无月份的旧流量数字已经移除。

文件名沿用了团队内部的“Free Backlink List”叫法，但不能把其中每一条都理解为“当前可免费提交”。清单里明确包含已经停服、入口关闭、需要付费、要求互链、只适合发文章、重复或尚未验证的渠道。网站规则和可用性会变化，使用前应让 Codex 重新检查，而不是直接照表群发。

推荐用法：

1. 先按产品类型、目标市场和发布形式筛选候选项；
2. 用 V2 对前 5–10 个站点做质量和合规检查；
3. 确认资料、账号和授权后，再决定逐站执行或将合格 URL 交给 V1 批量推进；
4. 把新的结果记录在独立任务记录中，不要把清单备注直接当成当前事实。

## SEO 写作能力

### 通用 SEO Writer

[`writer/SKILL.md`](writer/SKILL.md) 面向官网博客和搜索型长文，支持：

- 从任务卡、搜索意图和关键词开始设计文章；
- 生成 How-to、对比、榜单、解释文、FAQ、SEO 标题、摘要、Meta Description 和标签；
- 核查产品能力、价格、日期、统计、政策和比较性主张；
- 执行结构化 SEO 审计，再根据问题改写；
- 在事实和 SEO 修正后进行 humanization，减少模板化、宣传腔和机械表达；
- 生成或规划 16:9 配图，默认使用本地相对路径；
- 把文章、审计和图片保存到 `writer/output/<article-slug>/`；
- 本地配置有效时可选上传图片到 Cloudflare R2；没有配置也能完整交付。

### 针对发布网站定制的 Writer

这些子 Skill 不是简单换一个输出目录，而是按平台重新设计选题、结构、审核和交付：

- **LinkedIn Writer**：面向职业读者、B2B 决策和 thought leadership，补充 LinkedIn/Google-to-LinkedIn 话题研究、商务洞察、讨论设计、Article/newsletter 选择、SEO 设置和发布包。
- **Medium Writer**：面向 Medium 的 Topic 与 Publication 生态，强调作者真实经验、叙事连续性、Publication 匹配、图片标注、AI 辅助披露和读者分发准备。
- **WeChat Writer**：面向微信公众号中文阅读场景，强调标题摘要、主张—证据账本、适合手机的段落、账号语气、审稿、配图方案和发布附录。

这些 Skill 默认生成本地成稿或发布包，不会因为“写一篇文章”就自动登录和发布。外部发布、账号操作、图片上传等仍是独立授权动作。

## 在 Codex 中使用

Codex Skills 用于保存可重复使用的说明、资料和脚本；调用时可以直接写 `$skill-name`。可参考 [OpenAI 官方的 Codex Skills 用例](https://learn.chatgpt.com/use-cases/reusable-codex-skills)。

你可以克隆本仓库后让 Codex 直接读取相应目录，也可以只把需要的 Skill 目录复制到 Codex 可发现的 Skills 目录。不要把整个仓库当成一个 Skill：两个提交版本和四个写作入口有各自独立的 `SKILL.md`。

使用前建议准备：

- 产品名、规范官网 URL、定位与目标用户；
- 短、中、长三个版本的真实产品介绍；
- 分类、价格、上线时间、公司/创始人等可公开且已核实的信息；
- Logo、截图等允许上传的素材；
- 账号和联系信息的别名，不要把密码、OTP、Cookie 或恢复码写入任务记录；
- 哪些动作允许自动执行，哪些必须先询问，哪些禁止；
- 目标 URL 列表或从免费清单中筛出的候选项。

### 批量提交示例

```text
使用 $submit-product-directories-v1-batch 处理我提供的目录 URL。
先规范化、去重并建立执行分片；先检查登录和验证码，把人工步骤集中成队列。
只使用已确认的产品资料，不付费、不添加互链、不绕过验证。
每个站点完成后立即记录证据，结果不明确时不要重试。
```

### 按顺序精细提交示例

```text
使用 $submit-product-directories-v2-quality，从 Free-backlink-list.md 中筛选
与我们的 AI 视频产品最相关的候选渠道。先选不超过 10 个站点，完成质量门槛、
重复检查和授权检查，再按顺序提交。低质量、强制互链、付费买链接或仅宣传排名
价值的站点直接排除。保存可审计记录，不要自动发布文章或社区帖子。
```

### 通用 SEO 文章示例

```text
使用 $writer 写一篇面向 SaaS 创业者的中文 SEO 对比文章。
先确认搜索意图和需要核实的主张，完成提纲、正文、SEO 审计和 humanization，
输出 article.md、seo-audit.md 和配图方案，不自动发布。
```

### 平台定制文章示例

```text
使用 $linkedin-writer 写一篇面向 B2B 产品负责人的 LinkedIn Article，
围绕“如何评估 AI Agent 是否适合进入生产环境”。完成话题研究、商务洞察、
事实核查、最终去机械化编辑和 LinkedIn 发布包，不自动发布。
```

将 `$linkedin-writer` 换成 `$medium-writer` 或 `$wechat-writer`，即可进入对应平台的工作流。

## 状态、证据与人工接管

外链提交不是“点击按钮就算成功”。两套提交 Skill 都会区分：

- `submitted`：有可靠回执或已发送邮件证据；
- `awaiting email verification`：等待用户完成邮箱验证；
- `awaiting approval`：网站明确表示进入审核；
- `published`：公开、非预览页面中能看到正确的产品身份；
- `submission outcome unknown`：执行过最终操作但回执不确定，调查前不能重试；
- `submission failed`：存在明确拒绝、退信或可靠失败证据；
- `ineligible` / `unavailable`：不适合当前产品或当前无法使用。

CAPTCHA、Turnstile、2FA、Passkey、邮箱/手机验证等必须由网站原生流程或用户完成。Skill 不使用验证码代答、隐身浏览、代理轮换或指纹规避。

## 仓库结构

```text
.
├── README.md                         # 中文主文档
├── README_en.md                      # English
├── README_*.md                       # 其他语言基础说明
├── Free-backlink-list.md             # 免费外链候选清单（Markdown）
├── assets/                           # README 主视觉与 Star 趋势图
├── submit-product-directories-v1-batch/
│   ├── SKILL.md
│   ├── agents/openai.yaml
│   ├── assets/
│   ├── references/
│   ├── scripts/
│   └── tests/
├── submit-product-directories-v2-quality/
│   ├── SKILL.md
│   ├── agents/openai.yaml
│   ├── assets/
│   ├── references/
│   ├── scripts/
│   └── tests/
└── writer/
    ├── SKILL.md
    ├── linkedin-writer/
    ├── medium-writer/
    ├── wechat-writer/
    ├── references/
    ├── scripts/
    └── config/
```

## 校验与测试

两个外链提交 Skill 都带有记录审计脚本和测试：

```bash
python3 submit-product-directories-v1-batch/scripts/audit_submission_record.py path/to/v1-record.md
python3 submit-product-directories-v2-quality/scripts/audit_submission_record.py path/to/v2-record.md

python3 -m unittest discover -s submit-product-directories-v1-batch/tests
python3 -m unittest discover -s submit-product-directories-v2-quality/tests
```

LinkedIn、Medium 和微信公众号 Writer 还分别带有 Markdown 机械审计脚本，用于发现确定性的结构、发布包和可读性问题。脚本不能替代事实核查、人工编辑或平台审核。

## 使用边界

- 不用于批量垃圾外链、排名操纵、虚假资料、付费买链接或强制互链。
- 不保证任何站点接受、发布、索引或保留条目。
- 不保证 Dofollow、DA/DR、PageRank、流量或关键词排名。
- 不绕过网站的安全、验证、付费或条款限制。
- 不把历史清单状态当作当前事实，执行前必须重新检查。
- 不把目录提交量当成 SEO 效果；更应关注相关性、推荐访问、转化和条目存活。

## 参与维护

欢迎提交 Issue 或 Pull Request，尤其是：

- 新的合法产品目录和公开提交入口；
- 已失效、改为收费或修改规则的渠道；
- 更准确的分类、验证要求和提交备注；
- 外链提交 Skill 的兼容性、审计器和恢复流程改进；
- SEO Writer 与平台定制 Writer 的真实使用反馈。

请不要提交密码、OTP、Cookie、私有邮箱、会话链接或任何无法公开的活动证据。

## 关于 Flaq.ai

[Flaq.ai](https://flaq.ai/zh/) 为 AI Agent 和生产应用提供图片、视频、音乐及语言模型的统一 API 接入。我们开源这个项目，是希望把实际推广中反复使用的渠道资料、执行流程和写作方法整理成可检查、可复用、可继续改进的 Codex Skills。

相关项目：[Awesome Codex Skills](https://github.com/flaqai/awesome_codex_skills) · [Awesome Claude Code Skills](https://github.com/flaqai/awesome_claude_code_skills)

## License

[MIT License](LICENSE)
