<div align="center">

# 🖥️ 失物招领管理后台

**基于 Vue 3 + Element Plus 的校园失物招领平台管理后台**

失物/拾物审核 · 公告与轮播图管理 · 用户与管理员管理 · ECharts 数据可视化

[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.4-409EFF?logo=element&logoColor=white)](https://element-plus.org/)
[![ECharts](https://img.shields.io/badge/ECharts-5.6-AA344D?logo=apacheecharts&logoColor=white)](https://echarts.apache.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/Arimayuki03/lost-and-found-admin?label=Release)](../../releases)
[![Version](https://img.shields.io/badge/version-1.0.1-blue)](CHANGELOG.md)

</div>

---

## 📖 简介

面向管理员与超级管理员的管理后台前端，提供失物/拾物审核、公告与轮播图管理、用户与管理员账户管理、数据统计可视化等能力。

> **v1.0.1**：全量代码审查后集中修复——添加管理员密码校验对齐后端 8-64 规则、超管 store 透传后端语义化错误、移除对管理员 100% 失败的死删除按钮、高级筛选不再静默丢弃搜索关键词、el-upload 上传地址改走 `VITE_API_BASE_URL` 共享常量、学号/邮箱长度校验与后端对齐。详见 [CHANGELOG](CHANGELOG.md)。

## 📦 相关仓库

| 仓库 | 说明 | 默认端口 |
| --- | --- | --- |
| [lost-and-found](https://github.com/Arimayuki03/lost-and-found) | Flask 后端（API、Socket.IO、匹配算法、邮件通知） | 5000 |
| [lost-and-found-user](https://github.com/Arimayuki03/lost-and-found-user) | 用户端前端（uni-app Vue3，H5 / 微信小程序 / App） | 5173（CLI H5） |
| [lost-and-found-admin](https://github.com/Arimayuki03/lost-and-found-admin) | **本项目**：管理后台前端（Vue 3 + Element Plus） | 8001 |

## ✨ 功能特性

- 🔑 **双角色登录**：管理员（admin，学号 + 密码）与超级管理员（superadmin，用户名 + 密码）双 Tab 登录，JWT 双 token（access_token / refresh_token）自动续期，401 自愈重试。
- ✅ **失物/拾物审核**：列表分页、搜索、筛选、审核与取消审核、删除；失物与拾物共用一套配置驱动页面。
- 🤝 **一键匹配**：管理员首页可一键触发失物匹配，并展示匹配成功率、匹配状态统计。
- 📊 **数据统计可视化**：ECharts 分类统计图与时间趋势图，统一图表主题。
- 📢 **公告管理**：公告增删改查、搜索、排序。
- 🖼️ **轮播图管理**：轮播图增删改查。
- 👥 **用户管理**：用户列表分页、搜索、排序、编辑、删除（管理员端与超管端均有）。
- 🛡️ **管理员管理**：超级管理员可查看管理员列表、新增管理员、更新用户信息。
- 💬 **反馈管理**：用户反馈列表查看与删除。
- 🧭 **统一布局**：侧边栏折叠、页面全屏切换（fullscreenchange 事件同步状态）、窄屏抽屉模式（点菜单自动收起）。
- 📐 **统计口径**：首页匹配统计与仪表盘使用后端 `/admin/matching/stats` 的真实物品口径（成功率 ≤100%）。
- 🔒 **路由级权限**：全局导航守卫校验登录态与角色，解析 access token 的 JWT payload 交叉校验角色，无权限自动跳转对应控制面板。

## 🧰 技术栈

版本与 `package.json` 保持一致。

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Vue | ^3.5.13 |
| 构建工具 | Vite | ^6.2.0 |
| UI 组件库 | Element Plus（已全局配置中文语言包） | ^2.4.3 |
| 图标 | @element-plus/icons-vue（全局注册） | ^2.3.1 |
| 状态管理 | Pinia | ^2.1.7 |
| 路由 | Vue Router（History 模式） | ^4.2.5 |
| HTTP 请求 | Axios（封装请求/响应拦截器） | ^1.6.2 |
| 图表 | ECharts | ^5.6.0 |
| 样式 | Sass | ^1.69.5 |
| Vue 插件 | @vitejs/plugin-vue | ^5.2.1 |

## 🚀 快速开始

### 环境要求

- Node.js 18+
- 后端服务运行在 `http://localhost:5000`（见 [lost-and-found](https://github.com/Arimayuki03/lost-and-found) 后端项目）

### 安装与启动

```bash
# 克隆仓库
git clone https://github.com/Arimayuki03/lost-and-found-admin.git
cd lost-and-found-admin

# 安装依赖
npm install

# 启动开发服务器（默认端口 8001）
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

启动后访问 <http://localhost:8001>。

> 💡 本管理端依赖后端接口，请先启动 [lost-and-found](https://github.com/Arimayuki03/lost-and-found) 后端（端口 5000）再登录使用。

### 代理配置

开发环境下，Vite 将 `/api` 开头的请求代理到后端，并**去除 `/api` 前缀**（见 `vite.config.js`）：

```text
/api/admin/login  →  http://localhost:5000/admin/login
```

也可通过环境变量 `VITE_API_BASE_URL` 覆盖请求基础路径（默认 `/api`）。

## 🏗️ 项目结构

```text
src/
├── api/                    # 接口层
│   ├── index.js            # axios 实例封装（拦截器、token 刷新、并发 401 队列）
│   ├── auth.js             # 刷新 access_token
│   ├── admin.js            # 管理员端业务接口
│   └── superadmin.js       # 超级管理员端接口
├── assets/
│   └── images/             # 静态图片（登录背景、Logo）
├── components/             # 通用组件
│   ├── LfChart.vue         # ECharts 托管组件（统一主题、自动 resize/dispose）
│   ├── LfFilterPanel.vue   # 通用筛选/排序面板
│   ├── LfPageHeader.vue    # 页面标题头
│   └── LfTable.vue         # 通用表格卡片
├── layouts/
│   ├── AdminLayout.vue     # 统一布局壳（侧边栏 + 顶栏、折叠/全屏/退出）
│   └── menus.js            # 菜单配置
├── router/
│   ├── index.js            # 路由实例 + 全局导航守卫（登录/角色校验）
│   ├── admin.routes.js     # 管理员路由
│   └── superadmin.routes.js# 超级管理员路由
├── store/
│   ├── index.js            # Pinia 入口
│   └── modules/
│       ├── user.js         # 登录态 / 双 token / 角色
│       └── admin.js        # 超管端用户、管理员数据管理
├── styles/
│   └── variables.css       # 全局设计变量（唯一主题定义点，主色深蓝 #1e40af）
├── utils/
│   ├── chartTheme.js       # ECharts 统一主题与 option 工厂
│   └── format.js           # 共享工具函数（日期格式化等）
├── views/
│   ├── Login.vue           # 登录页（双 Tab：管理员 / 超级管理员）
│   ├── NotFound.vue        # 404 页面
│   ├── admin/              # 管理员页面
│   │   ├── Dashboard.vue   # 布局壳（复用 AdminLayout）
│   │   ├── Home.vue        # 数据概览 + ECharts 统计图表 + 一键匹配
│   │   ├── UserManagement.vue
│   │   ├── Announcements.vue
│   │   ├── CarouselImages.vue
│   │   ├── ItemsManagement.vue  # 失物/拾物共用页面（路由 meta.type 区分）
│   │   └── Feedback.vue
│   └── superadmin/         # 超级管理员页面
│       ├── Dashboard.vue   # 布局壳
│       ├── Home.vue        # 用户 / 管理员数量统计
│       ├── UserManagement.vue
│       └── AdminManagement.vue
├── App.vue
├── main.js                 # 应用入口（注册 Element Plus、图标、Pinia、路由）
└── style.css
```

## 🔐 路由与权限

- `/` 重定向到 `/login`；未匹配路径显示 404 页面。
- 全局导航守卫（`src/router/index.js`）：
  - `meta.requiresAuth` 为 true 的页面要求已登录，否则跳转 `/login`；
  - `meta.role` 校验角色（`admin` / `superadmin`），无权限时提示并跳回对应角色的控制面板；
  - 登录态下解析 access token 的 JWT payload 交叉校验角色（白名单 `super_admin` / `admin`），localStorage 中的 role 被污染或与令牌不一致时统一登出并回登录页。

## 🤝 贡献

欢迎提交 Issue 与 Pull Request！贡献流程与规范请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)。安全漏洞请勿公开提交，参见 [SECURITY.md](SECURITY.md)。

## 📄 License

[MIT](LICENSE) © 2026-Present Arimayuki03
