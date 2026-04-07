/**
 * 后端 API 开关与基地址（与仓库 `backend/` 配套）
 *
 * 当前默认指向 **微信云托管** 公网域名；仅本机联调时可改回 http://127.0.0.1:3000，
 * 并在开发者工具勾选「不校验合法域名」。
 *
 * 控制台里 [Deprecation] SharedArrayBuffer、getSystemInfo 提示等来自开发者工具/基础库，可忽略。
 *
 * baseUrl / secondaryBaseUrl 不要末尾 /
 *
 * debugApiLog：是否打印每条 wx.request URL。未设置时：体验版/开发版为 true，正式版为 false。
 */
module.exports = {
  /** 是否请求后端（false 时仅用本地 wx.storage） */
  useServer: true,

  /** 正式上架建议 false；未设置时正式版自动 false */
  debugApiLog: false,

  /**
   * 云托管 HTTPS（服务 express-17qb 默认域名）
   */
  baseUrl: 'https://express-17qb-243105-7-1419714752.sh.run.tcloudbase.com',

  /**
   * 本机联调示例：'http://192.168.x.x:3000'；上线请留空
   */
  secondaryBaseUrl: '',

  /**
   * baseUrl 为私网 IP 时：true 先 127 再私网；false 先私网再 127。
   */
  preferLoopbackFirst: true,
};
