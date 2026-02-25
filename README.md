# 🧠 Smart Session Routing

**[中文文档](./README_zh.md)**

> An intelligent session routing skill for AI chat applications — helps AI agents decide whether a user's message should continue the current conversation or start a new one.

## ✨ Features

- 🎯 **5 Decision Signals** — Semantic relevance, explicit intent, context window, time gap, conversation health
- 🔄 **3 Implementation Approaches** — AI self-judgment (prompt-based), backend middleware, frontend heuristics
- 🌐 **Bilingual Support** — Chinese & English intent detection out of the box
- 📊 **Complete Decision Matrix** — Combined signal evaluation with edge case handling
- 🧩 **Framework Agnostic** — Works with any AI model, any frontend framework, any backend stack

## 📦 Installation

### Option 1: Direct Copy

```bash
git clone https://github.com/YOUR_USERNAME/smart-session-routing.git
cp -r smart-session-routing /path/to/your-project/.agent/skills/
```

### Option 2: Git Submodule (Recommended)

```bash
cd /path/to/your-project
git submodule add https://github.com/YOUR_USERNAME/smart-session-routing.git .agent/skills/smart-session-routing
```

Update to latest version:

```bash
git submodule update --remote .agent/skills/smart-session-routing
```

## 📂 Structure

```
smart-session-routing/
├── SKILL.md                           # Core guide (~750 words, always loaded)
├── references/
│   ├── decision-framework.md          # Detailed scoring model & thresholds
│   └── implementation-patterns.md     # Backend service & frontend integration
└── examples/
    ├── session-router-prompt.md       # Prompt template for AI self-judgment
    └── frontend-integration.js        # Vue 3 / vanilla JS integration
```

## 🚀 Quick Start

### How It Works

When a user sends a message, the router evaluates 5 signals:

```
Incoming Message
    │
    ├─ Explicit new-session intent?  ──YES──→ 🆕 NEW SESSION
    │
    ├─ Context window >80% full?     ──YES──→ 🆕 NEW SESSION (with summary)
    │
    ├─ Semantic similarity < 0.3?    ──YES──→ ❓ PROMPT USER
    │
    ├─ Time gap > threshold?         ──YES──→ ❓ PROMPT USER
    │
    └─ None of the above             ──────→ ✅ CONTINUE
```

### Approach 1: AI Self-Judgment (Fastest to Integrate)

Add the prompt template from `examples/session-router-prompt.md` to your system prompt. The AI will output a routing decision as a JSON comment before each response:

```
<!--session_route: {"decision": "continue", "confidence": 0.9}-->
```

### Approach 2: Backend Service

Implement a `SessionRouter` service that intercepts messages before they reach the AI model. See `references/implementation-patterns.md` for a complete Python/FastAPI example.

### Approach 3: Frontend Heuristics

Use `examples/frontend-integration.js` for lightweight client-side checks (intent keywords, time gaps) before sending messages.

## ⚙️ Configuration

Key thresholds to tune for your use case:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `semantic_threshold` | 0.3 | Below this → topic shift detected |
| `context_critical_pct` | 0.8 | Above this → force new session |
| `time_gap_prompt_hours` | 4 | Prompt user after this gap |
| `time_gap_new_session_hours` | 24 | Suggest new session after this gap |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

[MIT](./LICENSE)
