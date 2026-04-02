/**
 * 各广告位「本月」预估收益演示数据（元）；空置为 0
 * 上线后由接口按门店、账期返回
 */
const demoSlots = require('./demoSlots.js');

/** 与 demoSlots 中 code 一一对应 */
const MONTH_REVENUE_YUAN = {
  'SZ-FT-LX-01': 0,
  'SZ-FT-LX-02': 12800,
  'SZ-FT-DT-01': 0,
  'SZ-FT-HJ-01': 9620,
  'SZ-NS-LED-01': 21500,
  'SZ-NS-MT-01': 8800,
  'SZ-NS-CKY-01': 0,
  'SZ-BA-HJ-01': 7340,
  'SZ-BA-DT-01': 0,
  'SZ-BA-MT-01': 11200,
};

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
