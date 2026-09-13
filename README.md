# 失物招领后台管理系统（lost_and_found_admin）

校园失物招领平台的**管理后台前端**，提供管理员（admin）与超级管理员（superadmin）两种角色，支持失物/拾物审核、公告与轮播图管理、用户与管理员账户管理、数据统计可视化等功能。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3.5（Composition API + `<script setup>`） |
| 构建工具 | Vite 6 |
| UI 组件库 | Element Plus 2.4（已全局配置中文语言包） |
| 图标 | @element-plus/icons-vue（全局注册） |
| 状态管理 | Pinia |
| 路由 | Vue Router 4（History 模式） |
| HTTP 请求 | Axios（封装拦截器） |
| 图表 | ECharts 5 |
| 样式 | Sass |

## 项目组成

本项目是 `lost_and_found` 整体系统的子模块之一：

```
lost_and_found/
├── lost_and_found/        # Flask 后端（Flask 3 + SQLAlchemy + Redis + MinIO + APScheduler，默认端口 5000）
├── lost_and_found_user/   # 用户端前端
└── lost_and_found_admin/  # 管理后台前端（本项目）
```

## 快速开始

### 环境要求

- Node.js（建议 18+）
- 后端服务运行在 `http://localhost:5000`（见 `lost_and_found/` 目录）

### 安装与启动

```bash
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

### 代理配置

开发环境下，Vite 将 `/api` 开头的请求代理到后端，并**去除 `/api` 前缀**（见 `vite.config.js`）：

```
/api/admin/login  →  http://localhost:5000/admin/login
```

也可通过环境变量 `VITE_API_BASE_URL` 覆盖请求基础路径（默认 `/api`）。

## 目录结构

```
src/
├── api/                    # 接口层
│   ├── index.js            # axios 实例封装（拦截器、token 刷新）
│   ├── auth.js             # 刷新 access_token
│   ├── admin.js            # 管理员端业务接口
│   └── superadmin.js       # 超级管理员端接口
├── router/
│   ├── index.js            # 路由实例 + 全局导航守卫
│   ├── admin.routes.js     # 管理员路由
│   └── superadmin.routes.js# 超级管理员路由
├── store/
│   ├── index.js            # Pinia 入口
│   └── modules/
│       ├── user.js         # 登录态 / 双 token / 角色
│       └── admin.js        # 超管端用户、管理员数据管理
├── views/
│   ├── Login.vue           # 登录页（双 Tab：管理员 / 超级管理员）
│   ├── NotFound.vue        # 404 页面
│   ├── admin/              # 管理员页面
│   │   ├── Dashboard.vue   # 布局壳（侧边栏 + 顶栏）
│   │   ├── Home.vue        # 数据概览 + ECharts 统计图表 + 一键匹配
│   │   ├── UserManagement.vue
│   │   ├── Announcements.vue
│   │   ├── CarouselImages.vue
│   │   ├── LostItems.vue
│   │   ├── FoundItems.vue
│   │   └── Feedback.vue
│   └── superadmin/         # 超级管理员页面
│       ├── Dashboard.vue   # 布局壳
│       ├── Home.vue        # 用户 / 管理员数量统计
│       ├── UserManagement.vue
│       └── AdminManagement.vue
├── utils/
│   └── format.js           # 共享工具函数（日期格式化）
├── App.vue
├── main.js                 # 应用入口（注册 Element Plus、图标、Pinia、路由）
└── style.css
```

## 功能模块

### 登录认证

- 登录页提供两个 Tab：**管理员登录**（学号 + 密码）、**超级管理员登录**（用户名 + 密码）。
- 采用 JWT 双 token 机制：登录成功后获取 `access_token` 与 `refresh_token`，与用户 id、角色一并持久化到 `localStorage`（Pinia store `user`）。

### 管理员端（/admin-dashboard）

| 页面 | 功能 |
|------|------|
| 首页 | 数据概览卡片（未审核失物/拾物、总失物/拾物数）、匹配成功率与匹配状态统计、失物/拾物分类统计图与时间趋势图（ECharts）、一键「运行失物匹配」 |
| 用户管理 | 用户列表分页、搜索、排序、编辑、删除 |
| 公告管理 | 公告增删改查、搜索、排序 |
| 轮播图管理 | 轮播图增删改查 |
| 失物管理 | 列表分页/搜索/筛选（`sift`）、审核与取消审核、删除 |
| 拾物管理 | 同失物管理 |
| 反馈管理 | 反馈列表查看、删除 |

布局壳支持侧边栏折叠与页面全屏切换。

### 超级管理员端（/superadmin-dashboard）

| 页面 | 功能 |
|------|------|
| 首页 | 总用户数、管理员数统计 |
| 用户管理 | 用户列表、编辑、删除 |
| 管理员管理 | 管理员列表、新增管理员、用户信息更新 |

## 路由与权限

- `/` 重定向到 `/login`；未匹配路径显示 404 页面。
- 全局导航守卫（`src/router/index.js`）：
  - `meta.requiresAuth` 为 true 的页面要求已登录，否则跳转 `/login`；
  - `meta.role` 校验角色（`admin` / `superadmin`），无权限时提示并跳回对应角色的控制面板。

## 认证与请求机制

`src/api/index.js` 封装的 axios 实例（超时 10s）：

- **请求拦截器**：自动附加 `Authorization: Bearer <access_token>`。
- **响应拦截器**：
  - 收到 401 且非认证接口（登录/刷新本身）时，自动调用 `refreshToken`（`POST /common/refresh`，携带 refresh_token）换取新 access_token 并重试原请求；
  - 刷新期间的并发 401 请求进入队列，刷新完成后统一重试，刷新失败则统一拒绝并跳转登录页；
  - 刷新失败则清空登录态并跳转登录页；
  - 其他错误统一拒绝 Promise，由组件/store 层结合业务场景给出提示（登录失败会正确提示"用户名或密码错误"，不会被刷新流程干扰）。

### 主要后端接口一览

（经代理后实际请求路径，即已去除 `/api` 前缀）

| 模块 | 接口 |
|------|------|
| 认证 | `POST /admin/login`、`POST /sadmin/login`、`POST /common/refresh` |
| 统计 | `GET /admin/stats`、`GET /admin/lost-items/stats`、`GET /admin/found-items/stats` |
| 匹配 | `POST /admin/run` |
| 公告 | `GET/POST /admin/announcements`、`PUT/DELETE /admin/announcements/:id` |
| 轮播图 | `GET/POST /admin/carousel-images`、`PUT/DELETE /admin/carousel-images/:id` |
| 失物 | `GET /admin/lost-items`、`GET /admin/lost-items/unreviewed`、`GET /admin/lost-items/sift`、`PUT /admin/lost-items/:id/review`、`PUT /admin/lost-items/:id/cancel-review`、`DELETE /admin/lost-items/:id` |
| 拾物 | 同失物（`/admin/found-items/...`） |
| 反馈 | `GET /admin/feedbacks`、`DELETE /admin/feedbacks/:id` |
| 超管 | `GET/POST /sadmin/users`、`PUT/DELETE /sadmin/users/:id`、`GET /sadmin/users/stats`、`GET/POST /sadmin/admins` |

## 已知问题

- ~~`src/api/admin.js` 引用不存在的 `mock` 模块导致构建失败~~ **已于 2026-09-13 修复**（删除 mock 死代码），详见 [FIX.md](FIX.md)。
- ~~接口错误时 GET 请求会静默返回空数组 `[]`，组件层无法区分「空数据」与「请求失败」~~ **已于 2026-09-14 修复**（错误统一拒绝，由组件层提示）。
- ~~登录失败触发 token 刷新导致页面重载、`admin` 用户管理页绕过 API 层、`LostItems`/`FoundItems` 大量重复死代码等问题~~ **已于 2026-09-14 修复**，完整问题清单、修复明细与验证结果见 [REVIEW.md](REVIEW.md)。
- `LostItems.vue` 与 `FoundItems.vue` 仍为两份近似拷贝（行为已对齐），合并重构为共享组件尚未实施；筛选模式下顶部搜索框不生效（后端 `/sift` 接口不支持通用 `query` 参数，需后端配合）。
