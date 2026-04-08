/**
 * 清空本机全部小程序本地存储（含登录态、业务数据）。
 * 巡店/巡检页的「清空」会调用此处；清空后需重新登录。
 */
function clearAll() {
  try {
    wx.clearStorageSync();
  } catch (e) {
    /* ignore */
  }
}

module.exports = { clearAll };
