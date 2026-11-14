# Changelog

本项目的显著变更记录。格式遵循 [Keep a Changelog](https://keepachangelog.com/)，版本遵循 [SemVer](https://semver.org/)。

## [1.0.0] - 2026-11-13

首个独立版本（与历史分叉上游终止同步，自有路线）。

### 核心能力
- 单文件 HTML 评审原型：界面改动（1:1 复刻+变更徽标）/ 流程变化 / 系统流程 / 数据库变更 / 中间件变更 / 后端变化 / 反馈 七 tab
- 复刻标注体系：`data-replica-unit` 锚点 + build 期静态注入编号/颜色/中文类型徽标（单一事实源，零手写编号）
- 改动单元详情：前后复刻小图对照，单屏提取（pickScreenHtml）+ 实测宽等比缩放（fitbox），零横向溢出/零纵向截断
- 任意元素点击自动注册批注；@scope(.replica-scope) 复刻样式隔离
- 演示模式：复刻页以真实 UI 演示原型交互（open/close/navigate/state/back）
- Archify 集成：系统流程 tab 嵌入交互图 + wrap-archify.mjs 点选批注外壳（泳道大框聚合标注）
- 数据库变更：逐表独立条目 + 字段级 diff（+/~/−/·）+ SQL 类型 + 迁移/回滚徽章
- 中间件变更：决策块（量化依据）+ 端点失败语义 + 任务/限流/熔断/可观测
- 反馈闭环：统一批注分类 + jdr-patch 结构修改 + apply-feedback 自动应用（兼容旧 smyw-patch 格式）
- 构建期质量门：跨池 id 冲突 / 悬空引用（trigger/on.target/node） / modified 缺上下文 / 锚点不可解析 → 阻断构建

### 工程化
- scripts: build / embed / apply-feedback / wrap-archify（零 npm 依赖）
- references: workflow / spec-format / archify-integration / runtime-notes
- SKILL.md + README + ROADMAP + CHANGELOG + LICENSE
