/** 各门店广告位清单（可由接口下发；初始无预置行，类型列表仍用于表单） */
// slotLatestPhoto 不在此处顶层 require，避免与 inspectorStores → demoSlots → … → inspectorStoreRecords → inspectorStores 形成循环依赖导致白屏

const RAW_SLOTS = [];

const DEFAULT_SLOT_TYPES = ['灯箱', '地贴', '货架', 'LED', '门头', '出库仪'];

const ALL_SLOT_TYPES =
  RAW_SLOTS.length > 0
    ? [...new Set(RAW_SLOTS.map((s) => s.type))].sort((a, b) => a.localeCompare(b, 'zh-CN'))
    : [...DEFAULT_SLOT_TYPES].sort((a, b) => a.localeCompare(b, 'zh-CN'));

function slotsForStore(storeName) {
  return RAW_SLOTS.filter((s) => s.store === storeName).map((s) => ({
    code: s.code,
    type: s.type,
    status: s.status,
    expireAt: s.expireAt,
  }));
}

const VACANT_THUMB =
  'https://dummyimage.com/300x200/f3f4f6/9ca3af.png&text=%E7%A9%BA%E7%BD%AE';

function _daysUntilExpire(expireStr, now) {
  if (!expireStr || expireStr === '--') return null;
  const p = expireStr.split('-').map(Number);
  if (p.length !== 3 || p.some((x) => Number.isNaN(x))) return null;
  const end = new Date(p[0], p[1] - 1, p[2]);
  const d = new Date(now || new Date());
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((end - start) / 86400000);
}

/**
 * 本店工作台：按广告位类型分组，含缩略图 URL、状态、到期与临期标记
 */
function buildStoreVisualGroups(storeName) {
  const slotLatestPhoto = require('./slotLatestPhoto.js');
  const rows = slotsForStore(storeName);
  const byType = {};
  const now = new Date();
  rows.forEach((s) => {
    const d = _daysUntilExpire(s.expireAt, now);
    const expireSoon = d !== null && d >= 0 && d <= 7;
    const showExpireBadge = s.status === '即将到期' || expireSoon;
    const fallbackThumb =
      s.status === '空置' ? VACANT_THUMB : `https://picsum.photos/seed/${encodeURIComponent(s.code)}/300/200`;
    const thumb = slotLatestPhoto.getLatestThumbForSlot(s.code, fallbackThumb);
    const statusClass =
      s.status === '空置' ? 'vacant' : s.status === '即将到期' || expireSoon ? 'soon' : 'on';
    const item = {
      code: s.code,
      status: s.status,
      expireAt: s.expireAt,
      expireDisplay: s.expireAt === '--' ? '—' : s.expireAt,
      thumb,
      expireSoon,
      showExpireBadge,
      statusClass,
    };
    if (!byType[s.type]) byType[s.type] = [];
    byType[s.type].push(item);
  });
  const ordered = [];
  ALL_SLOT_TYPES.forEach((t) => {
    if (byType[t] && byType[t].length) {
      byType[t].sort((a, b) => String(a.code).localeCompare(String(b.code), 'zh-CN'));
      ordered.push({ type: t, count: byType[t].length, items: byType[t] });
    }
  });
  Object.keys(byType).forEach((t) => {
    if (!ALL_SLOT_TYPES.includes(t) && byType[t].length) {
      byType[t].sort((a, b) => String(a.code).localeCompare(String(b.code), 'zh-CN'));
      ordered.push({ type: t, count: byType[t].length, items: byType[t] });
    }
  });
  return ordered;
}

module.exports = {
  RAW_SLOTS,
  slotsForStore,
  ALL_SLOT_TYPES,
  buildStoreVisualGroups,
};
