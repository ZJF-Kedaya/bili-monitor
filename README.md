# B站UP主监控（Cloudflare Worker）

一个免 Wrangler 部署的监控工具，检测多个 UP 主的视频和动态更新，并通过企业微信 Webhook 通知，或调用你的下载接口后上传到 WebDAV。

## 功能
- 监控多个 UP 主的视频与动态
- 企业微信 Webhook 通知
- 调用下载接口后上传 WebDAV
- 前端配置，无需修改代码文件
- Cron 每分钟触发，按配置间隔实际执行

## 文件
- worker.js：全部逻辑
- wrangler.toml：Cloudflare Worker 配置
- package.json：模块声明

## 部署步骤

1. 创建 GitHub 仓库，将本目录上传。
2. 打开 Cloudflare Dashboard -> Workers & Pages -> KV -> Create a namespace，复制命名空间 ID。
3. 打开 wrangler.toml，把 PASTE_YOUR_KV_NAMESPACE_ID_HERE 替换成刚才的 ID，然后推送到 GitHub。
4. 在 Cloudflare Dashboard -> Workers & Pages -> Create -> Workers -> Deploy via GitHub，选择你的仓库。
5. 部署完成后打开 Worker 的默认域名，在页面上配置 Cookie、企业微信、WebDAV，并添加 UP 主。

## 配置说明
- Cookie：建议粘贴浏览器中 bilibili.com 的完整 Cookie，至少包含 SESSDATA。
- 企业微信 Webhook：群机器人的完整地址。
- WebDAV：目录地址、用户名、密码。上传路径为 WebDAV地址/mid_名称/bvid_标题.mp4。
- 下载接口前缀：默认 https://bili.kedaya.gq/api/download?url=，会自动拼接编码后的 B 站视频链接。
- 检查间隔：Worker 每分钟被 Cron 唤醒，按此处分钟数控制真正执行频率。

## 手动检查
页面上的“立即检查”按钮会直接执行一次完整检查；日志显示运行结果。

## 注意事项
- B 站接口可能因为风控对 Cookie 有要求，Cookie 失效时日志会显示错误。
- Worker 免费计划有执行时长和响应体限制，视频下载上传交给第三方下载接口处理，但 Worker 仍需流式转发。
- 首次添加 UP 主后会先记录基线，不会立刻通知已有内容；可勾选“首次运行时也推送”。