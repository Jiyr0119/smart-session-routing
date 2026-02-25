# 🧠 智能会话路由

**[English](./README.md)**

> AI 聊天应用的智能会话路由技能——帮助 AI Agent 判断用户消息是应该继续当前对话，还是开启新会话。

## ✨ 功能特性

- 🎯 **5 类决策信号** — 语义相关性、用户显式意图、上下文窗口、时间间隔、会话健康度
- 🔄 **3 种实现方式** — AI 自判断（Prompt 注入）、后端中间件、前端启发式检查
- 🌐 **中英文双语** — 内置中英文意图关键词检测
- 📊 **完整决策矩阵** — 组合信号评估 + 边界案例处理
- 🧩 **框架无关** — 适用于任何 AI 模型、任何前端框架、任何后端技术栈

## 📦 安装

### 方式一：直接复制

```bash
git clone https://github.com/YOUR_USERNAME/smart-session-routing.git
cp -r smart-session-routing /path/to/your-project/.agent/skills/
```

### 方式二：Git Submodule（推荐，可同步更新）

```bash
cd /path/to/your-project
git submodule add https://github.com/YOUR_USERNAME/smart-session-routing.git .agent/skills/smart-session-routing
```

更新到最新版本：

```bash
git submodule update --remote .agent/skills/smart-session-routing
```

## 📂 目录结构

```
smart-session-routing/
├── SKILL.md                           # 核心指南（~750 词，始终加载）
├── references/
│   ├── decision-framework.md          # 详细评分模型和阈值
│   └── implementation-patterns.md     # 后端服务 & 前端集成架构
└── examples/
    ├── session-router-prompt.md       # AI 自判断 Prompt 模板
    └── frontend-integration.js        # Vue 3 / 原生 JS 集成示例
```

## 🚀 快速开始

### 工作原理

当用户发送消息时，路由器评估 5 个信号：

```
新消息进入
    │
    ├─ 检测到显式新会话意图?   ──是──→ 🆕 新会话
    │
    ├─ 上下文窗口 >80%?       ──是──→ 🆕 新会话（携带摘要）
    │
    ├─ 语义相似度 < 0.3?      ──是──→ ❓ 询问用户
    │
    ├─ 时间间隔 > 阈值?       ──是──→ ❓ 询问用户
    │
    └─ 以上均否               ──────→ ✅ 继续当前会话
```

### 方式一：AI 自判断（最快集成）

将 `examples/session-router-prompt.md` 中的 Prompt 模板添加到你的系统提示中。AI 会在每次回复前输出路由决策：

```
<!--session_route: {"decision": "continue", "confidence": 0.9}-->
```

### 方式二：后端服务

实现一个 `SessionRouter` 中间件，在消息到达 AI 模型前拦截并分析。完整的 Python/FastAPI 示例见 `references/implementation-patterns.md`。

### 方式三：前端启发式检查

使用 `examples/frontend-integration.js` 进行轻量级客户端检查（意图关键词、时间间隔），在发送消息前快速判断。

## ⚙️ 可配置参数

根据你的使用场景调整关键阈值：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `semantic_threshold` | 0.3 | 低于此值 → 检测到话题切换 |
| `context_critical_pct` | 0.8 | 高于此值 → 强制新会话 |
| `time_gap_prompt_hours` | 4 | 超过此间隔 → 提示用户 |
| `time_gap_new_session_hours` | 24 | 超过此间隔 → 建议新会话 |

## 🤝 贡献

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'feat: 添加某功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 发起 Pull Request

## 📄 许可证

[MIT](./LICENSE)
