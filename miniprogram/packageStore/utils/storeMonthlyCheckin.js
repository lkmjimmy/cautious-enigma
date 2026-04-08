/**
 * 门店打卡（店主）：自然月一次。
 * 判定：当前门店 demo 广告位清单中，每个编号在 storeHomeSlotPhotos 里均有本月内更新的照片（recordedAt 落在当月）。
 */
const demoSlots = require('../../utils/demoSlots.js');
const storeHomeSlotPhotos = require('../../utils/storeHomeSlotPhotos.js');

function isRecordedThisMonth(recordedAt) {
  const n = Number(recordedAt);
  if (!Number.isFinite(n) || n <= 0) return false;
  const d = new Date(n);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/** 某个广告位：店主是否在本月更新过存档照片 */
function isSlotDoneThisMonth(slotCode) {
  const rec = storeHomeSlotPhotos.getRecord(slotCode);
  return !!(rec && rec.path && isRecordedThisMonth(rec.recordedAt));
}

/**
 * @returns {{
 *   monthLabel: string,
 *   total: number,
 *   updatedThisMonth: number,
 *   pendingCount: number,
 *   allDone: boolean,
 * }}
 */
function getMonthlyCheckinStatus(storeName) {
  const slots = demoSlots.slotsForStore(storeName);
  const total = slots.length;
  let updatedThisMonth = 0;
  slots.forEach((s) => {
    if (isSlotDoneThisMonth(s.code)) updatedThisMonth += 1;
  });
  const now = new Date();
  const monthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`;
  const pendingCount = total - updatedThisMonth;
  const allDone = total > 0 && updatedThisMonth === total;
  return {
    monthLabel,
    total,
    updatedThisMonth,
    pendingCount,
    allDone,
  };
}

module.exports = {
  isRecordedThisMonth,
  isSlotDoneThisMonth,
  getMonthlyCheckinStatus,
};
