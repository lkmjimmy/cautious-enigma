/** 广告主页顶部「价格通知」与管理者端共用同一本地存储键（演示用，正式环境可换接口） */
const STORAGE_KEY = 'advertiserPriceNotice';

function get() {
  try {
    const t = wx.getStorageSync(STORAGE_KEY);
    return typeof t === 'string' ? t : '';
  } catch (e) {
    return '';
  }
}

function set(text) {
  try {
    wx.setStorageSync(STORAGE_KEY, text || '');
  } catch (e) {
    /* ignore */
  }
}

module.exports = { STORAGE_KEY, get, set };
