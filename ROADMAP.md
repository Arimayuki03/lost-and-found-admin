# 后续工作路线图（ROADMAP.md）

> 制定日期：2026-09-14
> 依据：REVIEW.md 审查修复完成后的系统现状
> 状态标记：⬜ 未开始 ／ 🔄 进行中 ／ ✅ 已完成

## 一、当前系统状态一览

| 子项目 | 审查 | 修复 | 运行时验证 | 版本控制 |
|--------|------|------|-----------|----------|
| `lost_and_found_admin`（管理端前端） | ✅ 完成 | ✅ 完成（17 项 + 422 自愈） | ✅ 浏览器冒烟测试通过 | ✅ git 仓库已建（3 commits） |
| `lost_and_found`（Flask 后端） | ⬜ 仅点状检查 | ✅ 上传鉴权 + N+1 已修 | ✅ 上传接口回归通过 | ⚠️ 改动在工作区未提交 |
| `lost_and_found_user`（用户端前端） | ⬜ 未审查 | — | — | ⬜ 未建仓 |

## 二、优先级 1：用户端前端审查（lost_and_found_user）⬜

**理由**：三个子项目中唯一未审查的部分，且直接面向全校学生、暴露面最大。与管理端同期开发，大概率存在同类问题模式（页面复制粘贴、请求失败静默处理、绕过 API 封装层、token 处理不当）。

**范围**：
- `pages/` 全部页面（publish、editLostItem、editFoundItem、register、my 等）
- `api/`、`store/`、`utils/` 封装层
- uni.uploadFile 等直传调用点（上传接口已加鉴权，需确认全部调用都带 token）

**方法与产出**：全量通读 + 对照后端验证契约 + 修复 + 构建验证 + 冒烟测试，交付同规格审查报告（建议命名 `REVIEW-USER.md`）。

## 三、优先级 2：后端系统性安全审查 ⬜

已完成点状修复：`/common/images/upload` 鉴权、管理员用户列表 N+1（详见 REVIEW.md 7.2）。

**待查清单**（首轮审查中已注意到的线索）：
1. **sort_by 排序白名单不足**：`hasattr(User, sort_by)` 校验后直接 `order_by`，传 `password` 可按密码哈希排序，存在排序侧信道泄露风险，应改为显式字段白名单；
2. **明文密码升级路径**：`verify_user_password` 会对历史明文密码自动升级为哈希，需确认比对时序不存在绕过可能；
3. **MinIO 访问策略**：bucket 权限、图片 URL 可枚举性、固定 endpoint 拼接 URL 的访问控制未验证；
4. **鉴权矩阵复查**：逐一核对全部路由的装饰器覆盖（上传接口即前例）；
5. **限流覆盖面**：`ip_rate_limit` 已存在，检查覆盖的敏感端点（登录、注册、上传、内容检测）是否完整；
6. **生产部署形态**：socketio.run + Werkzeug 开发服务器不适合生产，建议 gunicorn + eventlet/gevent，并确认 APScheduler 单实例运行。

**说明**：若计划上线给真实用户使用，本项应优先于一切功能优化。

## 四、优先级 3：管理端遗留优化（收益递减）⬜

1. **LostItems/FoundItems 双文件合并重构**：约 880 行 ×2 复制粘贴，行为已对齐，可抽取共享组件/composable 消除约一半代码；注意筛选模式下的顶部搜索框需后端 `/sift` 支持通用 `query` 参数才能接通；
2. **ESLint + Prettier 基础配置**：防止死代码与重复实现回潮；
3. **Element Plus 按需加载**：引入 `unplugin-vue-components`，在 manualChunks 已分包的基础上再减约 1MB（当前 element-plus chunk 约 995KB）；
4. **token 迁移 HttpOnly Cookie**：缓解 localStorage XSS 窃取风险，需后端配合改造。

## 五、运维注意事项（持续有效）

- **启动后端前确认 5000 端口空闲**：2026-09-14 曾出现两个后端进程同时监听 5000 端口，请求被随机分流到新旧代码，导致鉴权修复一度被旧实例旁路。启动前用 `netstat -ano | findstr :5000` 检查；
- **后端两项修复尚在工作区**：`app/common/photo.py`（上传鉴权）与 `app/admin/admins.py`（N+1 聚合）未提交，提交时注意与进行中的其他改动合并；
- 管理端 dev server（8001）与后端（5000）当前由审查会话启动，仍在后台运行。
