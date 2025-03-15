# 卡密系统

基于React前端和Cloudflare后端的卡密管理系统，用于生成、分发、验证和管理卡密。

## 功能特点

- **卡密生成**：自动生成唯一的卡号和密码组合
- **卡密分发**：支持多种渠道分发卡密
- **卡密验证**：验证卡密的有效性
- **卡密管理**：提供卡密的查询、修改、删除等管理功能
- **统计报表**：生成卡密使用情况的统计报表

## 技术栈

- **前端**：React、React Router、Ant Design
- **后端**：Cloudflare Workers
- **数据库**：Cloudflare KV、D1 SQLite

## 项目结构

```
卡密/
├── frontend/           # React前端应用
└── backend/            # Cloudflare Workers后端
    ├── functions/      # Cloudflare Functions
    └── database/       # 数据库模型和迁移
```

## 安装与设置

### 前端

```bash
cd frontend
npm install
npm run dev
```

### 后端

```bash
cd backend
npm install
npm run dev
```

## 开发计划

1. 设计数据库结构
2. 实现卡密生成功能
3. 实现卡密验证功能
4. 开发管理员后台界面
5. 开发用户操作界面
6. 实现安全机制
7. 测试与部署