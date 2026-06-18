# 🎫 Ticket Rental Management

一个用于管理票据租赁的微信小程序。

## 功能特性

- 📊 首页仪表盘 - 查看订单统计和收入概览
- 📅 排期日历 - 管理租赁排期
- ⚙️ 设置管理 - 配置价格矩阵和用户信息
- 🌍 多语言支持 - 中文、英文、瑞典语

## 技术栈

- 微信小程序原生框架
- ES6+
- WXSS (类 Tailwind 工具类)

## 项目结构

```
miniprogram/
├── app.js              # 应用入口
├── app.json            # 应用配置
├── app.wxss            # 全局样式
├── components/         # 组件
│   └── order-modal/    # 订单弹窗
├── images/             # 图片资源
├── pages/              # 页面
│   ├── dashboard/      # 首页
│   ├── calendar/       # 排期
│   ├── settings/       # 设置
│   └── onboarding/     # 引导页
├── utils/              # 工具函数
│   ├── i18n.js         # 国际化
│   └── util.js         # 业务逻辑
└── project.config.json # 项目配置
```

## 快速开始

### 环境要求

- 微信开发者工具
- 微信小程序 AppID

### 安装步骤

1. 克隆项目
   ```bash
   git clone https://github.com/S117-steven/ticket-rental-management.git
   ```

2. 打开微信开发者工具

3. 导入项目目录 `miniprogram/`

4. 配置 AppID（在 `project.config.json` 中修改）

5. 编译运行

## 开发指南

### 分支策略

- `main` - 生产环境代码
- `develop` - 开发主线
- `feature/*` - 功能分支
- `bugfix/*` - 修复分支
- `release/*` - 发布分支

### 提交规范

```
<type>(<scope>): <subject>

feat(dashboard): 添加收入统计图表
fix(calendar): 修复日期选择器显示问题
docs(readme): 更新项目说明
```

### 代码规范

- 使用 ES6+ 语法
- 遵循微信小程序开发规范
- 组件使用 PascalCase 命名
- 工具函数使用 camelCase 命名

## 贡献指南

请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

## 更新日志

请阅读 [CHANGELOG.md](CHANGELOG.md) 了解版本更新记录。

## 开源协议

本项目采用 MIT 协议 - 请阅读 [LICENSE](LICENSE) 了解详情。

## 联系方式

- 邮箱：1458710681@qq.com
- GitHub：[S117-steven](https://github.com/S117-steven)
