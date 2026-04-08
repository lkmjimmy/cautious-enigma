/**
 * 全局入口。本机数据清空请使用：巡店/巡检页的「清空」或开发者工具清除缓存；
 * 工具方法见 packageBiz/utils/clearAppLocalStorage.js。
 */
const apiConfig = require('./utils/apiConfig.js');
const serverDataSync = require('./utils/serverDataSync.js');
const keepMainSharedUtilsForPackagingCheck = [
  require('./utils/demoClients.js'),
  require('./utils/photoCaptureMeta.js'),
  require('./utils/priceNotice.js'),
  require('./utils/promoteRequestInbox.js'),
];
void keepMainSharedUtilsForPackagingCheck;

App({
  globalData: {},

  onLaunch() {
    try {
      if (
        wx.getStorageSync('loggedIn') &&
        apiConfig.useServer &&
        apiConfig.baseUrl &&
        wx.getStorageSync('apiToken')
      ) {
        serverDataSync.pullCoreData({ force: true }).catch(function () {});
      }
    } catch (e) {
      /* ignore */
    }
  },

  onError(msg) {
    console.error('[App.onError]', msg);
  },

  onPageNotFound(res) {
    console.warn('[App.onPageNotFound]', res.path, res.query);
    wx.redirectTo({ url: '/pages/index/index' });
  },
});
