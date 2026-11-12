# runtime.js 二开点清单（相对上游 smyw）

升级上游 smyw 时必须重新套用以下改动（assets/runtime.js + style.css）：

1. `h()`：新增 `innerHTML` 属性分支（原版 setAttribute 无效——复刻注入的根因 bug）
2. `image` case：`v.src` 存在时渲染真实 `<img>`（style.css 配套 `.wf-media.img-real`）
3. tabs 数组 + renderTab 路由：新增 `sysflow`（spec.sysflows）、`db`（spec.datachanges）、`mw`（spec.middleware）三个 tab；count 语义见 runtime
4. `renderSysFlows`/`sysFlowSide`：sysflows 渲染（embedHtml → iframe srcdoc；否则按 note 分组分泳道 grid——不要调用不存在的函数，内联构造）
5. `renderDataChanges`/`renderMiddleware`：两表渲染器（.be-tbl / .col-chg 样式）
6. `pageGroup`：`p.htmlBefore||p.htmlAfter` → `htmlReplica(p)` 替代 `renderWF`；overlays/连线不受影响
7. `htmlReplica`：hover 高亮(rep-sel-hover)、点击委托——`[data-kind=node][data-id]`→focusNode、`.mark[data-n]`→focusUnit、其余 `replicaPickable`→`ensureReplicaNode` 自动注册 rep-* 节点（17 类选择器 REPLICA_PICK）
8. style.css 追加：cv-replica*、tipdot/tipcard（在复刻 HTML 自带亦可）、rep-sel-hover、be-tbl、col-chg

build.mjs / apply-feedback.mjs 与上游一致（资产路径相对脚本目录，已随 skill 走）。
