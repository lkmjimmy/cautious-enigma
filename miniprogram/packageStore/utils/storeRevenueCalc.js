/**
 * 门店预估收益（按月）：
 * 单广告位月收入 = max(0, (客户该类型折算月单价 − 该类型制作成本)) × 30%
 * 与「各类型数量」展开式 (n·P − n·C)×30%/n 等价。
 */
const slotOwnership = require('../../utils/slotOwnership.js');
const clientSlotQuotes = require('../../utils/clientSlotQuotes.js');
const slotPriceBook = require('../../utils/slotPriceBook.js');
const demoRevenue = require('../../utils/demoRevenue.js');

const SHARE_RATE = 0.3;

function slotEligibleForRevenue(slot) {
  const owner = slotOwnership.getOwner(slot.code);
  if (!owner) return false;
  if (slot.status === '空置' || slot.status === '待定') return false;
  return true;
}

function perSlotMonthlyYuan(ownerId, type) {
  const priceMonth = clientSlotQuotes.getMonthlyPriceYuan(ownerId, type);
  const makeCost = slotPriceBook.getMakeCostYuan(type);
  const raw = (priceMonth - makeCost) * SHARE_RATE;
  return Math.max(0, Math.round(raw * 100) / 100);
}

function computeForStore(storeName) {
  const slots = slotOwnership.getAllSlots().filter((s) => s.store === storeName);
  const rows = slots
    .map((s) => {
      const owner = slotOwnership.getOwner(s.code);
      let revenueYuan = 0;
      if (slotEligibleForRevenue(s)) {
        revenueYuan = perSlotMonthlyYuan(owner, s.type);
      }
      return {
        code: s.code,
        type: s.type,
        status: s.status,
        revenueYuan,
        revenueText: demoRevenue.formatYuan(revenueYuan),
      };
    })
    .sort((a, b) => String(a.code).localeCompare(String(b.code), 'zh-CN'));

  const monthTotal = rows.reduce((sum, r) => sum + r.revenueYuan, 0);

  return {
    rows,
    monthTotal,
    monthTotalText: demoRevenue.formatYuan(monthTotal),
  };
}

module.exports = {
  computeForStore,
  SHARE_RATE,
};
