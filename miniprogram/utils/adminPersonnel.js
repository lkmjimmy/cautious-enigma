/** 中台维护的人员角色（演示：本地存储） */
const KEY = 'adminPersonnelList';

const ROLE_OPTIONS = ['巡店员', '店主', '广告主', '业务员'];

const DEFAULT = [
  { id: 'p1', name: '周强', phone: '138****2101', roleIndex: 0 },
  { id: 'p2', name: '孙丽', phone: '159****3202', roleIndex: 1 },
  { id: 'p3', name: '吴磊', phone: '186****4403', roleIndex: 2 },
  { id: 'p4', name: '郑洁', phone: '137****5504', roleIndex: 3 },
];

function getList() {
  try {
    const raw = wx.getStorageSync(KEY);
    if (raw && Array.isArray(raw) && raw.length) return raw;
  } catch (e) {
    /* ignore */
  }
  return DEFAULT.map((x) => ({ ...x }));
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

module.exports = { KEY, ROLE_OPTIONS, getList, saveList, updateRole };
