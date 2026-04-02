/** 演示用各门店广告位列表（与 slots / store-home 一致） */
// slotLatestPhoto 不在此处顶层 require，避免与 inspectorStores → demoSlots → … → inspectorStoreRecords → inspectorStores 形成循环依赖导致白屏

const RAW_SLOTS = [
  { code: 'SZ-FT-LX-01', store: '福田中心店', type: '灯箱', status: '空置', expireAt: '--' },
  { code: 'SZ-FT-LX-02', store: '福田中心店', type: '灯箱', status: '已投放', expireAt: '2026-05-20' },
  { code: 'SZ-FT-LX-03', store: '福田中心店', type: '灯箱', status: '已投放', expireAt: '2026-06-01' },
  { code: 'SZ-NS-LX-01', store: '南山科技园店', type: '灯箱', status: '已投放', expireAt: '2026-04-08' },
  { code: 'SZ-BA-LX-01', store: '宝安壹方城店', type: '灯箱', status: '即将到期', expireAt: '2026-04-05' },
  { code: 'SZ-FT-DT-01', store: '福田中心店', type: '地贴', status: '空置', expireAt: '--' },
  { code: 'SZ-FT-HJ-01', store: '福田中心店', type: '货架', status: '即将到期', expireAt: '2026-04-06' },
  { code: 'SZ-NS-LED-01', store: '南山科技园店', type: 'LED', status: '即将到期', expireAt: '2026-04-07' },
  { code: 'SZ-NS-MT-01', store: '南山科技园店', type: '门头', status: '已投放', expireAt: '2026-05-18' },
  { code: 'SZ-NS-CKY-01', store: '南山科技园店', type: '出库仪', status: '空置', expireAt: '--' },
  { code: 'SZ-BA-HJ-01', store: '宝安壹方城店', type: '货架', status: '即将到期', expireAt: '2026-04-05' },
  { code: 'SZ-BA-DT-01', store: '宝安壹方城店', type: '地贴', status: '空置', expireAt: '--' },
  { code: 'SZ-BA-MT-01', store: '宝安壹方城店', type: '门头', status: '已投放', expireAt: '2026-05-11' },
  { code: 'SZ-LG-LX-01', store: '龙岗万达店', type: '灯箱', status: '已投放', expireAt: '2026-05-28' },
  { code: 'SZ-LG-LX-02', store: '龙岗万达店', type: '灯箱', status: '空置', expireAt: '--' },
  { code: 'SZ-LG-DT-01', store: '龙岗万达店', type: '地贴', status: '已投放', expireAt: '2026-06-10' },
  { code: 'SZ-LG-LED-01', store: '龙岗万达店', type: 'LED', status: '即将到期', expireAt: '2026-04-08' },
  { code: 'SZ-HS-LX-01', store: '龙华红山店', type: '灯箱', status: '已投放', expireAt: '2026-05-15' },
  { code: 'SZ-HS-MT-01', store: '龙华红山店', type: '门头', status: '已投放', expireAt: '2026-06-01' },
  { code: 'SZ-HS-HJ-01', store: '龙华红山店', type: '货架', status: '空置', expireAt: '--' },
  { code: 'SZ-HS-CKY-01', store: '龙华红山店', type: '出库仪', status: '即将到期', expireAt: '2026-04-09' },
  { code: 'SZ-LW-LX-01', store: '罗湖万象店', type: '灯箱', status: '即将到期', expireAt: '2026-04-10' },
  { code: 'SZ-LW-DT-01', store: '罗湖万象店', type: '地贴', status: '空置', expireAt: '--' },
  { code: 'SZ-LW-MT-01', store: '罗湖万象店', type: '门头', status: '已投放', expireAt: '2026-05-22' },
  { code: 'SZ-LW-HJ-01', store: '罗湖万象店', type: '货架', status: '已投放', expireAt: '2026-06-18' },
];

function slotsForStore(storeName) {
  return RAW_SLOTS.filter((s) => s.store === storeName).map((s) => ({
    code: s.code,
    type: s.type,
    status: s.status,
    expireAt: s.expireAt,
  }));
}

/** 全项目出现的全部广告位类型（固定顺序用于门店汇总表，无该类型时填 0） */
const ALL_SLOT_TYPES = [...new Set(RAW_SLOTS.map((s) => s.type))].sort((a, b) =>
  a.localeCompare(b, 'zh-CN')
);

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
 * 本店工作台：按广告位类型分组，含缩略图 URL、状态、到期与临期标记（演示数据）
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
