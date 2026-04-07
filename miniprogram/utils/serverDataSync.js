/**
 * 与服务端同步「客户列表 + 广告位归属」等核心键（优先于全量 kv）。
 * 依赖：已登录且 apiRequest 带 token；apiConfig.useServer === true。
 */
const apiConfig = require('./apiConfig.js');
const apiRequest = require('./apiRequest.js');

const LOCAL_CLIENTS_KEY = 'demoClientsListV1';
const LOCAL_SLOT_OWNER_KEY = 'slotOwnerByCodeV1';

/** 非 force 拉取的最小间隔（首页 onShow 等场景，与冷启动/登录后的强制拉取区分） */
const DEFAULT_PULL_MIN_INTERVAL_MS = 90000;

let lastPullAt = 0;

function isServerReady() {
  if (!apiConfig.useServer || !apiConfig.baseUrl) return false;
  try {
    const t = wx.getStorageSync('apiToken');
    return !!(t && String(t).trim());
  } catch (e) {
    return false;
  }
}

function isAdminLocal() {
  try {
    return wx.getStorageSync('userRole') === 'admin';
  } catch (e) {
    return false;
  }
}

/**
 * 从 GET /api/v1/bootstrap 拉取并写入本地 Storage（与后端 db 键对齐）
 * @param {{ force?: boolean }} [options] — `force: true` 时忽略最短间隔（冷启动、登录换票后等）
 */
function pullCoreData(options) {
  const opts = options && typeof options === 'object' ? options : {};
  const force = !!opts.force;
  if (!force && lastPullAt > 0 && Date.now() - lastPullAt < DEFAULT_PULL_MIN_INTERVAL_MS) {
    return Promise.resolve({ ok: false, skipped: true, throttle: true });
  }
  if (!isServerReady()) {
    return Promise.resolve({ ok: false, skipped: true });
  }
  return apiRequest
    .request({ path: '/api/v1/bootstrap', method: 'GET' })
    .then(function (snap) {
      lastPullAt = Date.now();
      if (!snap || typeof snap !== 'object') return { ok: true, empty: true };
      if (Array.isArray(snap.clients)) {
        try {
          wx.setStorageSync(LOCAL_CLIENTS_KEY, snap.clients);
        } catch (e) {
          /* ignore */
        }
      }
      if (snap.slotOwnerByCodeV1 && typeof snap.slotOwnerByCodeV1 === 'object' && !Array.isArray(snap.slotOwnerByCodeV1)) {
        try {
          wx.setStorageSync(LOCAL_SLOT_OWNER_KEY, snap.slotOwnerByCodeV1);
        } catch (e) {
          /* ignore */
        }
      }
      return { ok: true };
    })
    .catch(function (err) {
      console.error('[serverDataSync] pullCoreData', err);
      return { ok: false, error: err };
    });
}

/**
 * 客户列表变更后推送到服务端（需中台 admin，与 PUT /api/v1/clients 一致）
 */
function afterClientsListChanged(list) {
  if (!isServerReady() || !isAdminLocal()) {
    return Promise.resolve({ ok: false, skipped: true });
  }
  const payload = Array.isArray(list) ? list : [];
  return apiRequest
    .request({
      path: '/api/v1/clients',
      method: 'PUT',
      data: { list: payload },
    })
    .then(function () {
      return { ok: true };
    })
    .catch(function (err) {
      console.error('[serverDataSync] afterClientsListChanged', err);
      wx.showToast({ title: '同步客户到服务端失败', icon: 'none' });
      return { ok: false, error: err };
    });
}

/**
 * 广告位归属 map 变更后推送 kv（任意已登录用户；中台绑定场景）
 */
function afterSlotOwnerMapChanged(map) {
  if (!isServerReady()) {
    return Promise.resolve({ ok: false, skipped: true });
  }
  const value = map && typeof map === 'object' && !Array.isArray(map) ? map : {};
  return apiRequest
    .request({
      path: '/api/v1/kv/slotOwnerByCodeV1',
      method: 'PUT',
      data: { value },
    })
    .then(function () {
      return { ok: true };
    })
    .catch(function (err) {
      console.error('[serverDataSync] afterSlotOwnerMapChanged', err);
      wx.showToast({ title: '同步归属到服务端失败', icon: 'none' });
      return { ok: false, error: err };
    });
}

module.exports = {
  pullCoreData,
  DEFAULT_PULL_MIN_INTERVAL_MS,
  afterClientsListChanged,
  afterSlotOwnerMapChanged,
  isServerReady,
  LOCAL_CLIENTS_KEY,
  LOCAL_SLOT_OWNER_KEY,
};
