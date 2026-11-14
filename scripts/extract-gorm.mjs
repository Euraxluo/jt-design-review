#!/usr/bin/env node
// extract-gorm.mjs — 从 Go GORM struct 源码提取表列清单, 输出 design-change-review
// datachanges 可用的 columns JSON 片段（半自动盘点的第一步：Agent 再补 change/语义标注）。
// 用法: node extract-gorm.mjs <types.go...> [--table users]
// 解析规则: struct 名 snake_case 复数 = 表名(可用 --table 覆盖); gorm tag 的 column/type
// 或字段名推断; primaryKey→PK, uniqueIndex→UQ, index→IDX, default:x→def=x
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith('--'));
const tblOverride = args.includes('--table') ? args[args.indexOf('--table') + 1] : null;
if (!files.length) { console.log('用法: node extract-gorm.mjs <types.go...> [--table <表名>]\n输出: 每个含 gorm tag 的 struct 一段 columns JSON'); process.exit(2); }

const GO2SQL = { string: 'TEXT', uint: 'BIGINT', uint8: 'SMALLINT', uint16: 'INTEGER', uint32: 'BIGINT', int: 'BIGINT', int64: 'BIGINT', int32: 'BIGINT', float64: 'DOUBLE PRECISION', float32: 'REAL', bool: 'BOOLEAN', 'time.Time': 'TIMESTAMPTZ', '[]byte': 'BYTEA', 'datatypes.JSON': 'JSONB', 'uuid.UUID': 'UUID' };
const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/IDs$/, 'ids').replace(/IDs([A-Z])/g, 'ids_$1').toLowerCase();

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const re = /type\s+(\w+)\s+struct\s*\{([\s\S]*?)\n\}/g;
  let m;
  while ((m = re.exec(src))) {
    const [, name, body] = m;
    const cols = [];
    for (const line of body.split('\n')) {
      const fm = line.match(/^\s*(\w+)\s+([\w.[\]]+)\s+`([^`]*)`/);
      if (!fm) continue;
      const [, field, gotype, tags] = fm;
      const gorm = (tags.match(/gorm:"([^"]*)"/) || [])[1] || '';
      // json:"-" 且无 gorm 列信息的跳过; 其余(含仅 json tag 的 GORM 管理列)都提取
      const col = (gorm.match(/column:(\w+)/) || [])[1] || snake(field);
      let type = (gorm.match(/type:([\w() ]+?)(?:;|")/) || [])[1];
      type = (type || GO2SQL[gotype] || 'TEXT').trim();
      if (/primaryKey/.test(gorm) || (field === 'ID' && !gorm)) type += '·PK';
      if (/uniqueIndex|unique/.test(gorm)) type += '·UQ';
      else if (/index/.test(gorm)) type += '·IDX';
      const def = (gorm.match(/default:([^;"]+)/) || [])[1];
      if (def) type += '·def=' + def;
      cols.push({ name: col, type, change: 'unchanged', note: gotype.startsWith('time.Time') ? '时间戳' : '' });
    }
    if (!cols.length) continue;
    const tbl = tblOverride || snake(name);
    const table = /s$/.test(tbl) ? tbl : tbl + 's';
    console.log(JSON.stringify({ table, owner: f, columns: cols }, null, 2));
  }
}
