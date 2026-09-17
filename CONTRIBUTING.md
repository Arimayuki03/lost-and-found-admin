# 贡献指南（Contributing）

感谢你关注「失物招领管理后台」项目！欢迎通过 Issue 与 Pull Request 参与贡献。

## 提交 Issue

- 提交 Bug 前请先搜索现有 Issue，避免重复。
- Bug 反馈请附上：复现步骤、期望行为、实际行为、浏览器与操作系统信息、控制台报错截图或日志。
- 功能建议请说明使用场景与预期效果。

## 开发流程

1. Fork 本仓库并克隆到本地。
2. 从 `master` 拉出功能分支，分支命名建议：
   - 功能：`feature/xxx`
   - 修复：`fix/xxx`
3. 本地启动：

   ```bash
   npm install
   npm run dev   # 端口 8001，需本地 5000 端口运行 lost_and_found 后端
   ```

4. 开发完成后确保 `npm run build` 通过，无控制台报错。
5. 提交 Pull Request，描述清楚改动内容与动机。

## 提交信息规范

采用 Conventional Commits 风格，示例：

```
feat: 新增公告批量删除
fix: 修复筛选模式下分页失效
docs: 补充 README 接口说明
chore: 升级 vite 至 6.x
```

## 代码约定

- 组件使用 Vue 3 `<script setup>` 组合式 API。
- 不要在业务代码中硬编码色值，统一引用 `src/styles/variables.css` 的设计变量。
- ECharts 图表统一通过 `LfChart` 组件 + `utils/chartTheme.js` 工厂使用。
- 接口调用统一走 `src/api/` 封装，不要绕过 axios 实例直接发请求。

## 其他

- 提交 PR 前请确认不引入任何密钥、token、真实服务器地址等敏感信息。
- 重大改动（新依赖、架构调整）建议先开 Issue 讨论。
