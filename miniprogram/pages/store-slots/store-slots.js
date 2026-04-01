const VACANT_IMAGE = 'https://dummyimage.com/300x200/f3f4f6/9ca3af.png&text=%E7%A9%BA%E7%BD%AE';

const STORE_SLOTS = {
  福田中心店: [
    {
      type: '灯箱',
      items: [
        { id: 'FT-LX-01', status: '已投放', image: 'https://picsum.photos/seed/ftlx1/300/200' },
        { id: 'FT-LX-02', status: '已投放', image: 'https://picsum.photos/seed/ftlx2/300/200' },
        { id: 'FT-LX-03', status: '即将到期', image: 'https://picsum.photos/seed/ftlx3/300/200' },
        { id: 'FT-LX-04', status: '空置', image: VACANT_IMAGE },
        { id: 'FT-LX-05', status: '已投放', image: 'https://picsum.photos/seed/ftlx5/300/200' },
        { id: 'FT-LX-06', status: '空置', image: VACANT_IMAGE },
        { id: 'FT-LX-07', status: '已投放', image: 'https://picsum.photos/seed/ftlx7/300/200' },
        { id: 'FT-LX-08', status: '已投放', image: 'https://picsum.photos/seed/ftlx8/300/200' },
      ],
    },
    {
      type: '地贴',
      items: [
        { id: 'FT-DT-01', status: '已投放', image: 'https://picsum.photos/seed/ftdt1/300/200' },
        { id: 'FT-DT-02', status: '空置', image: VACANT_IMAGE },
        { id: 'FT-DT-03', status: '已投放', image: 'https://picsum.photos/seed/ftdt3/300/200' },
      ],
    },
    {
      type: '货架',
      items: [
        { id: 'FT-HJ-01', status: '已投放', image: 'https://picsum.photos/seed/fthj1/300/200' },
        { id: 'FT-HJ-02', status: '即将到期', image: 'https://picsum.photos/seed/fthj2/300/200' },
      ],
    },
  ],
  南山科技园店: [
    {
      type: 'LED',
      items: [
        { id: 'NS-LED-01', status: '已投放', image: 'https://picsum.photos/seed/nsled1/300/200' },
        { id: 'NS-LED-02', status: '即将到期', image: 'https://picsum.photos/seed/nsled2/300/200' },
        { id: 'NS-LED-03', status: '空置', image: VACANT_IMAGE },
      ],
    },
    {
      type: '门头',
      items: [
        { id: 'NS-MT-01', status: '已投放', image: 'https://picsum.photos/seed/nsmt1/300/200' },
        { id: 'NS-MT-02', status: '已投放', image: 'https://picsum.photos/seed/nsmt2/300/200' },
      ],
    },
  ],
  宝安壹方城店: [
    {
      type: '出库仪',
      items: [
        { id: 'BA-CKY-01', status: '空置', image: VACANT_IMAGE },
        { id: 'BA-CKY-02', status: '即将到期', image: 'https://picsum.photos/seed/backy2/300/200' },
      ],
    },
    {
      type: '灯箱',
      items: [
        { id: 'BA-LX-01', status: '已投放', image: 'https://picsum.photos/seed/balx1/300/200' },
        { id: 'BA-LX-02', status: '空置', image: VACANT_IMAGE },
      ],
    },
  ],
};

Page({
  data: {
    store: '',
    groups: [],
  },

  onLoad(options) {
    const store = decodeURIComponent(options.store || '');
    const groups = (STORE_SLOTS[store] || []).map((group) => ({
      type: group.type,
      count: group.items.length,
      items: group.items,
    }));
    this.setData({ store, groups });
    if (store) {
      wx.setNavigationBarTitle({ title: `${store}广告位` });
    }
  },
});
