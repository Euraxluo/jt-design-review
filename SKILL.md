---
name: jt-design-review
description: 企业级方案确认工作台：聊完需求和规划后，产出一个单文件 HTML「设计评审原型」，整合 1:1 页面复刻（改动前后对比+可点变更标注+任意元素批注）、Excalidraw 系统架构图（可编辑嵌入）、流程泳道、数据库表变更、中间件变更、后端模块变更、真机现状截图，全套共用一套批注/反馈管线。适用于需要与业务方/外部系统方开会确认整体技术方案的场合；不适用于纯代码实现或与方案确认无关的日常改动。
metadata:
  short-description: 方案确认原型工作台（复刻+架构图+全维度变更+批注反馈）
---

# jt-design-review：方案确认原型工作台

一次方案确认 → 一个自包含目录 → 一个可交互 HTML。业务方在页面上看懂"每个页面怎么变、系统怎么协作、表和中间件怎么改"，直接批注、改结构，再把反馈交回 Agent。

本 skill 是对上游 `smyw`（show-me-you-want）的深度二开 + Excalidraw 嵌入。**skill 目录（下文 `$SKILL`）里有：**

- `scripts/build.mjs`：校验 spec，生成单文件 `preview.html`（纯前端、离线可开）
- `scripts/apply-feedback.mjs`：从用户粘贴回来的反馈生成下一版 spec
- `scripts/embed.mjs`：构建后处理——真机截图 base64 内嵌、复刻 HTML 的 `</` 安全转义
- `scripts/build-excalidraw.mjs`：把 `.excalidraw` 场景打包成可嵌入的 React 单文件 HTML（本地 node_modules，见 references/excalidraw-embed.md）
- `references/spec-format.md`：spec 完整字段（上游格式 + 本 skill 扩展字段）
- `references/workflow.md`：**必读**——本 skill 的完整工作法（复刻→标注→嵌入→批注闭环），第一次使用前先读一遍
- `references/assets-notes.md`：runtime 二开点清单（改过上游的哪些函数，升级上游时要重新套用）
- `assets/`：二开后的 runtime.js / style.css / template.html（与上游 smyw 的差异即本 skill 的核心）

## 什么时候用

- 用户说「出个方案确认页」「做成评审原型」「把方案整合到一个页面开会用」时
- 需求聊完、规划定稿后，**写代码之前**的确认阶段（`stage: "prototype"`）；实现后回顾用 `stage: "done"`
- 变更涉及多个维度：页面 + 系统协作 + 数据库 + 中间件 + 后端，需要一页全量呈现

## 工作流（细节见 references/workflow.md）

### 1. 现状盘点
- 启动真实应用（本机 dev 或 compose 栈），Playwright 过 EULA 后逐路由截图，**变更发生在哪个 tab/视图就打开那个 tab 再截**
- 从源码盘点真实结构：路由数 / API 数 / CRD 模型，分区归组；页面树必须和源码结构对得上（TabLayout 的每个 view、内层 tabs、列表条目字段）

### 2. 写 spec（`.smyw/<日期>-<名称>/spec.json`）
一棵合并树 + 本 skill 扩展字段：
- `pages[].htmlBefore / htmlAfter / htmlCss`：**1:1 手写 HTML 复刻**替代抽象线框（大 div 结构即可：侧边栏/tab/卡片格/表格；变更点 `class="mark" data-n="N"`，说明放 `tipdot` 悬浮卡，页面本体只放真实 UI 文案）
- `sysflows[]`：系统流程——`embedHtml`（可编辑 Excalidraw iframe）或按阶段分组的泳道步骤
- `datachanges[]`：数据库变更——模块(库/域)→表→字段级增删(+/~/−)、索引、迁移说明
- `middleware[]`：中间件变更——Kafka topic/Redis key/出站端点/定时任务
- 其余（pages/flows/backend/questions/changes）沿用上游格式

### 3. 构建与后处理
```bash
node $SKILL/scripts/build.mjs .smyw/<dir>/spec.json
node $SKILL/scripts/embed.mjs .smyw/<dir>/preview.html   # 截图内嵌 + </ 转义
```

### 4. 交互验证（必须做，不许只看构建成功）
Playwright 真实点击验证：tab 切换、复刻 mark 编号点击→详情面板、任意元素点击→自动注册→批注→反馈页汇总、Excalidraw iframe canvas 数 ≥2。出过错的历史点见 workflow.md「踩坑记录」。

### 5. 交给用户 → 等反馈 → 应用反馈
用户「复制反馈」粘贴回来 → 存 `feedback-v<N>.md` →
```bash
node $SKILL/scripts/apply-feedback.mjs .smyw/<dir>/feedback-v<N>.md .smyw/<dir>/spec.json
```
在批注落实后重新 build + embed。原型确认前不写实现代码。

## 硬性约束

- 单文件离线：所有截图/Excalidraw 包必须 base64/打包内嵌，禁止外链 CDN 依赖运行时资源
- 嵌套转义：复刻 HTML 或 Excalidraw HTML 进入 spec JSON 时，`</` 必须转义为 `</`（JSON `\u002f`），否则外层 `<script>` 被提前终止——一律走 `embed.mjs`，不要手拼
- runtime 是二开版：`h()` 支持 `innerHTML`；pageGroup 支持 htmlBefore/htmlAfter/sysflow embed/db/mw tabs——升级上游 smyw 前先读 assets-notes.md
- 每轮交付后 git 提交（spec + preview + 截图 evidence），方案大版本前打 tag 存档
