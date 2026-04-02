/** 演示客户列表（与投放意向无关，独立演示数据） */
const CLIENTS = [
  {
    id: 'c1',
    name: '王海',
    phone: '138****3301',
    company: '深圳新锐食品有限公司',
    inAd: true,
    placementLines: ['灯箱×2（最近到期 2026-05-20）', '地贴×1（2026-04-30）'],
  },
  {
    id: 'c2',
    name: '林芳',
    phone: '159****6602',
    company: '南山智创科技',
    inAd: true,
    placementLines: ['LED×1（2026-04-07）', '门头×1（2026-05-18）'],
  },
  {
    id: 'c3',
    name: '陈浩',
    phone: '186****7703',
    company: '宝安壹方城商贸',
    inAd: false,
    placementLines: [],
  },
  {
    id: 'c4',
    name: '黄薇',
    phone: '135****8804',
    company: '福田传媒策划',
    inAd: true,
    placementLines: ['货架×3（最近到期 2026-04-06）'],
  },
];

function getById(id) {
  return CLIENTS.find((c) => c.id === id) || null;
}

module.exports = { CLIENTS, getById };
