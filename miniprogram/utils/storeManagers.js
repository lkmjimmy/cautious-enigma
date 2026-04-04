/**
 * 门店店主（演示：本地存储；上线后由后端维护指派与清退）
 */
const claim = require('./claim.js');

const KEY = 'storeManagerBindings';

const DEFAULT = {};

const ALL = [];

function getMap() {
  let m = wx.getStorageSync(KEY);
  if (m === undefined || m === null || m === '') {
    m = {};
    wx.setStorageSync(KEY, m);
    return m;
  }
  if (typeof m !== 'object' || Array.isArray(m)) {
    m = {};
    wx.setStorageSync(KEY, m);
    return m;
  }
  return m;
}

function getRows() {
  const m = getMap();
  return ALL.map((storeName) => {
    const mgr = m[storeName];
    return {
      storeName,
      hasManager: !!mgr,
      managerName: mgr ? mgr.name : '',
      phone: mgr ? mgr.phone : '',
    };
  });
}

function removeManager(storeName) {
  const m = { ...getMap() };
  delete m[storeName];
  wx.setStorageSync(KEY, m);
  claim.releaseStoreAfterOwnerDismissed(storeName);
}

/** 当前门店店主信息，无则 null */
function getOwner(storeName) {
  const m = getMap();
  return m[storeName] || null;
}

module.exports = {
  getRows,
  removeManager,
  removeOwner: removeManager,
  getOwner,
  ALL,
};
