# 代号 Mr.Blue · web-hub

私人网站导航站。**当前版本：v0.4（2026-11-16）**。

## 已实现
- 保留 v0.2 / v0.3 确认的 Apple 风格紧凑首页、品牌名、顶部「个人启动台」和蓝色 M 图形。
- 9 张卡片：蓝老师补习班 + 7 个公开 GitHub Pages 工具 + 1 个不含私人地址的「冰淇淋与河豚」卡片。
- 原八款已批准工具 Logo 使用原始 PNG；补习班使用原品牌猫猫头像，非毕业帽。
- 每张卡片右上角的星星可以加入/取消「常用」。
- 「管理分类」支持新增、重命名、删除分类；点击卡片底部分类标签可移动网站。
- 搜索、分类筛选、卡片/列表切换、深浅主题、键盘快捷键、手机与电脑适配。
- 自定义设置保存在**当前浏览器** localStorage（键名：`mrblue:customization:v1`）；不跨设备同步。

## 文件
目前仓库根目录 `index.html` 为 **完全自包含** 的静态 v0.4 页面，内嵌脚本、样式与图标，不依赖额外构建命令。对本文件的修改会触发 GitHub Pages 部署工作流。

## 部署状态与启动步骤
仓库原先为空，现已上传 `index.html` 及 `.github/workflows/deploy-pages.yml`。第一次 GitHub Actions 部署失败，原因并非页面代码，而是新仓库 Pages 尚未由仓库拥有者在 UI 中启用，运行日志：`Resource not accessible by integration` (configure-pages)。

**仓库拥有者的一次性操作：**
1. 在仓库点击 **Settings → Pages**。
2. 在 **Build and deployment → Source** 选择 **GitHub Actions**，保存。
3. 打开 **Actions → Deploy Mr.Blue web-hub**，选择最新失败记录，点击 **Re-run all jobs**；或推送任意新提交触发自动部署。
4. 成功后到 `https://wb0801.github.io/web-hub/` 访问并验收功能和猫猫 Logo。

部署失败的 Actions 不代表网站已经上线；只有部署结论 success 及线上实际加载都通过才能声称上线成功。

## 安全与维护
公开的 `web-hub` 不含私有储蓄 PWA 的完整 URL、token、配对码或账目。请勿在公开源代码中写入私人访问凭据。仅按用户明确要求新增卡片或网站，**不自动收录其他 GitHub 仓库**。当前站点名称为「代号Mr.Blue」，不添加无用统计、装饰文案或宣传 Hero。

## 验收
常用切换/刷新保留、分类新增/改名/删除/移动、搜索、视图、主题及 320px/390px/1440px 布局已完成本地 Chromium 测试。真实 iPhone Safari 和 GitHub Pages 公开网址仍待用户终验。
