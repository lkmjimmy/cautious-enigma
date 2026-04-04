/**
 * 用户首次进入「门店 / 广告主 / 巡店员」前需填写的本地资料（按角色分别保存）。
 */
const phoneValidate = require('./phoneValidate.js');
const KEY = 'userRoleProfileV1';

function getAll() {
  try {
    const raw = wx.getStorageSync(KEY);
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  } catch (e) {
    /* ignore */
  }
  return {};
}

function saveAll(obj) {
  try {
    wx.setStorageSync(KEY, obj || {});
  } catch (e) {
    /* ignore */
  }
}

function getRoleProfile(role) {
  if (!role) return null;
  const all = getAll();
  const p = all[role];
  return p && typeof p === 'object' ? p : null;
}

function setRoleProfile(role, data) {
  if (!role || !data || typeof data !== 'object') return;
  const all = getAll();
  all[role] = data;
  saveAll(all);
}

function hasCompleteProfile(role) {
  const p = getRoleProfile(role);
  if (!p) return false;
  const trim = function (s) {
    return String(s || '').trim();
  };
  if (role === 'store') {
    return !!(trim(p.storeName) && phoneValidate.isValidMainlandMobile(p.phone));
  }
  if (role === 'advertiser') {
    return !!(
      trim(p.name) &&
      trim(p.companyName) &&
      phoneValidate.isValidMainlandMobile(p.phone)
    );
  }
  if (role === 'inspector') {
    return !!(trim(p.name) && phoneValidate.isValidMainlandMobile(p.phone));
  }
  return false;
}

module.exports = {
  KEY,
  getRoleProfile,
  setRoleProfile,
  hasCompleteProfile,
};
