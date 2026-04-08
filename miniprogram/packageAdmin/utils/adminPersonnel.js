/** 中台维护的人员角色（本地存储） */
const KEY = 'adminPersonnelList';

const ROLE_OPTIONS = ['巡店员', '店主', '广告主', '业务员'];

function getList() {
  try {
    const raw = wx.getStorageSync(KEY);
    if (raw && Array.isArray(raw)) return raw;
  } catch (e) {
    /* ignore */
  }
  return [];
}

function saveList(list) {
  try {
    wx.setStorageSync(KEY, list);
  } catch (e) {
    /* ignore */
  }
}

function updateRole(id, roleIndex) {
  const list = getList().map((row) =>
    row.id === id ? { ...row, roleIndex: Math.max(0, Math.min(ROLE_OPTIONS.length - 1, roleIndex)) } : row
  );
  saveList(list);
  return list;
}

function removeById(id) {
  if (!id) return getList();
  const list = getList().filter((row) => row.id !== id);
  saveList(list);
  return list;
}

module.exports = { KEY, ROLE_OPTIONS, getList, saveList, updateRole, removeById };
