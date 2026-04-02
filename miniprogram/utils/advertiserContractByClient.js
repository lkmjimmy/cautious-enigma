/** 按客户 ID 存储合同图路径；仅演示本地隔离，正式环境用服务端鉴权 */
const KEY = 'advertiserContractByClientMap';
const LEGACY_KEY = 'advertiserContractImagePath';

function getMap() {
  try {
    const m = wx.getStorageSync(KEY);
    if (m && typeof m === 'object' && !Array.isArray(m)) return { ...m };
  } catch (e) {
    /* ignore */
  }
  return {};
}

function migrateLegacy() {
  try {
    const old = wx.getStorageSync(LEGACY_KEY);
    if (typeof old === 'string' && old) {
      const m = getMap();
      if (!m.c1) m.c1 = old;
      wx.setStorageSync(KEY, m);
      wx.removeStorageSync(LEGACY_KEY);
    }
  } catch (e) {
    /* ignore */
  }
}

/** 某客户合同图持久路径 */
function get(clientId) {
  if (!clientId) return '';
  migrateLegacy();
  const m = getMap();
  const p = m[clientId];
  return typeof p === 'string' && p ? p : '';
}

function set(clientId, savedFilePath) {
  if (!clientId) return;
  migrateLegacy();
  const m = getMap();
  if (savedFilePath) m[clientId] = savedFilePath;
  else delete m[clientId];
  try {
    wx.setStorageSync(KEY, m);
  } catch (e) {
    /* ignore */
  }
}

module.exports = { KEY, getMap, get, set };
