/** 按门店展示的广告位分组（可由接口或本地存储填充；初始无演示数据） */
const STORE_SLOTS = {};

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
