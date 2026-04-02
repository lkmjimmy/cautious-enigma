const demoSlots = require('./demoSlots.js');
const inspectorStores = require('./inspectorStores.js');
const inspectorStoreRecords = require('./inspectorStoreRecords.js');
const clientPlacementSchedule = require('./clientPlacementSchedule.js');
const slotLatestPhoto = require('./slotLatestPhoto.js');

const KEY = 'slotOwnerByCodeV1';

function getMap() {
  const raw = wx.getStorageSync(KEY);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  return {};
}

function setMap(map) {
  wx.setStorageSync(KEY, map || {});
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

/** 合并客户按类型设置的到期日，并计算 7 天内到期提醒；非空置广告位据此刷新状态 */
function enrichSlot(slot) {
  const owner = getOwner(slot.code);
  let expireAt = slot.expireAt;
  const sched = owner ? clientPlacementSchedule.getForClient(owner) : {};
  if (owner && sched[slot.type]) {
    expireAt = sched[slot.type];
  }
  const now = new Date();
  const d = clientPlacementSchedule.daysUntilExpire(expireAt, now);
  const expireSoon = d !== null && d >= 0 && d <= 7;
  let status = slot.status;
  if (slot.status === '空置') {
    // 保持空置
  } else if (expireAt && expireAt !== '--') {
    if (d !== null && d < 0) status = '已到期';
    else if (d !== null && d >= 0 && d <= 7) status = '即将到期';
    else if (d !== null && d > 7) {
      status = status === '已到期' || status === '即将到期' ? '已投放' : status || '已投放';
    }
  }
  return { ...slot, expireAt, status, expireSoon };
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
      thumb: slotLatestPhoto.getLatestThumbForSlot(s.code, fallback),
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
        status: slot.photo ? '已投放' : '空置',
        expireAt: '--',
        thumb: slotLatestPhoto.getLatestThumbForSlot(slot.code, genFallback),
        watermarkTime: slot.watermarkTime || '',
        watermarkAddress: slot.watermarkAddress || '',
      });
    });
  });

  const mapByCode = {};
  [...base, ...generated].forEach((s) => {
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
  enrichSlot,
  getAllSlots,
  getOwnedSlots,
};
