/**
 * 中台广告位类型：制作成本（演示：本地存储；正式环境可由后端下发）
 */
const demoSlots = require('./demoSlots.js');

const KEY = 'adminSlotPriceBook';

function readRaw() {
  try {
    const raw = wx.getStorageSync(KEY);
    return raw && typeof raw === 'object' ? raw : {};
  } catch (e) {
    return {};
  }
}

function getRowsForView() {
  const raw = readRaw();
  const types = demoSlots.ALL_SLOT_TYPES || [];
  return types.map((type) => {
    const row = raw[type] || {};
    return {
      type,
      makeCost: row.makeCost != null ? String(row.makeCost) : '',
    };
  });
}

/** @param {Record<string, { makeCost?: string }>} map */
function setAll(map) {
  try {
    wx.setStorageSync(KEY, map);
  } catch (e) {
    /* ignore */
  }
}

/** 某类型制作成本（元），未填为 0 */
function getMakeCostYuan(type) {
  const raw = readRaw();
  const row = raw[type] || {};
  const v = parseFloat(String(row.makeCost || '').trim());
  return Number.isNaN(v) || v < 0 ? 0 : v;
}

module.exports = {
  KEY,
  getRowsForView,
  setAll,
  getMakeCostYuan,
};
