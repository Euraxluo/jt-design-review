#!/usr/bin/env node
// wrap-archify.mjs — 给 Archify 渲染产物加「点选批注」外壳。
// 嵌入 design-change-review 系统流程 tab(iframe srcdoc)时: 批注 postMessage 直通外层统一反馈管线(单一存储)。
// 独立打开(无父页面)时: 回落 localStorage + 导出 MD。
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const args = process.argv.slice(2);
if (args.length < 1) { console.error('用法: node wrap-archify.mjs <archify-output.html> [-o wrapped.html] [--flow <sysflow-id>]'); process.exit(1); }
const srcPath = resolve(args[0]);
const flowId = args[args.indexOf('--flow') + 1] || '';
const outPath = mapOut();
function mapOut() {
  const i = args.indexOf('-o');
  return i >= 0 && args[i + 1] ? resolve(args[i + 1]) : join(dirname(srcPath), srcPath.replace(/\.html$/, '') + '-review.html');
}
const html = readFileSync(srcPath, 'utf8');

const shell = `
<div id="arw-bar">
  <b id="arw-title"></b>
  <span id="arw-mode"></span>
  <span id="arw-count"></span>
  <button id="arw-export" class="arw-btn" hidden>导出反馈</button>
  <button id="arw-clear" class="arw-btn ghost" hidden>清空</button>
</div>
<div id="arw-side" hidden>
  <div id="arw-info" class="arw-empty">点击图中任意元素写批注</div>
  <div id="arw-form" hidden>
    <div class="arw-row"><select id="arw-cat">
      <option>疑问</option><option>必须改</option><option>建议</option>
      <option>位置/布局</option><option>交互方式</option><option>内容缺失</option><option>其他</option>
    </select><select id="arw-sev"><option>建议</option><option>必须改</option><option>疑问</option></select></div>
    <textarea id="arw-text" placeholder="写下你的意见（Ctrl+Enter 添加）"></textarea>
    <button id="arw-add" class="arw-btn">添加批注</button>
  </div>
  <div id="arw-list"></div>
</div>
<style>
#arw-bar{position:fixed;top:0;left:0;right:0;height:44px;background:#1c2024;color:#fff;display:flex;align-items:center;gap:12px;padding:0 14px;z-index:9999;font:13px/1 system-ui}
#arw-bar b{font-size:14px}
#arw-mode{color:#69db7c;font-size:12px}
#arw-count{color:#9db3c8;font-size:12px}
.arw-btn{background:#4c6ef5;color:#fff;border:0;border-radius:6px;padding:5px 12px;font-size:12.5px;cursor:pointer;margin-left:auto}
.arw-btn.ghost{background:transparent;border:1px solid #5a6572;margin-left:6px}
body.arw-embedded #arw-side{display:none!important}
body.arw-embedded{padding-right:0!important}
#arw-side{position:fixed;top:44px;right:0;bottom:0;width:320px;background:#fff;border-left:1px solid #d8dee6;z-index:9998;overflow:auto;padding:12px;font:13px/1.5 system-ui;box-shadow:-4px 0 14px rgba(0,0,0,.08)}
#arw-info{background:#f6f8fa;border:1px solid #e1e6eb;border-radius:8px;padding:8px 10px;font-size:12.5px;color:#333;white-space:pre-wrap}
.arw-empty{color:#8b949e}
#arw-form{margin-top:10px;display:flex;flex-direction:column;gap:6px}
.arw-row{display:flex;gap:6px}
#arw-side select{flex:1;border:1px solid #d0d7de;border-radius:6px;padding:4px 6px;font-size:12.5px;background:#fff}
#arw-text{width:100%;box-sizing:border-box;height:84px;border:1px solid #d0d7de;border-radius:6px;padding:6px 8px;font-size:12.5px;resize:vertical}
#arw-list{margin-top:12px;display:flex;flex-direction:column;gap:8px}
.arw-item{border:1px solid #e1e6eb;border-left:3px solid #4c6ef5;border-radius:6px;padding:6px 8px;font-size:12px;background:#fbfcfe}
.arw-item .m{color:#8b949e;font-size:11px;margin-bottom:2px}
.arw-item .del{float:right;color:#c92a2a;cursor:pointer}
.arw-hl{outline:3px solid #4c6ef5!important;outline-offset:2px;border-radius:4px}
</style>
<script>
(function(){
  var FLOW_ID = '__FLOW_ID__';
  var CUR = null;
  var EMBEDDED = false;
  try { EMBEDDED = window.parent !== window && !!window.parent.postMessage; } catch (e) {}
  var store = [];
  if (!EMBEDDED) { store = JSON.parse(localStorage.getItem('arw-feedback') || '[]'); }
  if (EMBEDDED) document.body.classList.add('arw-embedded');
  var info = document.getElementById('arw-info');
  var form = document.getElementById('arw-form');
  var list = document.getElementById('arw-list');
  document.getElementById('arw-title').textContent = document.title || 'Archify 图评审';
  if (EMBEDDED) {
    document.getElementById('arw-mode').textContent = '点节点 → 右侧统一批注面板';
  } else {
    document.getElementById('arw-side').hidden = false;
    document.getElementById('arw-export').hidden = false;
    document.getElementById('arw-clear').hidden = false;
  }
  function label(el){
    if (!el) return '';
    var cur = el, best = null, bestLen = 0;
    for (var i = 0; i < 4 && cur; i++) {
      var t = (cur.textContent || '').replace(/\\s+/g, ' ').trim();
      if (t.length > bestLen) { best = cur; bestLen = t.length; }
      cur = cur.parentElement && cur.parentElement.closest('svg g');
    }
    var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    if (r && r.width > 150 && bestLen < 4) {
      var inside = [];
      document.querySelectorAll('svg g').forEach(function(g2){
        var t2 = (g2.textContent || '').replace(/\\s+/g, ' ').trim();
        if (!t2 || t2.length > 40 || !g2.getBoundingClientRect) return;
        var b2 = g2.getBoundingClientRect();
        if (b2.width && b2.height && b2.left >= r.left - 4 && b2.right <= r.right + 4 && b2.top >= r.top - 4 && b2.bottom <= r.bottom + 4) inside.push(t2);
      });
      if (inside.length) return '泳道/分组框（含 ' + inside.length + ' 个节点: ' + inside.slice(0, 4).join(' · ') + (inside.length > 4 ? ' …' : '') + '）';
    }
    var el2 = best || el;
    var txt = (el2.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 70);
    var id = el2.getAttribute('data-id') || el2.getAttribute('id') || '';
    return (txt || 'SVG 元素') + (id ? ' #' + id : '');
  }
  function render(){
    if (EMBEDDED) { document.getElementById('arw-count').textContent = ''; return; }
    list.innerHTML = '';
    store.forEach(function(f, i){
      var d = document.createElement('div'); d.className = 'arw-item';
      d.innerHTML = '<span class="del" data-i="' + i + '">✕</span><div class="m">' + f.cat + ' · ' + f.target + ' · ' + f.time + '</div>' + f.text.replace(/</g, '&lt;');
      list.appendChild(d);
    });
    document.getElementById('arw-count').textContent = store.length ? store.length + ' 条批注' : '';
  }
  document.addEventListener('click', function(ev){
    document.querySelectorAll('.arw-hl').forEach(function(x){ x.classList.remove('arw-hl'); });
    var el = ev.target.closest('#arw-side, #arw-bar') ? null : ev.target.closest('svg g[data-id], svg g, [class*="node"], [class*="card"], rect, text');
    if (!el) { if (!EMBEDDED) form.hidden = true; return; }
    CUR = el; el.classList.add('arw-hl');
    var lb = label(el);
    if (EMBEDDED) {
      // 单一 UI: 只通知外层打开标准批注面板, 壳内无表单
      window.parent.postMessage({ type: 'jdr-archify-select', flow: FLOW_ID, anchor: lb }, '*');
    } else {
      info.textContent = lb; info.classList.remove('arw-empty');
      form.hidden = false;
    }
  });
  function add(){
    var t = document.getElementById('arw-text').value.trim();
    if (!t || !CUR) return;
    store.unshift({ cat: document.getElementById('arw-cat').value, target: label(CUR), text: t, time: new Date().toLocaleString('zh-CN') });
    localStorage.setItem('arw-feedback', JSON.stringify(store));
    document.getElementById('arw-text').value = '';
    render();
  }
  document.getElementById('arw-add').onclick = add;
  document.getElementById('arw-text').addEventListener('keydown', function(e){ if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') add(); });
  list.addEventListener('click', function(e){
    if (e.target.classList.contains('del')) { store.splice(+e.target.dataset.i, 1); localStorage.setItem('arw-feedback', JSON.stringify(store)); render(); }
  });
  document.getElementById('arw-export').onclick = function(){
    var md = store.map(function(f){ return '- [' + f.cat + '] ' + f.target + ': ' + f.text + '  (' + f.time + ')'; }).join('\\n');
    var blob = new Blob(['# Archify 图评审反馈\\n\\n' + (md || '（无）')], { type: 'text/markdown' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'archify-feedback.md'; a.click();
  };
  document.getElementById('arw-clear').onclick = function(){ if (confirm('清空全部批注?')) { store = []; localStorage.setItem('arw-feedback', '[]'); render(); } };
  render();
})();
</script>
`;
const finalShell = shell.replace('__FLOW_ID__', flowId);
let out = html;
if (/<body[^>]*>/.test(out)) out = out.replace(/(<body[^>]*>)/, '$1' + finalShell);
else out = finalShell + out;
out = out.replace('</head>', '<style>body{padding-top:44px!important;box-sizing:border-box}</style></head>');
writeFileSync(outPath, out);
console.log('✔ 已生成 ' + outPath);
