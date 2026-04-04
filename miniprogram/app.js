/**
 * 全局入口。本机数据清空请使用：巡店/巡检页的「清空」或开发者工具清除缓存；
 * 工具方法见 utils/clearAppLocalStorage.js。
 */
App({
  globalData: {},

  onError(msg) {
    console.error('[App.onError]', msg);
  },

  onPageNotFound(res) {
    console.warn('[App.onPageNotFound]', res.path, res.query);
    wx.redirectTo({ url: '/pages/index/index' });
  },
});
