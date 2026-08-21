/**
 * 外卖优惠助手 — 官方渠道查询引擎
 * 用法:
 *   node find.mjs "点外卖"
 *   node find.mjs "美团"          → 列出美团全部官方领券渠道
 *   node find.mjs "饿了么 红包"    → 按平台+券类型过滤
 *   node find.mjs "学生"          → 学生专属渠道
 *   node find.mjs --list          → 全部平台/渠道概览
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
const require = createRequire(import.meta.url);
const __dir = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = path.join(__dir, '../data/channels.json');

// ─── 平台别名归一化 ──────────────────────────────────────────────────────────
function normalizePlatform(query) {
  const q = query.toLowerCase();
  const db = require(DB_PATH);
  for (const [key, p] of Object.entries(db.platforms)) {
    const names = [p.name.toLowerCase(), ...(p.aliases || []).map(a => a.toLowerCase())];
    if (names.some(n => q.includes(n))) return key;
  }
  return null;
}

// ─── 券类型关键词映射 ──────────────────────────────────────────────────────
const TYPE_KEYWORDS = {
  '红包': ['红包', '领红包'],
  '满减': ['满减', '减'],
  '神券包': ['神券包', '神券', '券包'],
  '新客': ['新客', '新用户', '首单'],
  '学生': ['学生', '校园'],
  '返现': ['返现', '返', '赏金'],
  '折扣': ['折扣', '打折', '优惠'],
  '免单': ['免单', '0元', '霸王餐', '白嫖'],
  '免费领取': ['免费', '白嫖'],
};

// ─── 查询 ────────────────────────────────────────────────────────────────
export function queryChannels(query, opts = {}) {
  const { limit = 10 } = opts;
  const db = require(DB_PATH);
  const q = query.toLowerCase();

  const platformKey = normalizePlatform(query);
  const matchedTypes = new Set();
  for (const [type, kws] of Object.entries(TYPE_KEYWORDS)) {
    if (kws.some(k => q.includes(k.toLowerCase()))) matchedTypes.add(type);
  }

  const results = [];
  for (const [pk, p] of Object.entries(db.platforms)) {
    if (platformKey && pk !== platformKey) continue;
    for (const entry of p.entries) {
      // 评分：平台命中 + 券类型命中
      let score = 0;
      if (!platformKey && matchedTypes.size === 0) score += 1; // 纯模糊查询给底分
      const text = (entry.name + ' ' + entry.note + ' ' + entry.path + ' ' + entry.type.join(' ')).toLowerCase();
      for (const type of matchedTypes) {
        if (entry.type.includes(type)) score += 5;
        if (text.includes(type.toLowerCase())) score += 2;
      }
      if (platformKey) score += 10;
      // 直接词命中
      for (const w of q.split(/[\s,，、]+/).filter(w => w.length > 1)) {
        if (text.includes(w)) score += 3;
      }
      if (score > 0) results.push({ platform: pk, platformName: p.name, ...entry, _score: score });
    }
  }

  return results
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...a }) => a);
}

// ─── 格式化 ──────────────────────────────────────────────────────────────
export function formatResults(results, query) {
  if (results.length === 0) {
    return `未找到与「${query}」匹配的外卖优惠渠道。\n可试试：美团 / 饿了么 / 京东外卖 / 淘宝闪购，或 红包 / 新客 / 学生 / 满减。`;
  }
  const lines = [`🍜 外卖优惠 · 「${query}」(${results.length}条官方渠道)`];
  results.forEach((a, i) => {
    lines.push(`${i + 1}. **${a.platformName} · ${a.name}**`);
    lines.push(`   📝 ${a.note || '—'}`);
    lines.push(`   💳 类型: ${a.type.join(' / ')}`);
    lines.push(`   📍 路径: ${a.path}`);
  });
  lines.push('');
  lines.push('💡 提示：平台券 + 店铺券 + 满减可叠加，下单前先齐三券；具体力度以 App 内实时展示为准。');
  return lines.join('\n');
}

// ─── 概览 ────────────────────────────────────────────────────────────────
export function listAll() {
  const db = require(DB_PATH);
  const lines = ['📦 外卖优惠官方渠道目录\n'];
  for (const [key, p] of Object.entries(db.platforms)) {
    lines.push(`## ${p.name}（${key}）`);
    lines.push(`  入口: ${p.apps.join(' / ')}`);
    p.entries.forEach(e => {
      lines.push(`  - ${e.name} [${e.type.join('|')}]`);
      lines.push(`    ${e.path}`);
    });
    lines.push('');
  }
  lines.push(`💡 组合策略：${db.advice.strategy.join('；')}`);
  return lines.join('\n');
}

// ─── CLI 入口 ────────────────────────────────────────────────────────────
if (process.argv[1] && process.argv[1].includes('find')) {
  const args = process.argv.slice(2);
  if (args.includes('--list')) {
    console.log(listAll());
    process.exit(0);
  }
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 10;
  const fmt = args.includes('--format=json') ? 'json' : 'text';
  const query = args.filter(a => !a.startsWith('--')).join(' ');

  if (!query) {
    console.log('用法: node find.mjs <查询> [--limit=10] [--format=json]  |  node find.mjs --list');
    process.exit(0);
  }
  const results = queryChannels(query, { limit });
  if (fmt === 'json') {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(formatResults(results, query));
  }
}
