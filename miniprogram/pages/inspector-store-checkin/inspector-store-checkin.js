const inspectorStores = require('../../utils/inspectorStores.js');
const inspectorStoreRecords = require('../../utils/inspectorStoreRecords.js');
const demoSlots = require('../../utils/demoSlots.js');
const photoCaptureMeta = require('../../utils/photoCaptureMeta.js');
const slotLatestPhoto = require('../../utils/slotLatestPhoto.js');

function groupSlotsForDisplay(slots) {
  const typesOrder = demoSlots.ALL_SLOT_TYPES || [];
  const map = {};
  (slots || []).forEach((s) => {
    const t = s.type || '其他';
    if (!map[t]) map[t] = [];
    map[t].push(s);
  });
  const seen = new Set();
  const order = [];
  typesOrder.forEach((t) => {
    if (map[t] && map[t].length) {
      order.push(t);
      seen.add(t);
    }
  });
  Object.keys(map).forEach((t) => {
    if (!seen.has(t) && map[t].length) order.push(t);
  });
  return order.map((t) => ({ type: t, items: map[t] }));
}

function buildGroups(slots, sessionCaptured) {
  const base = groupSlotsForDisplay(slots);
  return base.map((g) => ({
    ...g,
    items: g.items.map((s) => {
      const fb =
        s.photo || `https://picsum.photos/seed/${encodeURIComponent(s.code || 'slot')}/160/120`;
      const displayThumb = slotLatestPhoto.getLatestThumbForSlot(s.code, fb);
      return {
        ...s,
        displayThumb,
        sessionDone: !!sessionCaptured[s.code],
      };
    }),
  }));
}

Page({
  data: {
    storeId: '',
    storeName: '',
    groups: [],
    sessionCaptured: {},
    totalCount: 0,
    doneCount: 0,
    allDone: false,
    emptyHint: false,
  },

  onLoad(options) {
    const storeId = options && options.storeId ? String(options.storeId) : '';
    if (!storeId) {
      wx.showToast({ title: '缺少门店', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 400);
      return;
    }
    const stores = inspectorStores.getStores();
    const store = stores.find((s) => s.id === storeId);
    if (!store) {
      wx.showToast({ title: '门店不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 400);
      return;
    }
    const storeName = store.name || '';
    wx.setNavigationBarTitle({ title: storeName });
    this.setData({ storeId, storeName });
    this.reloadSlots(true, storeId, storeName);
  },

  reloadSlots(resetSession, sid, sname) {
    const storeId = sid || this.data.storeId;
    const storeName = sname || this.data.storeName;
    inspectorStoreRecords.ensureRecordForStore({ id: storeId, name: storeName });
    let slots = (inspectorStoreRecords.getRecord(storeId) || {}).slots || [];
    if (!slots.length) {
      slots = inspectorStoreRecords.ensureDemoSlotsSeededInRecord(storeId, storeName) || [];
    }
    if (!slots.length) {
      this.setData({
        groups: [],
        emptyHint: true,
        totalCount: 0,
        doneCount: 0,
        allDone: false,
        sessionCaptured: resetSession ? {} : this.data.sessionCaptured,
      });
      return;
    }
    const sessionCaptured = resetSession ? {} : this.data.sessionCaptured;
    const groups = buildGroups(slots, sessionCaptured);
    const doneCount = slots.filter((s) => s && s.code && sessionCaptured[s.code]).length;
    const allDone = slots.length > 0 && slots.every((s) => s && s.code && sessionCaptured[s.code]);
    this.setData({
      groups,
      emptyHint: false,
      sessionCaptured,
      totalCount: slots.length,
      doneCount,
      allDone,
    });
  },

  onTapSlot(e) {
    const code = e.currentTarget.dataset.code;
    const type = e.currentTarget.dataset.type || '灯箱';
    const { storeId, storeName } = this.data;
    if (!code || !storeId) return;

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const temp = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath;
        if (!temp) return;
        wx.getFileSystemManager().saveFile({
          tempFilePath: temp,
          success: (r) => {
            const prefix = `门店：${storeName || ''}`;
            photoCaptureMeta.getCaptureMeta({ addressPrefix: prefix }, (meta) => {
              inspectorStoreRecords.upsertSlotPhotoByCode(storeId, code, r.savedFilePath, {
                watermarkTime: meta.timeStr,
                watermarkAddress: meta.address,
                recordedAt: meta.recordedAt,
                type,
                status: '正常',
              });
              const sessionCaptured = { ...this.data.sessionCaptured, [code]: true };
              const slots = (inspectorStoreRecords.getRecord(storeId) || {}).slots || [];
              const groups = buildGroups(slots, sessionCaptured);
              const doneCount = slots.filter((s) => s && s.code && sessionCaptured[s.code]).length;
              const allDone =
                slots.length > 0 && slots.every((s) => s && s.code && sessionCaptured[s.code]);
              this.setData({
                sessionCaptured,
                groups,
                doneCount,
                allDone,
              });
              wx.showToast({ title: '已保存', icon: 'success' });
            });
          },
          fail: () => wx.showToast({ title: '保存失败', icon: 'none' }),
        });
      },
      fail: () => wx.showToast({ title: '未拍照', icon: 'none' }),
    });
  },

  onCompleteCheckin() {
    if (!this.data.allDone) {
      wx.showToast({ title: '请为全部广告位拍照后再完成打卡', icon: 'none' });
      return;
    }
    const { storeId } = this.data;
    inspectorStoreRecords.markCompleted(storeId);
    inspectorStoreRecords.markGridCheckinDoneForMonth(storeId);
    wx.showToast({ title: '打卡完成', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 500);
  },
});
