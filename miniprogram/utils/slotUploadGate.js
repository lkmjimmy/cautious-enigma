/**
 * 广告位现场照片：仅巡店员巡检记录 + 店主本店拍照算「已上传」。
 * 超过 7 天未在客户管理中为该客户对应类型设置投放/到期（无有效 schedule）则清空照片，回到空置展示。
 */
const inspectorStoreRecords = require('./inspectorStoreRecords.js');
const storeHomeSlotPhotos = require('./storeHomeSlotPhotos.js');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function inspectorSlotsWithPhoto(slotCode) {
  const map = inspectorStoreRecords.getAllRecords();
  const hits = [];
  Object.keys(map || {}).forEach((storeId) => {
    (map[storeId].slots || []).forEach((s) => {
      if (s && s.code === slotCode && s.photo) hits.push(s);
    });
  });
  return hits;
}

function hasUploadedPhoto(slotCode) {
  if (inspectorSlotsWithPhoto(slotCode).length) return true;
  const rec = storeHomeSlotPhotos.getRecord(slotCode);
  return !!(rec && rec.path);
}

/** 首次产生现场图的时间（用于 7 天倒计时） */
function getFirstUploadAtMs(slotCode) {
  const ins = inspectorSlotsWithPhoto(slotCode);
  const store = storeHomeSlotPhotos.getRecord(slotCode);
  const times = [];
  ins.forEach((s) => {
    const t = Number(s.photoTakenAt);
    if (t > 0) times.push(t);
  });
  if (store && store.path) {
    const t = Number(store.recordedAt);
    if (t > 0) times.push(t);
  }
  if (!times.length) return 0;
  return Math.min.apply(null, times);
}

function clearSlotUploads(slotCode) {
  inspectorStoreRecords.clearSlotPhotoByCode(slotCode);
  storeHomeSlotPhotos.removeRecord(slotCode);
}

/**
 * @param {boolean} hasAdminSchedule 已在客户管理中为该客户+类型设置有效到期（投放时间）
 */
function maybeClearIfPendingTimeout(slotCode, hasAdminSchedule) {
  if (hasAdminSchedule) return;
  if (!hasUploadedPhoto(slotCode)) return;
  const t0 = getFirstUploadAtMs(slotCode);
  if (!t0 || t0 <= 0) return;
  if (Date.now() - t0 <= SEVEN_DAYS_MS) return;
  clearSlotUploads(slotCode);
}

module.exports = {
  SEVEN_DAYS_MS,
  hasUploadedPhoto,
  getFirstUploadAtMs,
  clearSlotUploads,
  maybeClearIfPendingTimeout,
};
