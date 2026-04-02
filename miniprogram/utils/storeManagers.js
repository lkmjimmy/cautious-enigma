/**
 * 门店店主（演示：本地存储；上线后由后端维护指派与清退）
 */
const claim = require('./claim.js');

const KEY = 'storeManagerBindings';

const DEFAULT = {
  福田中心店: { name: '张明', phone: '138****2160' },
  南山科技园店: { name: '刘洋', phone: '159****8832' },
  宝安壹方城店: { name: '陈静', phone: '186****5091' },
  龙岗万达店: { name: '赵磊', phone: '137****1101' },
  龙华红山店: { name: '周婷', phone: '136****2202' },
  罗湖万象店: { name: '吴凯', phone: '135****3303' },
};

const ALL = [
  '福田中心店',
  '南山科技园店',
  '宝安壹方城店',
  '龙岗万达店',
  '龙华红山店',
  '罗湖万象店',
];

function getMap() {
  let m = wx.getStorageSync(KEY);
  if (m === undefined || m === null || m === '') {
    m = { ...DEFAULT };
    wx.setStorageSync(KEY, m);
    return m;
  }
  if (typeof m !== 'object' || Array.isArray(m)) {
    m = { ...DEFAULT };
    wx.setStorageSync(KEY, m);
    return m;
  }
  let changed = false;
  const next = { ...m };
  ALL.forEach((name) => {
    if (DEFAULT[name] && !next[name]) {
      next[name] = { ...DEFAULT[name] };
      changed = true;
    }
  });
  if (changed) wx.setStorageSync(KEY, next);
  return changed ? next : m;
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
