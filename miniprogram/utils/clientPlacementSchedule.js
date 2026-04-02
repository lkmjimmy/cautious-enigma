/** 按客户 + 广告位类型 存储投放到期日；同步作用于该客户名下该类型的全部广告位（在 slotOwnership 中合并展示） */
const KEY = 'clientPlacementScheduleByTypeV1';

function getAll() {
  const raw = wx.getStorageSync(KEY);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  return {};
}

function getForClient(clientId) {
  if (!clientId) return {};
  const all = getAll();
  const row = all[clientId];
  return row && typeof row === 'object' && !Array.isArray(row) ? row : {};
}

function setForClient(clientId, typeMap) {
  const all = getAll();
  all[clientId] = typeMap || {};
  wx.setStorageSync(KEY, all);
}

function setTypeExpiry(clientId, type, dateStr) {
  const cur = { ...getForClient(clientId) };
  if (!dateStr) delete cur[type];
  else cur[type] = dateStr;
  setForClient(clientId, cur);
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** 到期日距「今日」天数；无效返回 null */
function daysUntilExpire(expireStr, now) {
  if (!expireStr || expireStr === '--') return null;
  const p = expireStr.split('-').map(Number);
  if (p.length !== 3 || p.some((x) => Number.isNaN(x))) return null;
  const end = new Date(p[0], p[1] - 1, p[2]);
  return Math.round((end - startOfDay(now || new Date())) / 86400000);
}

function isExpireSoon(expireStr, now) {
  const d = daysUntilExpire(expireStr, now);
  return d !== null && d >= 0 && d <= 7;
}

module.exports = {
  KEY,
  getForClient,
  setForClient,
  setTypeExpiry,
  daysUntilExpire,
  isExpireSoon,
};
