/**
 * 广告位缩略图：取巡店员（巡检记录）与门店店主（本店工作台拍照）中时间最新的一张。
 */
const inspectorStoreRecords = require('./inspectorStoreRecords.js');
const storeHomeSlotPhotos = require('./storeHomeSlotPhotos.js');

function parseTimeToMs(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const m = timeStr.trim().match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/
  );
  if (!m) return 0;
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    Number(m[6])
  ).getTime();
}

function getInspectorPhotoMeta(slotCode) {
  const map = inspectorStoreRecords.getAllRecords();
  let best = null;
  Object.keys(map || {}).forEach((storeId) => {
    const row = map[storeId] || {};
    (row.slots || []).forEach((s) => {
      if (!s || s.code !== slotCode || !s.photo) return;
      const at =
        Number(s.photoTakenAt) ||
        Number(row.updatedAt) ||
        0;
      if (!best || at > best.at) best = { path: s.photo, at };
    });
  });
  return best;
}

function getStoreOwnerPhotoMeta(slotCode) {
  const rec = storeHomeSlotPhotos.getRecord(slotCode);
  if (!rec || !rec.path) return null;
  const at = Number(rec.recordedAt) || parseTimeToMs(rec.time) || 0;
  return { path: rec.path, at };
}

/** 无巡店/店主照片时返回 fallback（可为占位图或远程示意） */
function getLatestThumbForSlot(slotCode, fallbackThumb) {
  const ins = getInspectorPhotoMeta(slotCode);
  const own = getStoreOwnerPhotoMeta(slotCode);
  if (!ins && !own) return fallbackThumb || '';
  if (!ins) return own.path;
  if (!own) return ins.path;
  return own.at >= ins.at ? own.path : ins.path;
}

/** 当前展示图是否来自店主本店拍照（用于水印等） */
function isOwnerThumbWinning(slotCode) {
  const ins = getInspectorPhotoMeta(slotCode);
  const own = getStoreOwnerPhotoMeta(slotCode);
  if (!own) return false;
  if (!ins) return true;
  return own.at >= ins.at;
}

module.exports = {
  getLatestThumbForSlot,
  isOwnerThumbWinning,
};
