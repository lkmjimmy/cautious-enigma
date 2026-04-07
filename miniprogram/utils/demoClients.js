const slotOwnership = require('./slotOwnership.js');
const clientPlacementSchedule = require('./clientPlacementSchedule.js');
const clientSlotQuotes = require('./clientSlotQuotes.js');
const advertiserContractByClient = require('./advertiserContractByClient.js');

const STORAGE_KEY = 'demoClientsListV1';

const DEFAULT_CLIENTS = [
  {
    id: 'c_demo_1',
    name: '模拟客户',
    phone: '000****0000',
    company: '模拟公司',
    inAd: false,
    placementLines: [],
  },
];

function cloneSeed() {
  return DEFAULT_CLIENTS.map(function (c) {
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      company: c.company,
      inAd: false,
      placementLines: [],
    };
  });
}

function getList() {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY);
    /** 含空数组：与服务端同步后允许为 []，不再强制回填演示种子 */
    if (Array.isArray(raw)) return raw;
  } catch (e) {
    /* ignore */
  }
  const seed = cloneSeed();
  try {
    wx.setStorageSync(STORAGE_KEY, seed);
  } catch (e2) {
    /* ignore */
  }
  return seed;
}

function getById(id) {
  const list = getList();
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].id === id) return list[i];
  }
  return null;
}

function cleanupClientRelations(clientId) {
  slotOwnership.clearOwnersForClient(clientId);
  clientPlacementSchedule.removeClient(clientId);
  clientSlotQuotes.removeForClient(clientId);
  advertiserContractByClient.set(clientId, '');
  advertiserContractByClient.setCaptureMeta(clientId, null);
}

function removeById(clientId) {
  if (!clientId) return getList();
  const list = getList().filter(function (c) {
    return c.id !== clientId;
  });
  try {
    wx.setStorageSync(STORAGE_KEY, list);
  } catch (e) {
    /* ignore */
  }
  cleanupClientRelations(clientId);
  try {
    const serverDataSync = require('./serverDataSync.js');
    serverDataSync.afterClientsListChanged(list);
  } catch (e2) {
    /* ignore */
  }
  return list;
}

module.exports = {
  getList,
  getById,
  removeById,
};
