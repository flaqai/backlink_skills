---
name: blog-3p-human-handoff
description: "编译/校验博客 3P 统一可视化富文本载荷，生成 WQ 作者自查或 WR 独立审稿后由 G 验收的人工发布交接包及公开页回传证据；不操作平台编辑器。"
---

# 博客 3P：人工发布交接包

先阅读[术语约定](../../docs/terminology.zh-CN.md)。W 在 WQ 最终作者自查或 WR 独立 `FULL_REVIEW` 前编译浏览器可打开、人工可直接选择标题和正文的**可视化富文本交付页**；G 将文章置为 `human_release_ready` 后，本技能只使用已核验的字节一致载荷生成派生清单和回传证据。它不登录平台、不输入编辑器、不上传图片、不保存草稿、不发布、不删除或回滚。

## 唯一交接面

`article-package.json@1.5` 是冻结声明与上游唯一来源的连接点：`canonical/article.html`、metadata、evidence pack 和视觉清单。它不反向引用派生的 handoff manifest，也不手工重复 SEO 字段、链接或图片清单。编译器只读 package 声明且哈希相符的来源。`BLOG_3P_VISUAL_PAYLOAD@3` 包括 `handoff/visual-payload.html`（供富文本复制及适用 WQ/WR 语义核验）和对应的 `handoff/visual-payload.md`（可读/追溯备用稿）。不得手写、二次编辑任一交付页、页面壳、CSS、JavaScript、按钮、卡片或操作顺序；`1.4` 仅作历史兼容。

交付页固定自上而下显示：博客标题、在准确位置带中文图片注释的正文、SEO 标题、标签、描述。没有复制按钮、剪贴板脚本或平台专属控件。`SEPARATE_TITLE_FIELD` 表示人工分开复制标题和正文；`TITLE_IN_BODY` 用于没有独立标题字段的平台。旧 `BODY_H1_REQUIRED` 仅作为兼容输入别名，归一化为 `TITLE_IN_BODY`。本地 `<h1>`/`<h2>`/`<h3>` 标记只是写作和富文本选择辅助，绝不证明目标平台最终标题层级。

每张图在唯一基准稿正文的准确位置使用独立 `<!-- BLOG_3P_IMAGE:NN -->` 标记，不用聚合图槽。编译器只在原位渲染编号中文注释，HTML/Markdown 图卡一一对应。视觉清单按顺序记录 `ordinal`、`coverage_zone`、`placement_anchor`、本地化 Alt 和图注；锚点须在标记前可见。素材真实存在、哈希匹配、编号为 `01-lead-<slug>.png`、`02-middle-<slug>.jpg` 等，只接受 PNG/JPG/JPEG。空 Alt、缺/重/乱序标记、格式/命名/哈希错误必须编译失败。唯一基准稿不含脚本、样式、布局、自定义控件或 `<img>`；保留真实链接。`validate_payload.py` 重新渲染并核对双载荷、图卡、锚点与 CTA；仅当输出 `COMPANION_DUAL_READ_REQUIRED`，适用 WQ 或 WR 质量角色才额外语义读 Markdown。

每篇交接目录位于 `articles/<article_id>/handoff/`，应包含 `RELEASE-CARD.md`、内容指纹、本地预检、两份交付页和 `handoff/handoff-manifest.json`。该文章的其余交付物保持在同一 `articles/<article_id>/{context,research,canonical,reviews,handoff}` 根内；不得与另一篇混放。后者单向索引唯一基准稿、metadata、证据包、视觉清单、HTML／Markdown 交付页、审稿索引和需求追溯哈希；发布卡仅是人工提示，不是第二份文章、SEO 文档或证据源。

## 平台传输预检与已观察限制

在生成 `RELEASE-CARD.md` 前，先读取 [平台发布观察](references/platform-release-observations.md) 中与该平台/账号相同的行；它是提问清单，不是平台选择、账号授权或发布成功的证据。每条观察都必须保留平台、账号/站点、文章、日期和观察面。不得把一个账号的编辑器或读者页现象推广到该平台其他账号，也不得从公开可见性反推编辑器传输能力。

若人工需要插入正文图片，交接正文默认使用编译器在真实 `<!-- BLOG_3P_IMAGE:NN -->` 标记处生成的可删除图卡；图卡必须紧邻稳定的正文锚点。不得仅交付 `LEAD`／`MIDDLE`／`CLOSING` 的独立图片列表并让发布者自行猜测位置。原生独立标题字段只接收冻结标题的纯文本，不带 Markdown `#`；仅 `TITLE_IN_BODY` 路线才将标题放入正文。把已验证的正文图、仅封面图和未知图片传输分别记录，不能以富文本粘贴成功代替读者页图片验证。

## 编译与适用质量凭据

正文、metadata、链接、来源、读者价值承诺、冻结 CTA 和最终 visual manifest 稳定后编译。WQ 的同一 W 在候选稿锁定后对本篇 evidence pack、实际引用共享记录、唯一基准稿、metadata、最终图片、视觉清单和 HTML 主交付页作对抗式自查：图文邻接、独立作用、覆盖区、Alt/图注、素材格式/命名、CTA 保真及模板一致性均应纳入；定向修复后在短回执绑定最终文件哈希，结果只可为 `AUTHOR_QA_READY`，不可称独立批准。WR 由独立 R 一次 `FULL_REVIEW` 覆盖同样质量面。Markdown 同源性由验证器负责，`COMPANION_DUAL_READ_REQUIRED` 才要求适用角色语义双读。两路线都必须绑定 evidence pack、基准稿、metadata、visual manifest、HTML/Markdown payload 与 package 的当前哈希。

WQ 最终绑定后若视觉资产、正文、metadata、链接、来源、CTA、payload 或 package 改变，W 重新锁候选、对抗式自查并换新 `AUTHOR_QA_READY` 回执，或记录触发 ID 单向升级 WR；WQ 不做 R-Δ。WR 完整批准后的局部改动才可由同一 R 对变更及直接依赖作 `R_DELTA`，纯视觉可用 `R_VISUAL_DELTA`，不清晰风险则完整 R。质量凭据之后，交接清单只能复用字节一致的双载荷；重渲染若变化须在覆盖前失败，并让 W 从对应路线重新核验。G 核验交接清单哈希、`REQ-*` 和适用质量凭据：WQ 的可见作者回执或 WR 的独立 R 批准及适用研究审/Delta；不替质量角色审图片与编辑效果。机器校验不证明平台标题层级。

## 人工发布后的轻量回传

人工在平台完成操作后，将 `templates/public-return-receipt.json` 复制为 `handoff/public-return-receipt.json`，记录公开 URL、精确 `HUMAN_ACCEPTED` 或 `HUMAN_NEEDS_FIX`、回传时间、已知版本/时间或 `UNVERIFIED`、渲染证据路径和已知限制。限制必须明确平台、账号/站点、编辑器/主题、地区/市场、观察日期、证据、受影响契约项，并设 `not_generalizable: true`。

同一已登记的项目统筹 G 在 `PUBLIC_QA_BATCH_READONLY` 中使用回执和规范化快照写一份批量报告。每篇有独立条目、回执/快照哈希、渲染视觉证据、尝试次数与 `unverified_retry_count`，独立分类为 `PUBLIC_QA_PASSED`、`PUBLIC_QA_PASSED_WITH_LIMITATION`、`HUMAN_TRANSPORT_FIX_REQUIRED`、`PUBLIC_QA_UNVERIFIED` 或 `CANONICAL_CHANGE_REQUESTED`。平台传输修复交人工，回同一 G 下一批只读复核；只有带用户请求 ID 的 canonical 变更才能按该文适用的 WQ/WR 路线重开。

`HUMAN_ACCEPTED` 后，标题层级仅凭公开读者页的渲染视觉判断。提供足以辨别页面标题、章节、子章节、顺序和扁平化/重复问题的视觉证据；编辑器 HTML/DOM、公开源码、Feed 与 JSON 快照均不能覆盖该结论。证据不足是 `PUBLIC_QA_UNVERIFIED`，可见层级问题使用稳定 `PUBLIC-VISUAL-HIERARCHY-NNN` 并交由人工修复决定。

机器字段、HTML 模板签名、`Alt：` 标记、路径与状态码保持不变。
