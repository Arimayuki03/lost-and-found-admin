# 更新日志（Changelog）

本项目的所有重要变更都会记录在本文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-09-21

### Added

- 初始开源版本。
- 管理员 / 超级管理员双角色登录（JWT 双 token，自动刷新与 401 自愈）。
- 失物 / 拾物审核管理（列表、搜索、筛选、审核、删除，共用配置驱动页面）。
- 一键失物匹配与匹配统计。
- 公告管理、轮播图管理、反馈管理。
- 用户管理（双端）、管理员管理（超级管理员）。
- ECharts 数据统计可视化（统一图表主题）。
- 开源配套文件：LICENSE（MIT）、CONTRIBUTING、SECURITY、CHANGELOG。

### Fixed（修复，2026-09-20 安全与可用性审查后集中修复）

- **高危**：路由守卫对非空非法 role（如 localStorage 被污染为 `"hacker"`）会重定向回受保护页形成自环，生产包无限重定向（vue-router 防护仅在开发分支）。守卫改为解析 access token 的 JWT payload 交叉校验：claim 白名单（`super_admin`/`admin`，admin 兼容无 claim 的旧令牌）+ store role 一致性校验，任何非法/解析失败/不一致一律 `logout()` 后回登录页，绝不重定向回受保护页（`src/router/index.js`）。
- 登出补服务端撤销：`logout` action 改为异步，先调用后端 `POST /common/logout`（撤销 access/refresh 令牌）再清理本地，服务端失败时 fail-open 不阻塞登出；用 `isLoggingOut` 幂等标志、绕过 401 拦截器的原始 axios 调用与 `isAuthUrl` 排除列表三重防御避免登出与 401 自愈循环叠加（`src/store/modules/user.js`、`src/api/auth.js`、`src/api/index.js`）。
- 401 刷新后排队请求重发前补 `_retry` 置位；刷新失败跳转由硬编码 `window.location.href='/login'` 改为 `router.push('/login')`，部署在子路径时不再 404（`src/api/index.js`）。
- 首页统计口径修复：匹配卡与仪表盘改调后端口径正确的 `GET /admin/matching/stats`（distinct 物品计数、成功率封顶 ≤100%），不再用 N:M 匹配对数推算"未匹配"，消除负数与仪表盘越界（`src/views/admin/Home.vue`、`src/api/admin.js`）。
- 搜索失效修复：待审核列表支持关键词透传（后端 `/unreviewed`、`/sift` 同步支持 `keyword`）；超管用户管理删除客户端二次过滤，列表与 total 同源；`is_under_review`/`is_completed` 空值不再拼出 `"undefined"`（`src/views/admin/ItemsManagement.vue`、`src/views/superadmin/UserManagement.vue`、`src/api/admin.js`）。
- 添加管理员密码规则前后端对齐为 8-64 位，并透传后端错误字段（不再被统一文案吞掉）（`src/views/superadmin/AdminManagement.vue`、`src/store/modules/admin.js`）。
- "运行匹配"去掉固定 2 秒假宣告，改为按后端响应提示"已在后台启动"并延时刷新（`src/views/admin/Home.vue`）。
- 提交按钮补 `:loading` 防重复提交（管理员管理、超管用户管理）。
- 全屏状态改由 `fullscreenchange` 事件驱动（ESC 退出后图标同步）；移动端抽屉点菜单后自动收起；`index.html` 补 viewport meta（`src/layouts/AdminLayout.vue`）。
- 超管用户/管理员列表 store 读取补空值防护，避免后端结构异常时 TypeError 被吞（`src/store/modules/admin.js`）。
- 删除死代码 `src/store/index.js`（0 引用，main.js 独立创建 Pinia 实例，双实例陷阱不存在）。
