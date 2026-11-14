---
name: jt-design-review
description: 企业级方案确认工作台：聊完需求和规划后，产出一个单文件 HTML「设计评审原型」，整合 1:1 页面复刻（改动前后对比+可点变更标注+任意元素批注+演示模式）、Archify 交互式系统流程图（点节点批注）、流程泳道、数据库逐表变更 diff、中间件变更、后端模块变更、真机现状截图，全套共用一套批注/反馈管线。适用于任何技术栈的项目需要与业务方/外部系统方开会确认整体技术方案的场合；不适用于纯代码实现或与方案确认无关的日常改动。
metadata:
  short-description: 方案确认原型工作台（复刻+Archify流程图+全维度变更+批注反馈）
---

# jt-design-review：方案确认原型工作台

一次方案确认 → 一个自包含目录 → 一个可交互 HTML。业务方在页面上看懂"每个页面怎么变、系统怎么协作、表和中间件怎么改"，直接批注、改结构，再把反馈交回 Agent。

适用于任何技术栈（Go/Java/Node/Python/…）——skill 只消费「变更描述 spec」，不关心项目的构建工具与框架。

## 脚本（scripts/）

| 脚本 | 作用 |
|---|---|
| `build.mjs` | 校验 spec → 生成单文件 `preview.html`（纯前端、离线可开）。校验含：跨池 id 唯一性、trigger/on.target/node 引用闭合、modified 条目上下文、复刻锚点 `data-replica-unit` 可解析——出错**阻断构建** |
| `embed.mjs` | 构建后处理：真机截图 base64 内嵌 + 复刻 HTML `</` 安全转义 + 哨兵校验（不内嵌不交付） |
| `apply-feedback.mjs` | 从用户粘贴回来的反馈生成下一版 spec（version+1），支持 jdr-patch 结构修改 |
| `wrap-archify.mjs` | 给 Archify 渲染产物加「点选批注」外壳（与原型反馈同款分类/导出） |

## 文档（references/）

| 文档 | 内容 |
|---|---|
| `workflow.md` | **必读**——完整工作法（现状盘点→复刻→标注→批注闭环→验证清单）+ 全部踩坑记录 |
| `spec-format.md` | spec 完整字段（含扩展：复刻 HTML/sysflows/datachanges/middleware/data-replica-unit 契约） |
| `archify-integration.md` | Archify 集成：分工、命令、schema 要点、陷阱 |
| `runtime-notes.md` | runtime 架构笔记（渲染管线/关键函数/修改入口） |

## 什么时候用

- 用户说「出个方案确认页」「做成评审原型」「把方案整合到一个页面开会用」时
- 需求聊完、规划定稿后，**写代码之前**的确认阶段（`stage: "prototype"`）；实现后回顾用 `stage: "done"`
- 变更涉及多个维度：页面 + 系统协作 + 数据库 + 中间件 + 后端，需要一页全量呈现

## 工作流（细节见 references/workflow.md）

### 1. 现状盘点
- 运行真实应用（任何方式：make dev / docker compose / 本地服务），浏览器自动化逐路由截图，**变更发生在哪个 tab/视图就打开那个 tab 再截**
- 从源码盘点真实结构：路由数 / API 数 / 数据模型 / 数据库全量表清单，分区归组；页面树必须和源码结构对得上

### 2. 写 spec（`.jdr/<日期>-<名称>/spec.json`）
一棵合并树 + 扩展字段：
- `pages[].htmlBefore / htmlAfter / htmlCss`：**1:1 手写 HTML 复刻**替代抽象线框。变更元素只挂 `data-replica-unit="<spec节点id>"`——编号/颜色由 build.mjs 静态注入，**零手写编号**；说明放 `tipdot` 悬浮卡
- `sysflows[]`：系统流程——**首选 Archify embed**（`archify render` → `wrap-archify.mjs` → `embedHtml` iframe，点节点批注）；无 embed 回落泳道步骤；Archify 未安装也能工作
- `datachanges[]`：数据库变更——模块(库/域)→**逐表独立条目**→字段级 diff（`+ 新增/~ 修改附旧值/− 删除/· 不变` 全列出）、SQL 类型、迁移+回滚徽章；"不动"的表也显式列出
- `middleware[]`：中间件变更——决策块(kind=decision)/出站/入站端点/后台任务/限流熔断/可观测，参数+失败语义结构化
- 其余（pages/flows/backend/questions/changes）见 spec-format.md

### 3. 构建与后处理
```bash
node $SKILL/scripts/build.mjs .jdr/<dir>/spec.json      # 校验+注入徽标, 出错阻断
node $SKILL/scripts/embed.mjs .jdr/<dir>/preview.html   # 截图内嵌 + </ 转义
```

### 4. 交互验证（必须做，不许只看构建成功）
Playwright 真实点击验证（清单见 workflow.md）：徽标编号三方一致、详情小图单屏等比无截断、演示模式交互链、Archify 点选批注、CSS 隔离。

### 5. 交给用户 → 等反馈 → 应用反馈
用户「复制反馈」粘贴回来 → 存 `feedback-v<N>.md` →
```bash
node $SKILL/scripts/apply-feedback.mjs .jdr/<dir>/feedback-v<N>.md .jdr/<dir>/spec.json
```
批注落实后重新 build + embed。原型确认前不写实现代码。

## 硬性约束

- **中间件最小化**：默认不引入新中间件（Kafka/Redis 等）。能复用现有机制就不新增（回调+轮询兜底）。用户明确要求才引入，且必须给选型对比并标注"用户要求引入"
- **数据库变更先盘点后变更**：datachanges 只允许真实存在的表（表名/字段以代码盘点为准），逐表标注 新增/修改/停用/不动；"不动"也列出（防遗漏），禁止拍脑袋
- **单文件离线**：截图/Archify 产物必须内嵌，禁止运行时外链
- **嵌套转义**：HTML 进 spec JSON 时 `</` 必须转义——一律走 `embed.mjs`，不要手拼
- **编号单一事实源**：复刻徽标编号由 build 时计算注入，spec/HTML 里禁止手写编号；新池条目 id 加池前缀（mw-/db-）防跨池冲突
- 每轮交付后 git 提交（spec + preview + evidence），方案大版本前打 tag 存档
