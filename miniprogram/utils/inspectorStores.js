/**
 * 巡店员新增门店（本地存储）
 * 正式环境：由后端创建门店、下发巡检任务
 */
const KEY = 'inspectorStoresV1';

const demoSlots = require('./demoSlots.js');
const storeManagers = require('./storeManagers.js');

/** 与演示广告位绑定的门店名（无预置广告位时为空，新门店用空类型分布） */
const TEMPLATE_STORE_NAMES = [];

function typeInventoryForTemplateStore(storeName) {
  const slots = demoSlots.slotsForStore(storeName);
  const m = {};
  slots.forEach((s) => {
    m[s.type] = (m[s.type] || 0) + 1;
  });
  return m;
}

function pickRandomTemplateInventory() {
  if (!TEMPLATE_STORE_NAMES.length) return {};
  const tpl = TEMPLATE_STORE_NAMES[Math.floor(Math.random() * TEMPLATE_STORE_NAMES.length)];
  return typeInventoryForTemplateStore(tpl);
}

function getStores() {
  let list = wx.getStorageSync(KEY);
  if (!Array.isArray(list)) {
    list = [];
    wx.setStorageSync(KEY, list);
    return list;
  }
  if (list.length === 0) {
    return list;
  }

  const fixed = list.map((row) => {
    const hasInventory =
      row &&
      row.typeInventory &&
      typeof row.typeInventory === 'object' &&
      Object.keys(row.typeInventory).length > 0;
    if (hasInventory) return row;
    const inv = TEMPLATE_STORE_NAMES.includes(row.name)
      ? typeInventoryForTemplateStore(row.name)
      : pickRandomTemplateInventory();
    return { ...row, typeInventory: inv, distance: row.distance || '—' };
  });
  wx.setStorageSync(KEY, fixed);
  return fixed;
}

function saveStores(list) {
  wx.setStorageSync(KEY, list);
}

function addStore({ name, address, phone }) {
  const list = getStores();
  const nextSequenceNo = list.reduce((max, row) => {
    const n = Number(row && row.sequenceNo);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0) + 1;
  const id = `ins_s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const distanceOptions = ['0.8km', '1.2km', '1.6km', '2.3km', '3.1km', '4.7km', '7.9km'];
  const distance = distanceOptions[Math.floor(Math.random() * distanceOptions.length)] || '—';

  const typeInventory = pickRandomTemplateInventory();

  const row = { id, name, address, phone, distance, typeInventory, sequenceNo: nextSequenceNo };
  list.unshift(row);
  saveStores(list);
  return row;
}

function removeStore(storeId) {
  if (!storeId) return false;
  const list = getStores();
  const found = list.find(function (s) {
    return s.id === storeId;
  });
  if (!found) return false;
  const name = found.name;
  const next = list.filter(function (s) {
    return s.id !== storeId;
  });
  saveStores(next);
  const inspectorStoreRecords = require('./inspectorStoreRecords.js');
  const slotOwnership = require('./slotOwnership.js');
  const rec = inspectorStoreRecords.getRecord(storeId);
  const slots = rec && rec.slots ? rec.slots : [];
  slots.forEach(function (s) {
    if (s && s.code) slotOwnership.removeBinding(s.code);
  });
  inspectorStoreRecords.deleteRecordForStore(storeId);
  if (name) {
    storeManagers.removeOwner(name);
  }
  return true;
}

module.exports = { KEY, getStores, addStore, removeStore };
