# 工作法：从现状盘点到反馈闭环

## 0. 适用场景

聊完需求/规划后、写代码前的方案确认。产物是一个单文件 HTML，开会直接投屏。

## 1. 现状盘点（先于一切设计）

1. **启动真实应用截图**：
   - dev：`make dev`（Go :8080 + vite :5174）；compose：见项目 deploy/compose（UI 必须跑在宿主 vite，容器内 proxy 不到 host loopback）
   - Playwright 脚本先过 EULA（「继续」按钮），再逐路由 `page.screenshot`
   - **tab 精准原则**：变更发生在哪个 tab/视图，截图就先点开那个 tab（如 market 的「连接器」「我的·我的申请」，identity-access 的 `?view=connector-approvals`）
2. **源码盘点**：前端路由清单（find +page.svelte）、API 路由数（router.go 的 method+path）、CRD 模型（storage/apis）。页面树必须逐一对上源码：TabLayout 每个 view 的 value/label、内层 tabs（如 market 的 selectedMineTab）、列表条目的真实字段（名/理由/时间/徽章）。
3. 截图存 `docs/plans/<area>/evidence/current-pages/`，进 git。

## 2. 复刻原则（htmlBefore/htmlAfter）

- **1:1 临摹大 div 结构**：全局 Layout（侧边栏+导航分组+高亮项）、页面标题栏、tabs、内容区的 section/卡片格/表格。不追求像素，但结构、文案、徽章状态要与真机截图能一一对上。
- **变更点**：`class="mark" data-n="N"`（橙框编号，点击跳左侧清单第 N 项）；新增用 `mark markadd`。
- **说明性内容一律悬浮**：`<span class="tipdot">i<span class="tipcard">说明…</span></span>`——页面本体只放将来真实渲染的 UI 文案，防止"页面内容"与"功能描述"混淆。
- **联动节点**：与 spec 树对应的元素挂 `data-kind="node" data-id="<spec id>"`（如申请按钮→pkg1-apply），点击直达该节点详情（改动前后+批注）。其余任何元素点击会被 runtime 自动注册为 `rep-*` 节点，同样可批注——这就覆盖了"无标注的横杠"类反馈。
- 改动前一侧不加 mark（它是现状基准）。

## 2.5 技术方案纪律（中间件最小化 + 数据库全量盘点）

- **中间件**：默认方案只允许出现 现有组件。新 topic/缓存键/新组件 = 需求明确要求才提，提了就要写选型对比（为什么不用现有回调+轮询/现有表）。中间件变更 tab 里"无变更"也要显式写一行说明"未引入新中间件（复用 HTTP 回调 + DB 轮询）"。
- **数据库**：写 datachanges 前先做全量盘点（来源：CRD=storage/apis 的 Kind→表名全小写；GORM=gateway/types + AutoMigrate 注册）。产出三桶：动（新增/修改/停用）· 不动 · 历史遗留。列字段级 +/~/−，含迁移链路（kinm AutoMigrate 或 GORM migrations 表记账）。

## 3. 各 tab 的 spec 字段

| tab | 字段 | 形态 |
|---|---|---|
| 界面改动 | pages[].htmlBefore/htmlAfter/htmlCss | 复刻双态；无复刻的页退回上游线框（image 节点 src=evidence 相对路径，build 后由 embed.mjs 内嵌 base64） |
| 流程变化 | flows[] | 基础字段（steps: actor/text/fn/node） |
| 系统流程 | sysflows[] | `embedHtml`（| 数据库变更 | datachanges[] | 模块→items[{table, change, columns:[{name,type,change,note}], indexes, note}] |
| 中间件变更 | middleware[] | 模块→items[{name, kind(topic/cache/egress/job), change, config, note}] |
| 后端变化 | backend[] | 基础字段 |

## 4. 构建与验证

```bash
node $SKILL/scripts/build.mjs <spec>
node $SKILL/scripts/embed.mjs <preview.html>
```

**构建期静态检查（build.mjs 自动执行，出错阻断构建）**：
- 全局 id 唯一（pages/flows/backend/**datachanges/middleware/sysflows** 跨池查重——历史 bug：中间件 h1-h6 与数据库历史表撞 id 导致 inspector 显示错条目）
- 引用闭合：trigger / on.target / flow·sysflow 的 node 必须指向存在的 id（悬空引用=✖ 报错）
- modified 条目必须带 before 或 note（否则 ⚠ 看不出改了什么）
- change 值合法 / before 类型 / unchanged+before（现状列清单）豁免警告

**Playwright 必测清单**（历史踩坑都在这）：
- 复刻徽标编号三方一致：图上徽标编号 == 左侧清单编号 == 点开详情标题编号（点 1/2/5 号各验一次）
- 详情面板前后小图：单屏提取正确（点多屏页的两个单元各验一次）、等比无横向溢出（scrollW==clientW）、无纵向截断（frame 底缘 <= 容器底缘）、命中锚点高亮可见
- 演示模式：复刻页渲染真实 UI（非抽象线框）、点控件→弹窗打开→点暗处关闭→换页→再交互，全程 0 pageerror；无复刻页回落抽象线框
- Archify embed（若用）：iframe 内点节点→批注表单打开、点泳道大框→聚合信息（非"SVG 元素"）、导出 MD 可下载
- 复刻 CSS 隔离：htmlCss 已包 @scope(.replica-scope)——检查工具自身布局未被复刻样式污染（body 背景色等）
- 每个自定义 tab 可点且渲染（db: .be-tbl 行数；mw: topic 名出现；sysflow: iframe canvas≥2 或泳道 step 数）
- 复刻 mark 点击 → `#inspector` 出现且内容含该单元 before/after
- `data-kind=node` 点击 → inspector 显示 #id
- 无标注元素点击 → 自动注册 rep-* → 写批注 → 反馈 tab 出现该批注
- `pageerror` 数组为空
- 踩坑记录：
  - runtime `h()` 原版不支持 innerHTML（setAttribute 无效）→ 二开已加分支
  - `</script>` 在 JSON 内嵌时终止外层脚本 → `\u002f` 转义，embed.mjs 自动做
  -   - iframe srcdoc 里 inline script 闭合标签必须是真的 `</script>`（所以只在外层 JSON 转义，srcdoc 内还原）
  - headless Chrome 的 `--virtual-time-budget` 对重 JS 页面要给足 8-12s
  - 跨池 id 冲突会让 findBe 命中错误条目（inspector 文不对题）——新池条目 id 一律加池前缀（mw-/db-），并依赖构建期检查拦截

## 5. 反馈闭环

1. 用户在页面批注/改结构/答问题 → 反馈页「复制反馈」→ 粘贴回对话
2. 原样存 `.jdr/<dir>/feedback-v<N>.md`
3. 有结构修改：`apply-feedback.mjs` 应用补丁（version 校验）；纯批注则直接编辑 spec
4. 落实后 rebuild + re-embed，告诉用户刷新
5. 「必须改」全落实、「建议」不采纳要说明、「疑问」先回答；用户点「确认方案」后才开始实现

## 6. 存档纪律

每轮交付 git 提交；方案大改版前：旧版复制进 `archive/` + git tag（如 jt-integration-v1-20261112）+ 项目记忆记已确认决策。
  - 复刻卡片网格必须 `repeat(3,minmax(0,1fr))`——`1fr` 的 min-content 被 nowrap 文本撑爆会溢出 frame 被裁（Atlassian 卡片曾超界 97-213px）
  - 缩放分母用实测 offsetWidth（transform:none 后测），禁用常量 DW——布局宽与缩放比必须同源
  - 单屏提取（pickScreenHtml）后才按 ratio 等比呈现；整份多屏 HTML 塞小图必然挤压截断
