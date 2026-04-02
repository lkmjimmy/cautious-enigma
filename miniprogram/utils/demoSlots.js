/** 演示用各门店广告位列表（与 slots / store-home 一致） */
const RAW_SLOTS = [
  { code: 'SZ-FT-LX-01', store: '福田中心店', type: '灯箱', status: '空置', expireAt: '--' },
  { code: 'SZ-FT-LX-02', store: '福田中心店', type: '灯箱', status: '已投放', expireAt: '2026-05-20' },
  { code: 'SZ-FT-LX-03', store: '福田中心店', type: '灯箱', status: '已投放', expireAt: '2026-06-01' },
  { code: 'SZ-NS-LX-01', store: '南山科技园店', type: '灯箱', status: '已投放', expireAt: '2026-04-08' },
  { code: 'SZ-BA-LX-01', store: '宝安壹方城店', type: '灯箱', status: '即将到期', expireAt: '2026-04-05' },
  { code: 'SZ-FT-DT-01', store: '福田中心店', type: '地贴', status: '空置', expireAt: '--' },
  { code: 'SZ-FT-HJ-01', store: '福田中心店', type: '货架', status: '即将到期', expireAt: '2026-04-06' },
  { code: 'SZ-NS-LED-01', store: '南山科技园店', type: 'LED', status: '即将到期', expireAt: '2026-04-07' },
  { code: 'SZ-NS-MT-01', store: '南山科技园店', type: '门头', status: '已投放', expireAt: '2026-05-18' },
  { code: 'SZ-NS-CKY-01', store: '南山科技园店', type: '出库仪', status: '空置', expireAt: '--' },
  { code: 'SZ-BA-HJ-01', store: '宝安壹方城店', type: '货架', status: '即将到期', expireAt: '2026-04-05' },
  { code: 'SZ-BA-DT-01', store: '宝安壹方城店', type: '地贴', status: '空置', expireAt: '--' },
  { code: 'SZ-BA-MT-01', store: '宝安壹方城店', type: '门头', status: '已投放', expireAt: '2026-05-11' },
];

function slotsForStore(storeName) {
  return RAW_SLOTS.filter((s) => s.store === storeName).map((s) => ({
    code: s.code,
    type: s.type,
    status: s.status,
    expireAt: s.expireAt,
  }));
}

/** 全项目出现的全部广告位类型（固定顺序用于门店汇总表，无该类型时填 0） */
const ALL_SLOT_TYPES = [...new Set(RAW_SLOTS.map((s) => s.type))].sort((a, b) =>
  a.localeCompare(b, 'zh-CN')
);

module.exports = {
  RAW_SLOTS,
  slotsForStore,
  ALL_SLOT_TYPES,
};
