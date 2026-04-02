const claim = require('../../utils/claim.js');
const demoSlots = require('../../utils/demoSlots.js');
const storeHomeSlotPhotos = require('../../utils/storeHomeSlotPhotos.js');
const slotLatestPhoto = require('../../utils/slotLatestPhoto.js');
const photoCaptureMeta = require('../../utils/photoCaptureMeta.js');
const storeMonthlyCheckin = require('../../utils/storeMonthlyCheckin.js');

function enrichGroupsWithLocalPhotos(groups) {
  return groups.map((g) => ({
    ...g,
    items: g.items.map((cell) => {
      const rec = storeHomeSlotPhotos.getRecord(cell.code);
      const displayThumb = cell.thumb;
      const winOwner = slotLatestPhoto.isOwnerThumbWinning(cell.code);
      const hasLocalPhoto = !!(rec && rec.path) && winOwner;
      const ownerUpdatedThisMonth = storeMonthlyCheckin.isSlotDoneThisMonth(cell.code);
      return {
        ...cell,
        displayThumb,
        hasLocalPhoto,
        ownerUpdatedThisMonth,
        watermarkTime: hasLocalPhoto ? (rec.time || '') : '',
        watermarkAddress: hasLocalPhoto ? (rec.address || '') : '',
      };
    }),
  }));
}

Page({
  data: {
    storeName: '',
    approvedStores: [],
    storeIndex: 0,
    stats: [],
    groups: [],
    showStoreSheet: false,
    storeSheetSelectedIndex: 0,

    checkinMonthLabel: '',
    checkinTotal: 0,
    checkinUpdated: 0,
    checkinAllDone: false,
  },

  onLoad(options) {
    if (options.store) {
      claim.setCurrentStoreView(decodeURIComponent(options.store));
    }
  },

  onShow() {
    claim.ensureUserId();
    if (!claim.hasAnyApprovedStore()) {
      wx.redirectTo({ url: '/pages/store-claim/store-claim' });
      return;
    }
    const approved = claim.getMyApprovedStores(claim.ensureUserId());
    let name = claim.getCurrentStoreView();
    if (!approved.includes(name)) {
      name = approved[0];
    }
    const storeIndex = Math.max(0, approved.indexOf(name));
    this.setData({ approvedStores: approved, storeIndex });
    this.loadStore(name);
  },

  loadStore(name) {
    claim.setCurrentStoreView(name);
    const slots = demoSlots.slotsForStore(name);
    const checkin = storeMonthlyCheckin.getMonthlyCheckinStatus(name);
    const groups = enrichGroupsWithLocalPhotos(demoSlots.buildStoreVisualGroups(name));
    const filled = slots.filter((s) => s.status === '已投放').length;
    const vacant = slots.filter((s) => s.status === '空置').length;
    const expiring = slots.filter((s) => s.status === '即将到期').length;
    this.setData({
      storeName: name,
      groups,
      checkinMonthLabel: checkin.monthLabel,
      checkinTotal: checkin.total,
      checkinUpdated: checkin.updatedThisMonth,
      checkinAllDone: checkin.allDone,
      stats: [
        { label: '已投放', value: filled, tone: 'success' },
        { label: '空置', value: vacant, tone: 'danger' },
        { label: '即将到期', value: expiring, tone: 'warning' },
      ],
    });
  },

  onThumbTap(e) {
    const code = e.currentTarget.dataset.code;
    if (!code) return;
    this._pickAndSaveSlotPhoto(code);
  },

  _pickAndSaveSlotPhoto(slotCode) {
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
            const store = this.data.storeName || '';
            const baseAddr = `门店：${store}`;
            photoCaptureMeta.getCaptureMeta({ addressPrefix: baseAddr }, (meta) => {
              storeHomeSlotPhotos.setRecord(slotCode, {
                path: r.savedFilePath,
                time: meta.timeStr,
                address: meta.address,
                recordedAt: meta.recordedAt,
              });
              this.loadStore(this.data.storeName);
              wx.showToast({ title: '已更新照片', icon: 'success' });
            });
          },
          fail: () => wx.showToast({ title: '保存失败', icon: 'none' }),
        });
      },
      fail: () => {},
    });
  },

  openStoreSheet() {
    if ((this.data.approvedStores || []).length <= 1) return;
    this.setData({ showStoreSheet: true, storeSheetSelectedIndex: this.data.storeIndex });
  },

  onStoreSheetSelect(e) {
    const i = e.detail.index;
    const name = this.data.approvedStores[i];
    if (!name) {
      this.setData({ showStoreSheet: false });
      return;
    }
    this.setData({ showStoreSheet: false, storeIndex: i });
    this.loadStore(name);
  },

  onStoreSheetClose() {
    this.setData({ showStoreSheet: false });
  },

  goClaimMore() {
    wx.navigateTo({
      url: '/pages/store-claim/store-claim',
    });
  },

  goRevenue() {
    wx.navigateTo({
      url: `/pages/store-revenue/store-revenue?store=${encodeURIComponent(this.data.storeName)}`,
    });
  },
});
