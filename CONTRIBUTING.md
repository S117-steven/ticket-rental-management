# 贡献指南

感谢您对本项目的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告问题

1. 使用 GitHub Issues 报告 Bug
2. 提供清晰的问题描述和复现步骤
3. 包含截图或错误日志（如有）

### 提交代码

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat(scope): 描述'`
4. 推送分支：`git push origin feature/your-feature`
5. 创建 Pull Request

### 代码规范

#### JavaScript

- 使用 ES6+ 语法
- 使用 `const` 和 `let`，避免 `var`
- 函数命名使用 camelCase
- 常量命名使用 UPPER_SNAKE_CASE
- 添加必要的注释

```javascript
// ✅ Good
const MAX_USERS = 5;
const calculateTotal = (price, quantity) => price * quantity;

// ❌ Bad
var maxUsers = 5;
function CalculateTotal(price, quantity) { return price * quantity; }
```

#### WXML

- 使用语义化标签
- 属性值使用双引号
- 保持合理的缩进

```xml
<!-- ✅ Good -->
<view class="container">
  <text class="title">{{title}}</text>
</view>

<!-- ❌ Bad -->
<view class='container'>
<text class='title'>{{title}}</text>
</view>
```

#### WXSS

- 使用工具类优先
- 自定义类使用 kebab-case
- 避免使用 `!important`

```css
/* ✅ Good */
.order-card {
  padding: 16rpx;
  border-radius: 8rpx;
}

/* ❌ Bad */
.OrderCard {
  padding: 16rpx !important;
}
```

### 提交信息规范

使用 Conventional Commits 格式：

```
<type>(<scope>): <subject>

[可选的正文]

[可选的脚注]
```

#### 类型（Type）

- `feat` - 新功能
- `fix` - 修复 Bug
- `docs` - 文档更新
- `style` - 代码格式（不影响功能）
- `refactor` - 重构
- `perf` - 性能优化
- `test` - 测试相关
- `chore` - 构建/工具相关

#### 范围（Scope）

- `dashboard` - 首页
- `calendar` - 排期
- `settings` - 设置
- `onboarding` - 引导页
- `order-modal` - 订单弹窗
- `i18n` - 国际化
- `utils` - 工具函数

#### 示例

```
feat(dashboard): 添加月度收入统计图表
fix(calendar): 修复周末日期高亮显示问题
docs(readme): 更新快速开始指南
refactor(utils): 优化价格计算逻辑
```

### Pull Request 规范

#### PR 标题

使用与提交信息相同的格式：

```
feat(dashboard): 添加月度收入统计图表
```

#### PR 描述

包含以下内容：

1. **变更说明** - 简要描述本次变更
2. **变更类型** - 新功能/修复/重构等
3. **测试情况** - 如何测试的
4. **截图** - 如有 UI 变更
5. **关联 Issue** - 如有相关 Issue

#### 示例

```markdown
## 变更说明

添加月度收入统计图表到首页仪表盘。

## 变更类型

- [x] 新功能
- [ ] Bug 修复
- [ ] 重构
- [ ] 文档更新

## 测试情况

- [x] 本地测试通过
- [x] 微信开发者工具预览正常
- [ ] 真机测试

## 截图

（添加截图）

## 关联 Issue

Closes #123
```

### 分支策略

```
main (生产)
  ↑
  └── develop (开发主线)
        ↑
        ├── feature/xxx (功能分支)
        ├── bugfix/xxx (修复分支)
        └── release/x.x.x (发布分支)
```

#### 分支命名

- `feature/功能名称` - 新功能
- `bugfix/问题描述` - Bug 修复
- `release/版本号` - 发布分支
- `hotfix/问题描述` - 紧急修复

### 代码审查

所有 PR 都需要经过代码审查：

1. 至少一位维护者审查
2. 所有 CI 检查通过
3. 没有合并冲突
4. 符合代码规范

### 版本发布

遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- `MAJOR.MINOR.PATCH`
- `1.0.0` - 正式发布
- `1.1.0` - 新功能
- `1.0.1` - Bug 修复

## 行为准则

- 尊重每一位贡献者
- 接受建设性批评
- 专注于对社区最有利的事情
- 对他人表示同理心

## 联系方式

如有任何问题，请通过以下方式联系我们：

- GitHub Issues
- 邮箱：1458710681@qq.com
