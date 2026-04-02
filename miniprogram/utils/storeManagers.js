/**
 * 门店店主（演示：本地存储；上线后由后端维护指派与清退）
 */
const claim = require('./claim.js');

const KEY = 'storeManagerBindings';

const DEFAULT = {
  福田中心店: { name: '张明', phone: '138****2160' },
  南山科技园店: { name: '刘洋', phone: '159****8832' },
  宝安壹方城店: { name: '陈静', phone: '186****5091' },
};

const ALL = ['福田中心店', '南山科技园店', '宝安壹方城店'];

function getMap() {
  let m = wx.getStorageSync(KEY);
  if (m === undefined || m === null || m === '') {
    m = { ...DEFAULT };
    wx.setStorageSync(KEY, m);
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
