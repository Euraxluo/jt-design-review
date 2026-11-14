# runtime 架构笔记（assets/runtime.js）

单文件 ~2100 行 vanilla JS，无依赖。改 runtime 前先读这份，改完必须过 workflow.md 必测清单。

## 渲染管线

```
render() ─┬─ 评审模式(ui.tab): canvas(页面画布) / flows / sysflow / datachanges / middleware / backend / feedback
          ├─ 演示模式(ui.play): renderPlay → playReplicaBody(复刻页) | renderWF(抽象页) + playOverlay
          └─ 编辑模式(ui.mode=edit): palette 拖拽 + opAdd/opMove + inspector 编辑
```

## 关键函数地图

| 区域 | 函数 | 说明 |
|---|---|---|
| 状态 | `S`(spec)/`ui`/`mutate` | 全部变更走 mutate(undo/redo 栈) |
| 单元 | `computeUnits`/`unitOf`/`UNIT_BY` | 改动单元=最外层非 unchanged 节点；编号全局顺序派生 |
| 画布复刻 | `htmlReplica` | htmlBefore/After 双栏 + @scope(.replica-scope) 样式隔离 |
| 点击委托 | htmlReplica.onclick | 三级：data-replica-unit→focusUnit > data-kind=node→focusNode > rep-*注册 |
| 详情小图 | `detailRender`/`pickScreenHtml`/fitScale | 单屏提取(DOMParser) + 实测宽等比缩放(fitbox 模式) + 命中高亮 |
| 演示 | `playReplicaBody`/`runIA`/`applyIA` | 复刻页交互=runIA 委托(open/close/navigate/state/back) |
| 数据库 | `dbSide`/`dbBox`/`tableDiffCard`/`colLineEl` | 逐表 diff 卡(卡内 before/after 并排) |
| 中间件 | `mwSide`/`mwBox`/决策块 | kind: egress/ingress/job/ratelimit/circuit/metrics/alert/trace/decision |
| 反馈 | `addComment`/反馈页/jdr-patch | 结构修改采集 → 反馈 MD → apply-feedback 回放 |
| 构建(镜像) | build.mjs 内 computeUnitsBuild/unitOfBuild/injectReplicaUnits | 与 runtime 同算法: 徽标编号/颜色/中文类型静态注入 |

## 修改入口速查

- 新增 tab：renderTabs 处注册 + 渲染函数 + build.mjs 校验池（记得跨池 id 前缀）
- 复刻视觉调整：style.css 的 .cv-replica / [data-unit-n] 区段
- 徽标样式：CSS 伪元素 `::after content:attr(data-unit-n) " " attr(data-unit-chg-zh)`
- 小图缩放：detailRender 的 fitScale（勿回退常量分母——见踩坑）

## 已知陷阱（历史 bug 存档）

- `@scope` 隔离前：复刻全局选择器污染工具布局
- 缩放分母常量化：布局宽与缩放比双源漂移 → 必须实测 offsetWidth
- `1fr` 网格轨道：nowrap 文本把 min-content 撑爆溢出 → minmax(0,1fr)
- 跨池 id 冲突：findBe 命中错条目 → 池前缀 + 构建期校验
- visItems 对字符串 columns 崩溃 → Array.isArray 防御
