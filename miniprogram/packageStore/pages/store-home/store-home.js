const claim = require('../../../utils/claim.js');
const demoSlots = require('../../../utils/demoSlots.js');
const slotOwnership = require('../../../utils/slotOwnership.js');
const storeHomeSlotPhotos = require('../../../utils/storeHomeSlotPhotos.js');
const slotLatestPhoto = require('../../../utils/slotLatestPhoto.js');
const photoCaptureMeta = require('../../../utils/photoCaptureMeta.js');
const storeMonthlyCheckin = require('../../utils/storeMonthlyCheckin.js');

function buildGroupsFromSlots(slotsForStore) {
  const byType = {};
  slotsForStore.forEach((s) => {
    const expireSoon = s.expireSoon;
    const showExpireBadge = s.status === '即将到期' || expireSoon;
    const statusClass =
      s.status === '空置'
        ? 'vacant'
        : s.status === '待定'
          ? 'pending'
          : s.status === '已到期'
            ? 'expired'
            : s.status === '即将到期' || expireSoon
              ? 'soon'
              : 'on';
    const item = {
      code: s.code,
      status: s.status,
      expireAt: s.expireAt,
      expireDisplay: s.expireAt === '--' ? '—' : s.expireAt,
      thumb: s.thumb,
      thumbVacant: s.thumbVacant,
      expireSoon,
      showExpireBadge,
      statusClass,
    };
    if (!byType[s.type]) byType[s.type] = [];
    byType[s.type].push(item);
  });
  const ordered = [];
  demoSlots.ALL_SLOT_TYPES.forEach((t) => {
    if (byType[t] && byType[t].length) {
      byType[t].sort((a, b) => String(a.code).localeCompare(String(b.code), 'zh-CN'));
      ordered.push({ type: t, count: byType[t].length, items: byType[t] });
    }
  });
  Object.keys(byType).forEach((t) => {
    if (!demoSlots.ALL_SLOT_TYPES.includes(t) && byType[t].length) {
      byType[t].sort((a, b) => String(a.code).localeCompare(String(b.code), 'zh-CN'));
      ordered.push({ type: t, count: byType[t].length, items: byType[t] });
    }
  });
  return ordered;
}

function enrichGroupsWithLocalPhotos(groups) {
  return groups.map((g) => ({
    ...g,
    items: g.items.map((cell) => {
      if (cell.thumbVacant) {
        return {
          ...cell,
          displayThumb: '',
          hasLocalPhoto: false,
          ownerUpdatedThisMonth: false,
          watermarkTime: '',
          watermarkAddress: '',
        };
      }
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
      wx.redirectTo({ url: '/packageStore/pages/store-claim/store-claim' });
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
    const enriched = slotOwnership.getAllSlots().filter((s) => s.store === name);
    const checkin = storeMonthlyCheckin.getMonthlyCheckinStatus(name);
    const groups = enrichGroupsWithLocalPhotos(buildGroupsFromSlots(enriched));
    const filled = enriched.filter((s) => s.status === '已投放').length;
    const vacant = enriched.filter((s) => s.status === '空置').length;
    const pending = enriched.filter((s) => s.status === '待定').length;
    const expiring = enriched.filter((s) => s.status === '即将到期').length;
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
        { label: '待定', value: pending, tone: 'default' },
        { label: '即将到期', value: expiring, tone: 'warning' },
      ],
    });
  },

  onSlotPhotoTap(e) {
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
      url: '/packageStore/pages/store-claim/store-claim',
    });
  },

  goRevenue() {
    wx.navigateTo({
      url: `/packageStore/pages/store-revenue/store-revenue?store=${encodeURIComponent(this.data.storeName)}`,
    });
  },
});
