/**
 * 预估收益展示：formatYuan / monthLabel 等工具；行数据由 storeRevenueCalc 等按规则计算
 */
const demoSlots = require('./demoSlots.js');

/** 与 demoSlots 中 code 一一对应（预留；无预置广告位时为空） */
const MONTH_REVENUE_YUAN = {};

function formatYuan(n) {
  const v = Math.round(Number(n)) || 0;
  if (v === 0) return '¥0';
  const s = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `¥${s}`;
}

function rowsForStore(storeName) {
  const slots = demoSlots.slotsForStore(storeName);
  return slots.map((s) => {
    const amount = MONTH_REVENUE_YUAN[s.code] != null ? MONTH_REVENUE_YUAN[s.code] : 0;
    return {
      ...s,
      revenueYuan: amount,
      revenueText: formatYuan(amount),
    };
  });
}

function totalForStore(storeName) {
  return rowsForStore(storeName).reduce((sum, r) => sum + r.revenueYuan, 0);
}

function monthLabel() {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

module.exports = {
  rowsForStore,
  totalForStore,
  formatYuan,
  monthLabel,
};
