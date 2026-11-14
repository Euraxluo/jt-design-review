# 项目规划（design-change-review · 独立商业级 skill）

> 定位：**独立开源产品**。与上游 smyw 分叉关系已终结，不再同步；本仓库自有演进路线。

## 一、产品定位

**给任何技术栈的团队用的「方案确认原型工作台」。**

一次方案讨论（新功能 / 重构 / 集成外部系统）→ Agent 用本 skill 产出**一个单文件 HTML 评审原型** → 业务方/外部系统方在一页上看懂全量变更、点选批注、试玩交互 → 结构化反馈交回 Agent 落实到实现。

**目标用户**：
- 有 AI Agent 辅助开发的工程团队（Claude Code / Codex / Cursor / OpenCode 均可挂载）
- 需要与非技术业务方、外部合作方做技术方案确认的任何项目（Go / Java / Node / Python / 任意栈——skill 只关心「变更描述」，不关心你的构建工具）

**不做什么**：
- 不做通用绘图工具（画图交给 Archify）
- 不做文档站 / Wiki（产出物是评审会用的交互原型，不是长期文档）
- 不绑定任何特定后端框架

## 二、能力全景（当前版本）

| 能力 | 说明 |
|---|---|
| 1:1 页面复刻 | `htmlBefore/htmlAfter` 手写 HTML 复刻真实 UI，@scope 样式隔离 |
| 变更徽标 | build 期注入编号+类型（修改/新增/删除），编号单一事实源，零漂移 |
| 改动单元详情 | 前后复刻小图对照：单屏提取、等比缩放零截断、命中锚点高亮 |
| 任意元素批注 | 点未标注元素自动注册为节点再批注，无死角 |
| 演示模式 | 复刻页以真实 UI 演示，控件执行原型交互（弹窗/跳页/切状态） |
| 系统流程 | Archify 集成（11 种交互图）+ 点选批注外壳 + MD 导出 |
| 数据库变更 | 全量现状盘点 → 逐表独立条目 → 字段级 diff + DDL + 迁移/回滚徽章 |
| 中间件变更 | 决策块（不引入 Kafka/Redis 及量化依据）+ 端点失败语义 + 任务/限流/熔断/可观测 |
| 后端/流程 | 模块级前后对照、流程泳道双向定位 |
| 反馈闭环 | 统一分类批注 → 反馈页汇总 → jdr-patch 结构修改 → apply-feedback 自动应用 |
| 构建期质量门 | 跨池 id 冲突 / 悬空引用 / 缺上下文 / 锚点不可解析 → 一律阻断 |
| 单文件离线 | 截图/图全部内嵌，离线可开，可直接发钉钉/邮件 |

## 三、仓库标准（商业级开源 checklist）

- [x] README：定位、能力表、快速开始、设计原则、文档索引
- [x] SKILL.md：触发条件、工作流、硬性约束（Agent 可执行）
- [x] references/：workflow（必读工作法+踩坑）、spec-format、archify-integration、runtime 架构笔记
- [x] scripts/：build / embed / apply-feedback / wrap-archify，全部 `node --check` 干净
- [x] 语义化 CHANGELOG
- [x] LICENSE（Apache-2.0）
- [x] 构建自检：`build.mjs --check` 最小 spec 通过
- [ ] CI：GitHub Actions 跑 lint（node --check × 4 脚本）+ build smoke（最小 spec）+ runtime 冒烟（Playwright 打开 preview 无 pageerror）——**TODO**
- [ ] 示例库：examples/ 放 1 个完整可开箱体验的示例 spec + 产物——**TODO**
- [ ] skills.sh / 官方市场发布——**TODO（CI 与示例齐后）**

## 四、路线图

### v1.1（近期）
1. **CI 流水线**：lint + smoke + 冒烟（上述 checklist 收口）
2. **开箱示例**：examples/demo-review/（一个虚构但完整的功能变更：复刻页×2 + Archify 流程 + 数据库 3 表 diff + 中间件决策块 + 预置批注演示反馈闭环）
3. **多项目自检命令**：`build.mjs --doctor`（环境/依赖/版本体检，对齐 archify doctor 体验）

### v1.2
4. **反馈管道增强**：反馈 MD 支持 markdown 批注正文；apply-feedback 对 ops 冲突给 diff 预览
5. **数据库盘点半自动化**：提供 Go GORM struct → spec columns 的提取脚本（其他栈按贡献接入）
6. **演示模式 overlay 复刻化**：弹窗/抽屉优先用复刻 HTML 变体渲染（当前为抽象树）

### v1.3+
7. 主题/品牌定制（团队 logo、配色 token 注入）
8. 多方案 A/B 视图（同一变更两套方案并排确认）
9. 英文文档 + i18n（产出物 UI 双语）

## 五、资产布局标准

- **Skill 本体**：`<project>/.agents/skills/design-change-review/`（.agents 是跨工具标准目录，资产跟项目仓库走）
- **评审产物**：`<project>/.agents/jdr/<日期>-<名称>/`（spec.json / preview.html / feedback-v*.md / evidence）
- Skill 也可装到用户级 `~/.agents/skills/`（多项目复用）；项目内副本优先，保证团队开箱一致

## 六、维护纪律

- 任何 runtime 改动必须过 workflow.md「Playwright 必测清单」才能发布
- 破坏性 spec 格式变更：minor 版本 + CHANGELOG 迁移说明 + apply-feedback 兼容旧格式一版
- 每轮用户可见交付：git tag（`vX.Y`）+ CHANGELOG 条目
- 依赖原则：零运行时依赖（单文件 HTML 原生实现）；构建脚本仅 Node 标准库；Archify 为可选外部 skill，缺失时 sysflow 回落泳道
