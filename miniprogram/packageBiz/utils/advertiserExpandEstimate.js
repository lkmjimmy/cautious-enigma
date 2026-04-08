const slotOwnership = require('../../utils/slotOwnership.js');
const clientSlotQuotes = require('../../utils/clientSlotQuotes.js');

function buildVacantSlotRows() {
  const slots = slotOwnership.getAllSlots().filter(function (s) {
    return s && s.status === '空置';
  });
  return slots
    .map(function (s) {
      return {
        code: s.code,
        store: s.store,
        type: s.type,
        status: s.status,
        expireAt: s.expireAt,
        rowKey: s.code,
        expireDisplay: s.expireAt === '--' ? '—' : s.expireAt,
        isVacant: true,
        statusClass: 'vacant',
      };
    })
    .sort(function (a, b) {
      if (a.store !== b.store) return String(a.store).localeCompare(String(b.store), 'zh-CN');
      return String(a.code).localeCompare(String(b.code), 'zh-CN');
    });
}

function totalMonthsFromPicker(periodUnitIndex, durationStr) {
  const n = Math.max(1, parseInt(String(durationStr || '1').trim(), 10) || 1);
  if (periodUnitIndex === 0) return n;
  if (periodUnitIndex === 1) return n * 3;
  return n * 12;
}

function periodLabel(periodUnitIndex, durationStr) {
  const n = String(durationStr || '1').trim() || '1';
  if (periodUnitIndex === 0) return n + '个月';
  if (periodUnitIndex === 1) return n + '个季度';
  return n + '年';
}

/**
 * @returns {{ totalMonths: number, totalYuan: number, lines: Array, missingQuote: boolean }}
 */
function computeEstimate(clientId, selectedCodes, vacantRows, periodUnitIndex, durationStr) {
  const tm = totalMonthsFromPicker(periodUnitIndex, durationStr);
  const codeSet = {};
  (selectedCodes || []).forEach(function (c) {
    codeSet[c] = true;
  });
  let total = 0;
  const lines = [];
  let missingQuote = false;
  (vacantRows || []).forEach(function (r) {
    if (!codeSet[r.code]) return;
    const monthly = clientSlotQuotes.getMonthlyPriceYuan(clientId, r.type);
    if (!monthly || monthly <= 0) missingQuote = true;
    const subtotal = monthly * tm;
    total += subtotal;
    lines.push({
      code: r.code,
      type: r.type,
      store: r.store,
      monthlyYuan: monthly,
      subtotalYuan: Math.round(subtotal * 100) / 100,
      hasPrice: monthly > 0,
    });
  });
  return {
    totalMonths: tm,
    totalYuan: Math.round(total * 100) / 100,
    lines: lines,
    missingQuote: missingQuote,
  };
}

module.exports = {
  buildVacantSlotRows,
  totalMonthsFromPicker,
  periodLabel,
  computeEstimate,
};
