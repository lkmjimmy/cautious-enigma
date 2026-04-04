/**
 * 中国大陆手机号：11 位数字，以 1 开头，第二位为 3–9。
 */
function isValidMainlandMobile(phone) {
  const s = String(phone || '').trim();
  return /^1[3-9]\d{9}$/.test(s);
}

/** 仅保留数字并截断为最多 11 位，用于 input 绑定 */
function sanitizePhoneInput(value) {
  return String(value || '')
    .replace(/\D/g, '')
    .slice(0, 11);
}

function invalidToastTitle() {
  return '请输入11位有效手机号';
}

module.exports = {
  isValidMainlandMobile,
  sanitizePhoneInput,
  invalidToastTitle,
};
