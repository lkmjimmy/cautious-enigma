/**
 * 门店认领（本地存储；上线后由后端接管同一套规则）
 * - 每个门店仅能被一名用户认领（registry）
 * - 用户第一家店：即时认领
 * - 用户第二家及以后：写入待审核，需中台通过后才写入 registry
 * 可认领门店名 = 演示广告位中的门店 + 巡店员已添加的门店
 */

const adminTodoAuditLog = require('./adminTodoAuditLog.js');
const demoSlots = require('./demoSlots.js');

const KEY_USER = 'localUserId';
const KEY_REGISTRY = 'storeClaimRegistry';
const KEY_PENDING = 'storePendingClaims';
const KEY_CURRENT_STORE = 'currentStoreView';

function getStoreNamesForClaim() {
  const fromSlots = [...new Set(demoSlots.RAW_SLOTS.map((s) => s.store))];
  let fromIns = [];
  try {
    const inspectorStores = require('./inspectorStores.js');
    fromIns = inspectorStores.getStores().map((s) => s.name);
  } catch (e) {
    /* ignore */
  }
  return [...new Set([...fromSlots, ...fromIns])];
}

function ensureUserId() {
  let id = wx.getStorageSync(KEY_USER);
  if (!id) {
    id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    wx.setStorageSync(KEY_USER, id);
  }
  return id;
}

function getRegistry() {
  return wx.getStorageSync(KEY_REGISTRY) || {};
}

function setRegistry(map) {
  wx.setStorageSync(KEY_REGISTRY, map);
}

function getPendingList() {
  return wx.getStorageSync(KEY_PENDING) || [];
}

function setPendingList(list) {
  wx.setStorageSync(KEY_PENDING, list);
}

function getMyApprovedStores(userId) {
  const r = getRegistry();
  return Object.keys(r).filter((name) => r[name] === userId);
}

/** 认领：首店即时；多店进待审核 */
function requestClaim(storeName) {
  if (!getStoreNamesForClaim().includes(storeName)) {
    return { ok: false, message: '未知门店' };
  }
  const userId = ensureUserId();
  const r = { ...getRegistry() };
  const pending = [...getPendingList()];

  if (r[storeName] && r[storeName] !== userId) {
    return { ok: false, message: '该门店已被他人认领' };
  }
  if (r[storeName] === userId) {
    return { ok: false, message: '您已认领该门店' };
  }
  if (pending.some((p) => p.userId === userId && p.storeName === storeName)) {
    return { ok: false, message: '该门店已在审核中' };
  }
  if (pending.some((p) => p.storeName === storeName && p.userId !== userId)) {
    return { ok: false, message: '该门店已有他人申请认领，请稍后再试' };
  }

  const approved = getMyApprovedStores(userId);
  if (approved.length === 0) {
    r[storeName] = userId;
    setRegistry(r);
    if (!wx.getStorageSync(KEY_CURRENT_STORE)) {
      wx.setStorageSync(KEY_CURRENT_STORE, storeName);
    }
    return { ok: true, mode: 'immediate' };
  }

  const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  pending.push({
    id,
    userId,
    storeName,
    createdAt: Date.now(),
  });
  setPendingList(pending);
  return { ok: true, mode: 'pending' };
}

function approvePending(pendingId) {
  const pending = [...getPendingList()];
  const idx = pending.findIndex((p) => p.id === pendingId);
  if (idx < 0) return { ok: false, message: '记录不存在' };
  const item = pending[idx];
  const r = { ...getRegistry() };
  if (r[item.storeName] && r[item.storeName] !== item.userId) {
    pending.splice(idx, 1);
    setPendingList(pending);
    adminTodoAuditLog.append({
      kind: 'claim_closed',
      payload: { storeName: item.storeName, userId: item.userId, pendingId: item.id },
    });
    return { ok: false, message: '该门店已被他人认领，已关闭此申请' };
  }
  if (r[item.storeName] === item.userId) {
    pending.splice(idx, 1);
    setPendingList(pending);
    adminTodoAuditLog.append({
      kind: 'claim_approved',
      payload: { storeName: item.storeName, userId: item.userId, pendingId: item.id, mode: 'noop' },
    });
    return { ok: true, mode: 'noop' };
  }
  r[item.storeName] = item.userId;
  setRegistry(r);
  pending.splice(idx, 1);
  setPendingList(pending);
  adminTodoAuditLog.append({
    kind: 'claim_approved',
    payload: { storeName: item.storeName, userId: item.userId, pendingId: item.id, mode: 'approved' },
  });
  return { ok: true, mode: 'approved' };
}

function rejectPending(pendingId) {
  const pending = [...getPendingList()];
  const idx = pending.findIndex((p) => p.id === pendingId);
  if (idx < 0) return false;
  const item = pending[idx];
  adminTodoAuditLog.append({
    kind: 'claim_rejected',
    payload: { storeName: item.storeName, userId: item.userId, pendingId: item.id },
  });
  pending.splice(idx, 1);
  setPendingList(pending);
  return true;
}

function buildStoreRows() {
  const userId = ensureUserId();
  const r = getRegistry();
  const pending = getPendingList();
  const myPendingNames = pending
    .filter((p) => p.userId === userId)
    .map((p) => p.storeName);
  const pendingNames = new Set(pending.map((p) => p.storeName));

  const nameSet = new Set([
    ...getStoreNamesForClaim(),
    ...Object.keys(r),
    ...pending.map((p) => p.storeName),
  ]);
  const names = Array.from(nameSet).sort((a, b) => a.localeCompare(b, 'zh-CN'));

  return names.map((name) => {
    const owner = r[name];
    let status = 'free';
    let statusText = '可认领';
    if (owner === userId) {
      status = 'mine';
      statusText = '我已认领';
    } else if (owner) {
      status = 'taken';
      statusText = '已被认领';
    } else if (myPendingNames.includes(name)) {
      status = 'pending';
      statusText = '审核中';
    } else if (pendingNames.has(name)) {
      status = 'locked';
      statusText = '他人申请审核中';
    }
    return { name, status, statusText, ownerId: owner || '' };
  });
}

function getPendingForAdmin() {
  return getPendingList().map((p) => ({
    ...p,
    shortUser: p.userId.length > 12 ? `${p.userId.slice(0, 10)}…` : p.userId,
  }));
}

function hasAnyApprovedStore() {
  return getMyApprovedStores(ensureUserId()).length > 0;
}

function setCurrentStoreView(name) {
  wx.setStorageSync(KEY_CURRENT_STORE, name);
}

function getCurrentStoreView() {
  const approved = getMyApprovedStores(ensureUserId());
  const cur = wx.getStorageSync(KEY_CURRENT_STORE);
  if (cur && approved.includes(cur)) return cur;
  if (approved.length) return approved[0];
  return '';
}

/**
 * 中台清退店主后调用：门店恢复无主，认领 registry 与相关待审一并释放，他人可重新认领
 */
function releaseStoreAfterOwnerDismissed(storeName) {
  if (!storeName) return;
  const r = { ...getRegistry() };
  delete r[storeName];
  setRegistry(r);
  const pending = getPendingList().filter((p) => p.storeName !== storeName);
  setPendingList(pending);
  const cur = wx.getStorageSync(KEY_CURRENT_STORE);
  if (cur === storeName) {
    wx.removeStorageSync(KEY_CURRENT_STORE);
  }
}

module.exports = {
  getStoreNamesForClaim,
  ensureUserId,
  getMyApprovedStores,
  requestClaim,
  approvePending,
  rejectPending,
  buildStoreRows,
  getPendingForAdmin,
  hasAnyApprovedStore,
  setCurrentStoreView,
  getCurrentStoreView,
  releaseStoreAfterOwnerDismissed,
};
