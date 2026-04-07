const demoSlots = require('./demoSlots.js');
const inspectorStores = require('./inspectorStores.js');
const inspectorStoreRecords = require('./inspectorStoreRecords.js');
const clientPlacementSchedule = require('./clientPlacementSchedule.js');
const slotLatestPhoto = require('./slotLatestPhoto.js');
const slotUploadGate = require('./slotUploadGate.js');

const KEY = 'slotOwnerByCodeV1';
const REMOVED_DEMO_KEY = 'adminRemovedDemoSlotCodesV1';

function getRemovedDemoCodes() {
  try {
    const raw = wx.getStorageSync(REMOVED_DEMO_KEY);
    if (Array.isArray(raw)) return raw;
  } catch (e) {
    /* ignore */
  }
  return [];
}

function markDemoSlotRemoved(code) {
  if (!code) return;
  const arr = getRemovedDemoCodes().slice();
  if (arr.indexOf(code) >= 0) return;
  arr.push(code);
  try {
    wx.setStorageSync(REMOVED_DEMO_KEY, arr);
  } catch (e) {
    /* ignore */
  }
}

function getMap() {
  const raw = wx.getStorageSync(KEY);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  return {};
}

function setMap(map) {
  const m = map || {};
  wx.setStorageSync(KEY, m);
  try {
    const serverDataSync = require('./serverDataSync.js');
    serverDataSync.afterSlotOwnerMapChanged(m);
  } catch (e) {
    /* ignore */
  }
}

/** 仅解除编号与客户绑定 */
function removeBinding(slotCode) {
  if (!slotCode) return;
  const map = getMap();
  if (map[slotCode] !== undefined) {
    delete map[slotCode];
    setMap(map);
  }
}

/** 删除客户时解除其名下全部广告位绑定 */
function clearOwnersForClient(clientId) {
  if (!clientId) return;
  const map = getMap();
  let changed = false;
  Object.keys(map).forEach(function (code) {
    if (map[code] === clientId) {
      delete map[code];
      changed = true;
    }
  });
  if (changed) setMap(map);
}

/** 中台删除广告位：巡检记录中删除 + 解绑 + 演示静态位写入隐藏表 */
function adminRemoveSlotByCode(code) {
  if (!code) return;
  inspectorStoreRecords.removeSlotByCode(code);
  removeBinding(code);
  markDemoSlotRemoved(code);
}

function setOwner(slotCode, clientId) {
  if (!slotCode) return;
  const map = getMap();
  if (!clientId) {
    delete map[slotCode];
  } else {
    map[slotCode] = clientId;
  }
  setMap(map);
}

function getOwner(slotCode) {
  const map = getMap();
  return map[slotCode] || '';
}

/**
 * 投放状态规则：
 * - 已绑定客户但未在客户管理中设置该类型投放/到期：**待定**（可无现场图）
 * - **未绑定客户**：一律 **空置**（可无现场图或有现场图）；满 7 天仍无有效投放设置则按 uploadGate 清空照片
 * - 已绑定客户且已设置投放时间：按到期日 → 已投放 / 即将到期 / 已到期（无现场图时仍显示投放期状态，缩略图位为空）
 */
function enrichSlot(slot) {
  const code = slot.code;
  const type = slot.type;
  const owner = getOwner(code);
  const sched = owner ? clientPlacementSchedule.getExpireMap(owner) : {};
  const expStr = owner && sched[type] ? sched[type] : '';
  let expireAt = slot.expireAt;
  if (expStr) expireAt = expStr;
  const hasSchedule = !!(expStr && expStr !== '--');
  /** 绑定客户但未设置投放时间 → 一律待定 */
  const pendingByBoundNoSchedule = !!(owner && !hasSchedule);

  slotUploadGate.maybeClearIfPendingTimeout(code, hasSchedule);

  const uploaded = slotUploadGate.hasUploadedPhoto(code);
  const fallback =
    slot._fallbackThumb ||
    `https://picsum.photos/seed/${encodeURIComponent(code)}/240/160`;
  let thumb = '';
  if (uploaded) {
    thumb = slotLatestPhoto.getLatestThumbForSlot(code, fallback);
  }
  const thumbVacant = !uploaded;

  const wmFromSlot = slot.watermarkTime || '';
  const waFromSlot = slot.watermarkAddress || '';
  const watermarkTime = uploaded ? wmFromSlot : '';
  const watermarkAddress = uploaded ? waFromSlot : '';

  const now = new Date();
  let expireSoon = false;
  let status = '空置';

  if (pendingByBoundNoSchedule) {
    status = '待定';
    expireAt = '--';
  } else if (!uploaded) {
    if (owner && hasSchedule) {
      const d = clientPlacementSchedule.daysUntilExpire(expireAt, now);
      expireSoon = d !== null && d >= 0 && d <= 7;
      if (expireAt && expireAt !== '--') {
        if (d !== null && d < 0) status = '已到期';
        else if (expireSoon) status = '即将到期';
        else status = '已投放';
      } else {
        status = '已投放';
      }
    } else {
      status = '空置';
      expireAt = '--';
    }
  } else if (!owner) {
    status = '空置';
    expireAt = '--';
  } else {
    const d = clientPlacementSchedule.daysUntilExpire(expireAt, now);
    expireSoon = d !== null && d >= 0 && d <= 7;
    if (expireAt && expireAt !== '--') {
      if (d !== null && d < 0) status = '已到期';
      else if (expireSoon) status = '即将到期';
      else status = '已投放';
    } else {
      status = '已投放';
    }
  }

  const { _fallbackThumb, ...rest } = slot;
  return {
    ...rest,
    expireAt,
    status,
    expireSoon,
    thumb,
    thumbVacant,
    watermarkTime,
    watermarkAddress,
  };
}

function getAllSlots() {
  const base = demoSlots.RAW_SLOTS.map((s) => {
    const fallback = `https://picsum.photos/seed/${encodeURIComponent(s.code)}/240/160`;
    return {
      code: s.code,
      store: s.store,
      type: s.type,
      status: s.status,
      expireAt: s.expireAt,
      _fallbackThumb: fallback,
      watermarkTime: '',
      watermarkAddress: '',
    };
  });

  const stores = inspectorStores.getStores();
  const storeNameById = {};
  stores.forEach((s) => {
    storeNameById[s.id] = s.name;
  });

  const recordsMap = inspectorStoreRecords.getAllRecords();
  const generated = [];
  Object.keys(recordsMap || {}).forEach((storeId) => {
    const row = recordsMap[storeId] || {};
    const slots = row.slots || [];
    slots.forEach((slot) => {
      if (!slot || !slot.code) return;
      const genFallback =
        slot.photo || `https://picsum.photos/seed/${encodeURIComponent(slot.code)}/240/160`;
      generated.push({
        code: slot.code,
        store: storeNameById[storeId] || '新增门店',
        type: slot.type || '未知类型',
        status: '空置',
        expireAt: '--',
        _fallbackThumb: genFallback,
        watermarkTime: slot.watermarkTime || '',
        watermarkAddress: slot.watermarkAddress || '',
      });
    });
  });

  const removedDemo = getRemovedDemoCodes();
  const mapByCode = {};
  [...base, ...generated].forEach((s) => {
    if (!s || !s.code) return;
    if (removedDemo.indexOf(s.code) >= 0) return;
    mapByCode[s.code] = s;
  });
  return Object.keys(mapByCode).map((k) => enrichSlot(mapByCode[k]));
}

function getOwnedSlots(clientId) {
  const ownerMap = getMap();
  return getAllSlots().filter((s) => ownerMap[s.code] === clientId);
}

module.exports = {
  KEY,
  getMap,
  setOwner,
  getOwner,
  removeBinding,
  clearOwnersForClient,
  adminRemoveSlotByCode,
  enrichSlot,
  getAllSlots,
  getOwnedSlots,
};
