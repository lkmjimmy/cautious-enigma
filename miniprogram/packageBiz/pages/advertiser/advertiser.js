const priceNoticeUtil = require('../../../utils/priceNotice.js');
const slotOwnership = require('../../../utils/slotOwnership.js');
const clientPlacementSchedule = require('../../../utils/clientPlacementSchedule.js');
const slotLatestPhoto = require('../../../utils/slotLatestPhoto.js');
const storeHomeSlotPhotos = require('../../../utils/storeHomeSlotPhotos.js');

function resolveSlotPhotoWatermark(s) {
  const fallback = `https://picsum.photos/seed/${encodeURIComponent(s.code)}-install/400/260`;
  const src = slotLatestPhoto.getLatestThumbForSlot(s.code, fallback);
  const winOwner = slotLatestPhoto.isOwnerThumbWinning(s.code);
  const localRec = storeHomeSlotPhotos.getRecord(s.code);
  let watermarkTime = '';
  let address = '';
  if (winOwner && localRec && localRec.path) {
    watermarkTime = localRec.time || '';
    address = localRec.address || '';
  } else {
    watermarkTime = s.watermarkTime || '';
    address = s.watermarkAddress || '';
  }
  return { src, watermarkTime, address };
}

function buildPlacementRows(slots, now) {
  const rows = (slots || []).map((s) => {
    const d = clientPlacementSchedule.daysUntilExpire(s.expireAt, now);
    const expiringSoon = d !== null && d >= 0 && d <= 7;
    return {
      code: s.code,
      typeLabel: s.type,
      store: s.store,
      qty: 1,
      expireAt: s.expireAt === '--' ? '—' : s.expireAt,
      expiringSoon,
      placementStatus: s.status,
    };
  });
  rows.sort((a, b) => {
    if (a.expiringSoon !== b.expiringSoon) return a.expiringSoon ? -1 : 1;
    const ae = a.expireAt === '—' ? '9999-12-31' : a.expireAt;
    const be = b.expireAt === '—' ? '9999-12-31' : b.expireAt;
    return ae.localeCompare(be);
  });
  return rows;
}

const STORAGE_AD_CLIENT = 'currentAdvertiserClientId';

const EXPOSURE_PER_SLOT = 900;

function buildExposureNotice(slotCount) {
  const people = Math.max(0, Number(slotCount) || 0) * EXPOSURE_PER_SLOT;
  const numStr = people.toLocaleString('zh-CN');
  return `尊敬的客户您好：非常感谢您选择驿站传媒为您的企业做宣传，您所投放的广告每天将被（${numStr}）人看到，祝您业绩长虹！`;
}

Page({
  onLoad() {
    const demoClients = require('../../../utils/demoClients.js');
    const clientList = demoClients.getList();
    if (!wx.getStorageSync(STORAGE_AD_CLIENT) && clientList.length) {
      wx.setStorageSync(STORAGE_AD_CLIENT, clientList[0].id);
    }
  },

  data: {
    priceNotice: '',
    exposureNotice: '',
    placementRows: [],
    ownedSlots: [],
    stats: [
      { label: '在投广告位', value: 0 },
      { label: '7天内到期', value: 0 },
      { label: '历史投放', value: 0 },
    ],
    records: [],
  },

  onShow() {
    const now = new Date();
    const demoClients = require('../../../utils/demoClients.js');
    const clientId =
      wx.getStorageSync(STORAGE_AD_CLIENT) ||
      (demoClients.getList()[0] && demoClients.getList()[0].id) ||
      '';
    const ownedSlots = slotOwnership.getOwnedSlots(clientId);
    const soonCount = ownedSlots.filter((s) => {
      const d = clientPlacementSchedule.daysUntilExpire(s.expireAt, now);
      return d !== null && d >= 0 && d <= 7;
    }).length;
    const records = ownedSlots.map((s) => {
      const ph = resolveSlotPhotoWatermark(s);
      return {
        slot: s.code,
        store: s.store,
        period: s.expireAt && s.expireAt !== '--' ? `投放中 ~ ${s.expireAt}` : '投放周期待定',
        status: s.status === '即将到期' ? '即将到期' : '正常',
        photos: [
          {
            label: '实况照片',
            src: ph.src,
            watermarkTime: ph.watermarkTime || '—',
            address: ph.address || `${s.store} · 广告位 ${s.code}`,
          },
        ],
      };
    });
    this.setData({
      priceNotice: priceNoticeUtil.get(),
      exposureNotice: buildExposureNotice(ownedSlots.length),
      placementRows: buildPlacementRows(ownedSlots, now),
      ownedSlots,
      stats: [
        { label: '在投广告位', value: ownedSlots.length },
        { label: '7天内到期', value: soonCount },
        { label: '历史投放', value: ownedSlots.length },
      ],
      records,
    });
  },

  onMyContract() {
    wx.navigateTo({ url: '/packageBiz/pages/advertiser-contract/advertiser-contract' });
  },

  onExpandPromote() {
    wx.navigateTo({ url: '/packageBiz/pages/advertiser-placements/advertiser-placements?entry=expand' });
  },

  onContinuePromote() {
    wx.navigateTo({ url: '/packageBiz/pages/advertiser-placements/advertiser-placements?entry=renew' });
  },
});
