# 安全策略

## 支持版本

| 版本 | 状态 |
|---|---|
| 1.x | ✅ 支持 |

## 报告漏洞

发现安全问题请**不要开公开 issue**。通过 GitHub Security Advisories
（仓库 Security 标签页 → Report a vulnerability）私密报告，或在无法使用时
联系仓库 owner。我们会在 72 小时内响应。

## 安全边界（已知设计取舍）

- 产物 HTML 是**评审原型**，会内嵌截图/图示与批注文本——不要把涉密内容放入 spec
- 评审页使用 `file://` 离线打开，无网络请求；但 iframe srcdoc 嵌入的第三方图（如
  Archify 产物）以其自身安全模型为准
- `apply-feedback.mjs` 处理用户粘贴的 Markdown；它只解析固定格式块，不做任意代码执行
