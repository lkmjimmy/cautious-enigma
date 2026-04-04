/**
 * 门店各月预估收益快照（用于「历史收益合计」：早于本月的月份之和）
 */
const KEY = 'storeRevenueHistoryV1';

function readAll() {
  try {
    const raw = wx.getStorageSync(KEY);
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch (e) {
    return {};
  }
}

function setAll(map) {
  try {
    wx.setStorageSync(KEY, map);
  } catch (e) {
    /* ignore */
  }
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** 写入本月最新预估（覆盖当月） */
function saveMonthEstimate(storeName, monthKey, amountYuan) {
  if (!storeName || !monthKey) return;
  const all = readAll();
  if (!all[storeName]) all[storeName] = { months: {} };
  all[storeName].months[monthKey] = Math.round(Number(amountYuan)) || 0;
  setAll(all);
}

/** 早于当前月的各月快照之和 */
function historySumBeforeCurrentMonth(storeName, currentMonthKey) {
  if (!storeName) return 0;
  const all = readAll();
  const rec = all[storeName];
  const months = (rec && rec.months) || {};
  let sum = 0;
  Object.keys(months).forEach((k) => {
    if (k < currentMonthKey) sum += Number(months[k]) || 0;
  });
  return sum;
}

module.exports = {
  KEY,
  currentMonthKey,
  saveMonthEstimate,
  historySumBeforeCurrentMonth,
};
