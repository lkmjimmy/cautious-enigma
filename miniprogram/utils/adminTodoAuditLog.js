/** 中台「待办」审核操作记录，本地保留最长 30 天 */
const KEY = 'adminTodoAuditLogV1';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_ITEMS = 400;

function pruneByAge(arr, now) {
  const cutoff = now - MAX_AGE_MS;
  return (arr || []).filter((x) => (x.recordedAt || 0) >= cutoff);
}

function readAll() {
  try {
    const raw = wx.getStorageSync(KEY);
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    return [];
  }
}

function persist(arr) {
  try {
    wx.setStorageSync(KEY, arr.slice(0, MAX_ITEMS));
  } catch (e) {
    /* ignore */
  }
}

function list() {
  const now = Date.now();
  let arr = readAll();
  const pruned = pruneByAge(arr, now);
  if (pruned.length !== arr.length) persist(pruned);
  return pruned.sort((a, b) => (b.recordedAt || 0) - (a.recordedAt || 0));
}

function append(entry) {
  const now = Date.now();
  const row = {
    id: entry.id || `audit_${now}_${Math.random().toString(36).slice(2, 10)}`,
    recordedAt: now,
    kind: entry.kind,
    payload: entry.payload || {},
  };
  let arr = pruneByAge(readAll(), now);
  arr.unshift(row);
  arr = pruneByAge(arr, now);
  persist(arr);
}

function formatTime(ts) {
  const d = new Date(ts);
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function shortUser(uid) {
  if (!uid) return '—';
  return uid.length > 14 ? `${uid.slice(0, 12)}…` : uid;
}

/** 供待办页展示 */
function listForView() {
  return list().map((r) => {
    const timeText = formatTime(r.recordedAt);
    const p = r.payload || {};
    if (r.kind === 'promote_handled') {
      const planMode = p.planMode || 'renew';
      const planModeLabel = planMode === 'expand' ? '加大推广计划' : '原推广计划续期';
      const typesText = (p.types || []).join('、');
      const expandSelections = p.expandSelections || [];
      const expandDetailText =
        planMode === 'expand' && expandSelections.length
          ? expandSelections.map((s) => `${s.store} · ${s.code}（${s.type}）`).join('；')
          : '';
      return {
        id: r.id,
        kind: r.kind,
        timeText,
        title: '续投意向 · 已安排对接',
        sub: planModeLabel,
        lines: [
          planMode === 'renew' ? `门店：${p.store || '—'}` : '',
          planMode === 'renew' && typesText ? `续投类型：${typesText}` : '',
          planMode === 'expand' && expandDetailText ? `加投空置：${expandDetailText}` : '',
          `推广时长：${p.spanText || '—'}（${p.periodUnitLabel || '—'}）`,
          p.createdAt ? `意向提交时间：${formatTime(p.createdAt)}` : '',
        ].filter(Boolean),
      };
    }
    if (r.kind === 'claim_approved') {
      return {
        id: r.id,
        kind: r.kind,
        timeText,
        title: '门店认领 · 已通过',
        sub: p.storeName || '—',
        lines: [`申请人：${shortUser(p.userId)}`, p.mode === 'noop' ? '说明：已是认领状态，已关闭重复申请' : ''].filter(Boolean),
      };
    }
    if (r.kind === 'claim_rejected') {
      return {
        id: r.id,
        kind: r.kind,
        timeText,
        title: '门店认领 · 已拒绝',
        sub: p.storeName || '—',
        lines: [`申请人：${shortUser(p.userId)}`],
      };
    }
    if (r.kind === 'claim_closed') {
      return {
        id: r.id,
        kind: r.kind,
        timeText,
        title: '门店认领 · 已关闭（门店已被他人认领）',
        sub: p.storeName || '—',
        lines: [`原申请人：${shortUser(p.userId)}`],
      };
    }
    return {
      id: r.id,
      kind: r.kind,
      timeText,
      title: '审核记录',
      sub: '',
      lines: [JSON.stringify(p).slice(0, 200)],
    };
  });
}

module.exports = {
  KEY,
  append,
  list,
  listForView,
};
