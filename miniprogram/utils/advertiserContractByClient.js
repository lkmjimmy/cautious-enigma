/** 按客户 ID 存储合同图路径；仅演示本地隔离，正式环境用服务端鉴权 */
const KEY = 'advertiserContractByClientMap';
const LEGACY_KEY = 'advertiserContractImagePath';
const META_KEY = 'advertiserContractCaptureMetaV1';

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
  if (!savedFilePath) {
    setCaptureMeta(clientId, null);
  }
}

function getMetaMap() {
  try {
    const raw = wx.getStorageSync(META_KEY);
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return { ...raw };
  } catch (e) {
    /* ignore */
  }
  return {};
}

/** @returns {{ watermarkTime?: string, watermarkAddress?: string } | null} */
function getCaptureMeta(clientId) {
  if (!clientId) return null;
  const m = getMetaMap();
  const row = m[clientId];
  if (!row || typeof row !== 'object') return null;
  return row;
}

/** @param {{ watermarkTime?: string, watermarkAddress?: string } | null} meta */
function setCaptureMeta(clientId, meta) {
  if (!clientId) return;
  const m = getMetaMap();
  if (!meta || (!meta.watermarkTime && !meta.watermarkAddress)) {
    delete m[clientId];
  } else {
    m[clientId] = {
      watermarkTime: meta.watermarkTime || '',
      watermarkAddress: meta.watermarkAddress || '',
    };
  }
  try {
    wx.setStorageSync(META_KEY, m);
  } catch (e) {
    /* ignore */
  }
}

module.exports = { KEY, getMap, get, set, getCaptureMeta, setCaptureMeta };
