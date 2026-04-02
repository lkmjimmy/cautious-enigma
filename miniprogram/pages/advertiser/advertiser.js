const priceNoticeUtil = require('../../utils/priceNotice.js');
const demoSlots = require('../../utils/demoSlots.js');

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** 距今日天数；无效日期返回 null */
function daysUntilExpire(expireStr, now) {
  if (!expireStr || expireStr === '--') return null;
  const p = expireStr.split('-').map(Number);
  if (p.length !== 3 || p.some((x) => Number.isNaN(x))) return null;
  const end = new Date(p[0], p[1] - 1, p[2]);
  return Math.round((end - startOfDay(now)) / 86400000);
}

function buildLightboxRows(now) {
  const rows = demoSlots.RAW_SLOTS.filter((s) => s.type === '灯箱').map((s) => {
    const d = daysUntilExpire(s.expireAt, now);
    const expiringSoon = d !== null && d >= 0 && d <= 7;
    return {
      code: s.code,
      typeLabel: '灯箱',
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

Page({
  onLoad() {
    if (!wx.getStorageSync(STORAGE_AD_CLIENT)) {
      wx.setStorageSync(STORAGE_AD_CLIENT, 'c1');
    }
  },

  data: {
    priceNotice: '',
    lightboxRows: [],
    stats: [
      { label: '在投广告位', value: 6 },
      { label: '7天内到期', value: 2 },
      { label: '历史投放', value: 14 },
    ],
    records: [
      {
        slot: 'SZ-FT-01-A5',
        store: '福田中心店',
        period: '2026-03-01 ~ 2026-05-20',
        status: '正常',
        photos: [
          {
            label: '安装照',
            src: 'https://picsum.photos/seed/ad-ft-install/400/260',
            watermarkTime: '2026-03-01 10:28',
            address: '深圳市福田区福华一路××号 · 22.5412°N, 114.0588°E',
          },
          {
            label: '期中巡检照片',
            src: 'https://picsum.photos/seed/ad-ft-patrol/400/260',
            watermarkTime: '2026-04-01 09:15',
            address: '深圳市福田区福华一路××号 · 22.5410°N, 114.0591°E',
          },
          {
            label: '下刊照',
            src: 'https://picsum.photos/seed/ad-ft-remove/400/260',
            watermarkTime: '2026-05-20 18:00（计划）',
            address: '深圳市福田区福华一路××号 · 22.5413°N, 114.0586°E',
          },
        ],
      },
      {
        slot: 'SZ-NS-03-B2',
        store: '南山科技园店',
        period: '2026-02-15 ~ 2026-04-07',
        status: '即将到期',
        photos: [
          {
            label: '安装照',
            src: 'https://picsum.photos/seed/ad-ns-install/400/260',
            watermarkTime: '2026-02-15 14:02',
            address: '深圳市南山区科技园××路 · 22.5356°N, 113.9434°E',
          },
          {
            label: '期中巡检照片',
            src: 'https://picsum.photos/seed/ad-ns-patrol/400/260',
            watermarkTime: '2026-03-20 11:40',
            address: '深圳市南山区科技园××路 · 22.5358°N, 113.9431°E',
          },
          {
            label: '下刊照',
            src: 'https://picsum.photos/seed/ad-ns-remove/400/260',
            watermarkTime: '2026-04-07 17:30（计划）',
            address: '深圳市南山区科技园××路 · 22.5355°N, 113.9436°E',
          },
        ],
      },
    ],
  },

  onShow() {
    const now = new Date();
    this.setData({
      priceNotice: priceNoticeUtil.get(),
      lightboxRows: buildLightboxRows(now),
    });
  },

  onMyContract() {
    wx.navigateTo({ url: '/pages/advertiser-contract/advertiser-contract' });
  },

  onExpandPromote() {
    wx.navigateTo({ url: '/pages/advertiser-placements/advertiser-placements?entry=expand' });
  },

  onContinuePromote() {
    wx.navigateTo({ url: '/pages/advertiser-placements/advertiser-placements?entry=renew' });
  },
});
