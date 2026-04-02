/** 广告主「继续推广」意向 → 管理者端本地收件箱（演示；正式环境可换模板消息/订阅消息） */
const KEY = 'adminPromoteRequests';

function list() {
  try {
    const raw = wx.getStorageSync(KEY);
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    return [];
  }
}

function push(entry) {
  const arr = list();
  arr.unshift({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    ...entry,
  });
  try {
    wx.setStorageSync(KEY, arr.slice(0, 100));
  } catch (e) {
    /* ignore */
  }
}

function removeById(id) {
  const arr = list().filter((x) => x.id !== id);
  try {
    wx.setStorageSync(KEY, arr);
  } catch (e) {
    /* ignore */
  }
}

module.exports = { KEY, list, push, removeById };
