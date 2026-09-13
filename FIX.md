# 修复报告：`src/api/admin.js` 引用缺失的 mock 模块导致构建失败

> 修复日期：2026-09-13
> 影响文件：`src/api/admin.js`
> 问题等级：**阻断级**（无法完成生产构建）

## 一、问题描述

`src/api/admin.js` 文件头部从 `./mock` 模块导入 8 个模拟数据对象，但项目中并不存在 `src/api/mock.js` 文件，导致 Vite/Rollup 在解析模块依赖时直接报错，`npm run build` 与 `npm run dev` 均无法正常工作。

### 修复前的问题代码

```js
import request from './index';
import {
  mockLostItems, mockFoundItems, mockAnnouncements,
  mockCarouselImages, mockFeedbacks, mockStats,
  mockLostItemsStats, mockFoundItemsStats
} from './mock';   // ← 该文件不存在

// 开发模式开关
const USE_MOCK = false; // 设置为 true 使用模拟数据，false 使用实际 API
```

## 二、问题定位

1. 执行 `npm run build` 复现报错：

```
error during build:
Could not resolve "./mock" from "src/api/admin.js"
file: D:/Code/lost_and_found/lost_and_found_admin/src/api/admin.js
```

2. 全局检索 `./mock` / `api/mock` 引用，确认**仅 `admin.js` 一处**引用了该模块；
3. 检查 `src/api/` 目录，实际只存在 `index.js`、`auth.js`、`admin.js`、`superadmin.js` 四个文件，`mock.js` 缺失。

## 三、根因分析

`admin.js` 曾支持「开发模式开关」：当 `USE_MOCK = true` 时返回本地模拟数据（mock 数据应存放于 `mock.js`），为 `false` 时请求真实后端接口。目前：

- 开关已被固定为 `USE_MOCK = false`，所有 mock 分支均为**永远不会执行的死代码**；
- `mock.js` 文件被删除（或从未提交），但 `import` 语句被遗漏未同步清理。

由于 ES Module 的 `import` 语句是**构建时静态解析**的，无论运行时是否使用，只要目标文件不存在，构建必然失败。

## 四、修复方案对比

| 方案 | 说明 | 结论 |
|------|------|------|
| A. 补回 `mock.js` | 需凭空编造 8 组模拟数据，且 mock 分支覆盖不全（如 `getAnnouncements`、`updateAnnouncement` 等本就没有 mock 逻辑），功能本就不完整 | ❌ 不采纳 |
| B. 删除 mock 死代码 | 移除 `import` 语句、`USE_MOCK` 开关及所有 mock 分支，统一走真实 API | ✅ **采纳** |

选择方案 B 的理由：`USE_MOCK` 已固定为 `false`，mock 路径属于无效遗留代码；mock 分支仅覆盖 6 个函数，保留「半残」的 mock 能力没有意义；删除后代码语义更清晰——该文件只负责对接真实后端。

## 五、修复内容明细

对 `src/api/admin.js` 共清理 7 处：

1. **删除** `import { ... } from './mock'` 语句及 `USE_MOCK` 常量定义；
2. `getStats()` —— 删除 `if (USE_MOCK) return Promise.resolve(mockStats);`；
3. `getLostItemsStats()` —— 删除 `if (USE_MOCK) return Promise.resolve(mockLostItemsStats);`；
4. `getFoundItemsStats()` —— 删除 `if (USE_MOCK) return Promise.resolve(mockFoundItemsStats);`；
5. `runMatching()` —— 删除 mock 成功响应分支；
6. `addAnnouncement()` —— 删除向 mock 数组追加记录的分支；
7. `getLostItems()` —— 删除返回 mock 列表的分支。

所有函数的对外签名与导出（共 32 个）保持不变，调用方（视图组件、Pinia store）**无需任何改动**。

## 六、修复验证

| 验证项 | 结果 |
|--------|------|
| 修复前 `npm run build` | ❌ `Could not resolve "./mock" from "src/api/admin.js"` |
| 修复后 `npm run build` | ✅ `✓ built in 5.47s`，正常产出 `dist/` |
| `admin.js` 导出函数数量 | 32 个，与修复前一致，无 API 变更 |
| 全局 mock 残留检索 | 无任何 `mock` / `USE_MOCK` 引用 |

> 注：构建时的「Some chunks are larger than 500 kB」警告源于 ECharts 与 Element Plus 体积较大，属性能优化建议，非错误，与本次修复无关。

## 七、遗留事项与建议（未在本次修复范围内）

1. **大包体积**：`Home.vue`（ECharts）与主包（Element Plus）均超过 500 kB，建议后续通过 `manualChunks` 拆包或按需引入优化；
2. **错误静默降级**：`src/api/index.js` 响应拦截器对失败的 GET 请求返回空数组 `[]`，组件无法区分「无数据」与「请求失败」，建议后续改为拒绝 Promise 并在组件层捕获处理；
3. **token 持久化**：登录态存于 `localStorage`，存在 XSS 窃取风险，如有安全要求可评估迁移至 HttpOnly Cookie 方案（需后端配合）。
