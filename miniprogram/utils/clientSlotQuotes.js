/**
 * 客户详情内：按广告位类型维护报价（投放期 + 单价，演示本地存储）
 */
const demoSlots = require('./demoSlots.js');

const KEY = 'clientSlotQuotesByTypeV1';

const PERIOD_KEYS = ['month', 'quarter', 'year'];
const PERIOD_LABELS = ['月', '季度', '年度'];

function readAll() {
  try {
    const raw = wx.getStorageSync(KEY);
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch (e) {
    return {};
  }
}

function getForClient(clientId) {
  if (!clientId) return {};
  const all = readAll();
  const row = all[clientId];
  return row && typeof row === 'object' && !Array.isArray(row) ? row : {};
}

/** @param {Record<string, { period?: string, price?: string }>} typeMap */
function setForClient(clientId, typeMap) {
  if (!clientId) return;
  const all = readAll();
  all[clientId] = typeMap || {};
  try {
    wx.setStorageSync(KEY, all);
  } catch (e) {
    /* ignore */
  }
}

function removeForClient(clientId) {
  if (!clientId) return;
  const all = readAll();
  delete all[clientId];
  try {
    wx.setStorageSync(KEY, all);
  } catch (e) {
    /* ignore */
  }
}

/** 是否已为该客户保存过报价（本地有记录） */
function hasSavedForClient(clientId) {
  const row = getForClient(clientId);
  return Object.keys(row).length > 0;
}

/** 报价折算为「元/月」：月=原价，季度÷3，年度÷12 */
function getMonthlyPriceYuan(clientId, type) {
  const row = getForClient(clientId)[type];
  if (!row) return 0;
  const price = parseFloat(String(row.price || '').trim());
  if (Number.isNaN(price) || price < 0) return 0;
  const period = PERIOD_KEYS.includes(row.period) ? row.period : 'month';
  if (period === 'quarter') return price / 3;
  if (period === 'year') return price / 12;
  return price;
}

function getQuoteRowsForView(clientId) {
  const stored = getForClient(clientId);
  const types = demoSlots.ALL_SLOT_TYPES || [];
  return types.map((type) => {
    const row = stored[type] || {};
    const period = PERIOD_KEYS.includes(row.period) ? row.period : 'month';
    const periodIndex = PERIOD_KEYS.indexOf(period);
    return {
      type,
      period,
      periodIndex: periodIndex >= 0 ? periodIndex : 0,
      price: row.price != null ? String(row.price) : '',
    };
  });
}

module.exports = {
  KEY,
  PERIOD_KEYS,
  PERIOD_LABELS,
  getForClient,
  setForClient,
  removeForClient,
  getQuoteRowsForView,
  hasSavedForClient,
  getMonthlyPriceYuan,
};
