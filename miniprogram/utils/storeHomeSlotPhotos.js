/** 本店工作台：按广告位编号存储店主拍摄的更新图（本地路径 + 水印文案） */
const KEY = 'storeHomeSlotPhotosV1';

function getMap() {
  const raw = wx.getStorageSync(KEY);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  return {};
}

function setMap(map) {
  wx.setStorageSync(KEY, map || {});
}

function getRecord(slotCode) {
  if (!slotCode) return null;
  const m = getMap();
  const row = m[slotCode];
  if (!row || !row.path) return null;
  return row;
}

function setRecord(slotCode, record) {
  if (!slotCode) return;
  const m = getMap();
  m[slotCode] = {
    path: record.path,
    time: record.time || '',
    address: record.address || '',
    recordedAt: record.recordedAt != null ? record.recordedAt : Date.now(),
  };
  setMap(m);
}

function removeRecord(slotCode) {
  if (!slotCode) return;
  const m = getMap();
  if (m[slotCode]) {
    delete m[slotCode];
    setMap(m);
  }
}

module.exports = {
  KEY,
  getMap,
  getRecord,
  setRecord,
  removeRecord,
};
