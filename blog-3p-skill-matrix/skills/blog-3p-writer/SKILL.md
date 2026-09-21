---
name: blog-3p-writer
description: "在博客 WQ/WR 双线工作流中连续完成搜索导向调研、写作、图片和载荷；默认做同上下文对抗式自查，高风险升级独立 R。用于研究、撰写、修订和准备人工发布文章包。"
---

# 博客 3P：一体化研究与写作（W）

先阅读[术语约定](../../docs/terminology.zh-CN.md)。你是当前 `article_id` 的可执行 W：调研与写作构成同一条证据链。普通文章可复用同一可见 W 角色会话，但每次只处理当前文章的隔离路径和契约；`blog-writer-merged` 只是编辑核心参考，绝不能被启动为第二个 W、第二轮调研或第二份文章包。

默认在 `CONTINUOUS_CAMPAIGN_MAIN_SESSION` 内的 `articles/<article_id>/` 隔离路径工作，使用该文的 `context/article-contract.json` 和 `reviews/review-index.json`；WQ 须自行对抗式核验，却不得称作独立 R 审稿。不得跨路径混写、修改范围、决定发布、操作平台或用不可见 CLI 会话冒充角色。Git 工作树只在记录真实并发写入、高风险重写/回滚或用户要求 Git 隔离时使用。公开页差异归 G 批量只读检查，除非用户明确要求修改唯一基准稿或交付页，否则不重开 W。

## 开工前

1. 确认文章契约绑定本 `article_id`、有效的 `OWNER_PREWRITE_PLAN_CONFIRMED`、适用 `REQ-*`、冻结 `topic_slot`、语言/市场、必保留 CTA 与适用的平台/账号回执。确认前或方案要求修改时，不创建大纲、图片计划、来源台账、唯一基准稿或正文。
2. 常规轮次只加载文章契约、审稿索引、当前唯一基准稿/文章包和本轮变更的证据文件。上下文压缩后先完整重读[工作流核心](../../docs/workflow-core.md)；哈希漂移、问题项谱系不清、代理替换或范围冲突时才完整回读历史。紧凑索引绝不能覆盖冲突的源文件。
3. 平台只决定已确认映射的可承接性，绝不能选择目的地、翻译正文或借用其他文章的平台/账号。

## 一体化调研与写作

### 默认：连续创作与 WQ 同上下文自查

冻结 `AUTHOR_QA_INTEGRATED / WQ_SHARED_CONTEXT` 时，按一条连续工作完成 `RESEARCH → DRAFT → VISUALS → PAYLOAD → CANDIDATE_LOCK → ADVERSARIAL_SELF_QA → TARGETED_REPAIR → FINAL_BIND`。先在 `research/evidence-pack.json` 建立证据差异与引用索引，再据此成稿、配图、编译载荷；不为形式等待 `RESEARCH_APPROVED` 或维护重复研究包。锁定候选稿后，利用共享上下文但从反方读者视角主动质疑核心主张/来源、读者任务、标题和本地用语、必要 CTA、图文邻接与交付保真；真实问题保留稳定 finding ID，聚焦修复后重新检查受影响依赖。最终回执只写实际问题/升级及当前证据包、基准稿、metadata、视觉清单、双载荷和 package 的哈希；零开放问题才可记 `AUTHOR_QA_READY`，不得写成独立 R 的 `APPROVED` 或逐项 PASS 清单。

1. evidence pack 必须记录主长尾读者问题/意图、候选/淘汰词、选用理由、查询/日期、来源记录、支持的主张、证据强度和不确定性。若项目内的 `evidence/shared/campaign-evidence-pack.json` 有精确匹配且可复用的记录，写可选 `campaign_shared_evidence` 的 `path`、`sha256`、`record_ids`，并在 `article_delta` 写 `decision`、`freshness_or_scope_check` 与 `additional_evidence_refs`；只引用实际采用的记录，不复制整包或重写同一观察。两字段都缺表示无命中，正常继续本篇调研，绝不造空缓存。只将会显著改变读者决定或易变的主张（价格/日期、比较、性能、平台政策、高后果内容）标成可核验 material claim；不要把普通背景句机械拆成台账。`creative_angle` 只能作为编辑角度，不能充当关键词证据。若 Google Trends 数据不足、无结果或无明确趋势，不得反复试探或编造趋势理由：读者问题与选词仍须来自当前品牌站用语、地区 SERP 或已记录的模型翻译兜底；平台画像只可帮助选择技术深度、示例形式和交付结构，绝不能成为关键词、自然变体、搜索意图、当地需求或热门度的证据。
2. 每个目标语言都遵循 `CURRENT_BRAND_SITE → REGIONAL_SERP → MODEL_TRANSLATION_FALLBACK`：先记录同语言、同地区、同意图的现有品牌页及采用或有据拒绝；再记录地区 SERP 自然变体；只有两次独立地区检索都无可用共识时，才可记录有理由和风险的 `MODEL_TRANSLATION_FALLBACK`。Google Trends 如可用，仅比较英文种子/英文候选，作为全球相对关注度背景；不能替代本地用语证据，也不能证明搜索量、低基数/高势头、本地需求、商业意图或模型能力。缺少 `Breakout` 或清晰趋势本身不阻塞研究或写作。
3. 精确关键词、自然变体和标题只能在冻结 `topic_slot` 内调整。若读者任务、核心意图、市场和承诺都未变，在 `topic_slot_alignment` 写 `ALIGNED` 与简短 `within_slot_adjustments` 即可，不重开 G 或 R。若证据表明本地意图不符、原选题无可靠依据，或必须换成另一个读者问题，写 `TOPIC_EVIDENCE_CONFLICT`、稳定冲突 ID、理由、证据引用和建议动作，停止换题并交同一 G 决定。G 的 `KEEP_SLOT` / `NARROW_WITHIN_SLOT` 决定须在 `resolved_conflicts` 和既有可见任务账本中对应记录后才可继续；`PAUSE` / `OWNER_RECONFIRM_REQUIRED` 不得由 W 绕过。W 绝不能直接修改 `topic_slot`。
4. 在同一 evidence pack 明确分开 `reader_intent_basis`、`platform_profile_use` 与 `evidence_posture`，并记录读者问题、受众、批准变体、事实边界、视觉要求、读者价值承诺、CTA 声明和图片计划。共享包只允许精确引用 `GLOBAL_ENGLISH_TRENDS`、`BRAND_SITE_VARIANT` 或 `REGIONAL_SERP_VARIANT`；易变主张、平台政策/账号状态和 `MODEL_TRANSLATION_FALLBACK` 仍须本篇独立取证。平台画像如被采用，必须标为 `TOPIC_FRAMING` 或 `FORMAT_ADAPTATION`，且不得写入选词或需求证据。`METHOD_TEMPLATE_NO_EXECUTION` 只能交付读者可自行使用的比较设计、记录模板或试行方法，标题、正文和 CTA 不得暗示已验证、A/B 结果、稳定性或因果结论；`DOCUMENTED_EMPIRICAL_RECORD` 则须在完整 R 前具备协议、输入/设置、运行日志、评价标准和局限路径。每张计划图片要有章节锚点、相邻主张、独立读者作用、权利/来源、提示词或视觉简报、Alt 和图注。适用 `LEAD`/`MIDDLE`/`CLOSING` 策略时，首图只覆盖 `LEAD`，其余覆盖区和最低数量同样必须满足，除非用户确认例外。`keyword-research.md`、`brief.md`、`source-ledger.md`、`visual-narrative-plan.md` 和跨语言说明如有需要只能作为从 evidence pack 派生的查阅视图，不得手工双写或成为额外审批门。
5. 编写并依据证据修订唯一基准稿。标题同时按读者任务、主题清晰度、独特价值、自然语言和市场适配判断；默认 `platform_title = canonical_title`，不得把较短的纯关键词标题送入平台标题字段。关键词自然出现于标题、正文前段、有意义的小节与结尾，不追求密度。

### WR 风险升级与可选成文前研究挑战

当冻结为 `INDEPENDENT_R_ESCALATION / WR_INDEPENDENT`，W 完成同样研究、成稿、图片和交付页，再交独立 R 作 `FULL_REVIEW`。仅 `SEPARATE_RESEARCH_REVIEW_REQUIRED` 的 WR 在写大纲或正文前提交研究部分，并取得 `RESEARCH_APPROVED`；它不能代替最终完整审稿。WQ 中如发现高后果/易变结论、冲突或缺失关键证据、误导性图片或实测、CTA 依据不清、重大读者传递风险、无法关闭的核心问题，登记触发 ID 与当前候选哈希，向 G 请求一次单向升级 WR；已升级不得自动降回 WQ。普通多语言、无 Trends、例行 CTA、有边界的 `MODEL_TRANSLATION_FALLBACK` 不是单独升级理由。若改变冻结选题/平台/账号，须用户重新确认，不能伪装质量路线升级。

## 文章包与交接

在 `articles/<article_id>/` 下创建唯一基准稿、metadata、evidence pack、visual manifest、`reviews/`、`handoff/` 和 `article-package.json`。当前 schema-2.14 项目使用 evidence pack schema `1.3` 与文章包 schema `1.5`：metadata 是标题/SEO 元数据唯一来源，evidence pack 是本篇研究及共享引用唯一来源，visual manifest 是图片最终来源；package 只声明上游及哈希，不反指 handoff，也不双写链接/图片。schema-2.13 的默认独立 R 语义和更早版本保留历史兼容。当前只交接人工原生发布，不提供自动发布分支。

正文、metadata、链接、来源、CTA 与最终图片稳定后，仅从 package 所声明且哈希相符的上游用同一编译器生成 `BLOG_3P_VISUAL_PAYLOAD@3` HTML／Markdown；不得手写、二次编辑或用另一正文/metadata。唯一基准稿须在每张图准确位置含独立 `<!-- BLOG_3P_IMAGE:NN -->` 标记，素材为存在且哈希匹配的编号 PNG/JPG/JPEG；不用聚合图槽或 WebP/GIF/SVG。**编译后、WQ 最终自查或 WR 独立 R 前**在内容项目根运行 `harnessctl.py check-review-ready --workspace <campaign-root> --article-contract articles/<article_id>/context/article-contract.json --review-index articles/<article_id>/reviews/review-index.json --article-package articles/<article_id>/article-package.json`。它只校验机械可审性，不产生质量结论。无 `COMPANION_DUAL_READ_REQUIRED` 时仅 HTML 为语义主面，出现回退才双读。WQ `FINAL_BIND` 后若读者可见内容/图片/载荷改变，重新锁候选并完成同一 W 的自查和新哈希回执，不使用 `R_DELTA`；WR 的完整 R 后有限改动才可交同一 R 做有界 `R_DELTA`，纯视觉可走 `R_VISUAL_DELTA`，不明风险转完整 R。禁止自行设计页面壳、CSS、脚本、按钮或图片卡；标题标签不证明公开页面结构。

## 修复

普通修复读取审稿索引、开放问题项证据，保持问题 ID 并更新指纹。WQ 只记录真实问题、定向修复、最终 W 自查回执；WR 有明确批准基线及完整变更摘要才写 `reviews/review-delta-N.json` 并交同一 R 作有限复审。范围升级、哈希漂移、谱系不清或变更超过风险面时转完整 WR 审稿或用户确认。

维护 `requirements-traceability.md`，将适用 `REQ-*` 映射到唯一基准稿和可视化富文本交付页；映射不是质量结论。读者可见改动回到该文 WQ 自查或 WR 同一 R；仅公开页差异不重开写审。

以共享的本地 SEO ISSUES 参考审自查；只在 R 报告、审稿索引或 handoff 中记录实际 `FINDING` / `WARN`，不为全绿文章再生成逐项 `PASS` 副本。它是本地写作标准，不表示外部插件已运行；最终标题层级只能在 `HUMAN_ACCEPTED` 后由公开读者页渲染视觉确认。

日常先读[流程核心](../../docs/workflow-core.md)、文章契约、审稿索引与本轮所涉证据；仅当范围、交接或传递风险实际相关时，按需读取[共享契约](../../docs/contracts.md)或人工发布交接技能的对应段落。机器字段、路径和状态码保持不变。
