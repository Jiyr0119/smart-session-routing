# Conversation Routing Scenarios

Real-world conversation examples demonstrating when session routing should trigger. Use these as calibration references when implementing or tuning routing logic.

---

## ✅ CONTINUE — Stay in Current Session

### Scenario 1: Natural Topic Deepening

```
[Session Topic: Python web development]

User: FastAPI 的依赖注入怎么用？
AI:   (explains dependency injection)
User: 那如果我想在依赖里做数据库事务管理呢？     ← CONTINUE
```
**Why**: Deepening the same topic. High semantic relevance.

### Scenario 2: Follow-up Question

```
[Session Topic: Trip planning to Japan]

User: 东京有什么好玩的地方？
AI:   (lists attractions)
User: 浅草寺附近有什么推荐的餐厅？               ← CONTINUE
```
**Why**: Related sub-topic within the same conversation domain.

### Scenario 3: Clarification or Correction

```
[Session Topic: Writing a cover letter]

User: 帮我写一封求职信
AI:   (writes cover letter)
User: 不对，我应聘的是产品经理，不是工程师         ← CONTINUE
```
**Why**: Correcting context within the same task. Not a new topic.

### Scenario 4: Returning After Short Break

```
[Session Topic: Debugging API issue]
[Last message: 45 minutes ago]

User: 刚才说的那个 CORS 问题，我试了你的方法还是不行  ← CONTINUE
```
**Why**: Short time gap + explicit reference to previous context.

---

## 🆕 NEW SESSION — Should Start Fresh

### Scenario 5: Complete Topic Switch

```
[Session Topic: Database schema design]

User: 帮我设计一个用户表的结构
AI:   (designs schema)
User: 帮我写一首关于春天的诗                     ← NEW SESSION
```
**Why**: "Poetry" has zero semantic relevance to "database schema". Clear topic boundary.

### Scenario 6: Explicit Intent

```
[Session Topic: Any]

User: 换个话题，我想聊聊最近的电影               ← NEW SESSION
User: 新对话                                    ← NEW SESSION
User: 我有一个新的问题                           ← NEW SESSION
User: Let's start fresh                         ← NEW SESSION
```
**Why**: Explicit keywords detected. This overrides all other signals.

### Scenario 7: Long Time Gap + New Topic

```
[Session Topic: Company quarterly report]
[Last message: 3 days ago]

User: 帮我查一下明天北京的天气                    ← NEW SESSION
```
**Why**: Long time gap (>24h) + completely unrelated topic. Double signal.

### Scenario 8: Context Window Exhaustion

```
[Session: 80+ messages about system architecture]
[Token usage: ~90% of model context]

User: 接下来聊聊测试策略                         ← NEW SESSION (with summary carry-over)
```
**Why**: Context window near limit. Even if the topic is related, a new session with a summary carry-over prevents context truncation issues.

---

## ❓ PROMPT USER — Ask Before Deciding

### Scenario 9: Ambiguous Topic Shift

```
[Session Topic: Learning React]

User: JavaScript 的事件循环是怎么工作的？          ← PROMPT USER
```
**Why**: Related (JS ecosystem) but distinct topic. Could go either way. Let the user decide.

### Scenario 10: Medium Time Gap

```
[Session Topic: Planning a birthday party]
[Last message: 8 hours ago]

User: 蛋糕应该订什么口味的？                      ← PROMPT USER
```
**Why**: Medium time gap (4-24h). Topic is related but user may have mentally moved on. Worth confirming.

### Scenario 11: Multi-Domain User

```
[Session Topic: Marketing strategy]

User: 对了，上次说的那个数据分析的事情怎么样了？     ← PROMPT USER
```
**Why**: References a different conversation. The user might intend to switch sessions, or might want to briefly discuss it here. Ask.

### Scenario 12: Conversational Tone Shift

```
[Session Topic: Technical debugging, formal tone]

User: 哈哈今天好累啊，你觉得猫和狗哪个更可爱？       ← PROMPT USER
```
**Why**: Casual/personal message in a technical session. Likely a break, but could indicate desire to switch. Worth a gentle prompt.

---

## 🔀 FORK — Create Linked Sub-Session

### Scenario 13: Temporary Tangent

```
[Session Topic: Building an e-commerce site]

User: 等一下，我需要先搞懂 OAuth2 的流程，搞完再回来继续  ← FORK
```
**Why**: User explicitly plans to return. A forked session preserves the parent context for later resumption.

### Scenario 14: Parallel Subtask

```
[Session Topic: Writing a research paper]

User: 帮我单独整理一下参考文献的格式要求             ← FORK
```
**Why**: Subtask of the main topic. Will need to merge back or reference later.

---

## Edge Cases

### False Positive: Language Switch ≠ Topic Switch

```
[Session Topic: Travel planning, in Chinese]

User: Can you also check flights from Shanghai to Tokyo?  ← CONTINUE (NOT new session)
```
**Why**: Switching language is NOT switching topic. Use language-agnostic semantic analysis.

### False Positive: Emotional Expression ≠ Topic Switch

```
[Session Topic: Exam preparation]

User: 我好烦啊，感觉学不完了                      ← CONTINUE
```
**Why**: Emotional expression about the current task. Stay in session, respond empathetically.

### False Negative: Same Domain, Different Task

```
[Session Topic: Bug #1234 - Login page crash]

User: 另一个 bug，注册页面也崩了                   ← Depends on context
```
**Why**: Same technical domain but different issue. If the system tracks issues separately, consider NEW SESSION. If it's a general debugging session, CONTINUE.
