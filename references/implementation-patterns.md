# Implementation Patterns for Smart Session Routing

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Chat UI  │→ │  Store   │→ │ Session Router│  │
│  │          │  │ (Pinia)  │  │  (pre-send)   │  │
│  └──────────┘  └──────────┘  └──────┬────────┘  │
│                                      │           │
└──────────────────────────────────────┼───────────┘
                                       │
                              ┌────────▼────────┐
                              │   Backend API    │
                              │  /chat/route     │
                              │  /chat/send      │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │  Session Router  │
                              │    Service       │
                              │  ┌────────────┐  │
                              │  │ Semantic    │  │
                              │  │ Analyzer    │  │
                              │  ├────────────┤  │
                              │  │ Intent      │  │
                              │  │ Detector    │  │
                              │  ├────────────┤  │
                              │  │ Context     │  │
                              │  │ Monitor     │  │
                              │  └────────────┘  │
                              └─────────────────┘
```

## Backend Implementation

### Session Router Service (Python / FastAPI)

```python
# session_router.py
# 会话路由服务 Session routing service

from enum import Enum
from dataclasses import dataclass

class RouteDecision(Enum):
    """路由决策枚举 Route decision enum"""
    CONTINUE = "continue"
    NEW_SESSION = "new_session"
    PROMPT_USER = "prompt_user"
    FORK = "fork"

@dataclass
class RouteResult:
    """路由结果 Route result"""
    decision: RouteDecision
    confidence: float            # 置信度 Confidence score (0-1)
    reason: str                  # 决策原因 Decision reason
    summary_carry_over: str = "" # 摘要延续 Summary to carry over

class SessionRouter:
    """
    会话路由器 Session router
    分析消息并决定路由策略 Analyze message and decide routing strategy
    """

    def __init__(self, config: dict = None):
        self.config = config or self._default_config()

    def _default_config(self):
        return {
            "semantic_threshold": 0.3,
            "context_warning_pct": 0.6,
            "context_critical_pct": 0.8,
            "time_gap_prompt_hours": 4,
            "time_gap_new_session_hours": 24,
            "intent_keywords_zh": [
                "新对话", "新会话", "换个话题", "重新开始",
                "新的问题", "不说这个了", "换一个", "另一个话题"
            ],
            "intent_keywords_en": [
                "new chat", "new conversation", "new topic",
                "start over", "different subject", "switch topic"
            ]
        }

    async def route(self, message: str, conversation) -> RouteResult:
        """
        主路由方法 Main routing method
        按优先级检查各信号 Check signals by priority
        """
        # 1. 显式意图检测 (最高优先级) Explicit intent detection (highest priority)
        intent = self._detect_intent(message)
        if intent:
            return RouteResult(
                decision=RouteDecision.NEW_SESSION,
                confidence=0.95,
                reason=f"Explicit intent detected: {intent}"
            )

        # 2. 上下文窗口检查 Context window check
        ctx_util = self._check_context_utilization(conversation)
        if ctx_util > self.config["context_critical_pct"]:
            summary = await self._generate_summary(conversation)
            return RouteResult(
                decision=RouteDecision.NEW_SESSION,
                confidence=0.85,
                reason="Context window critical",
                summary_carry_over=summary
            )

        # 3. 语义相关性检查 Semantic relevance check
        similarity = await self._compute_similarity(message, conversation)
        if similarity < self.config["semantic_threshold"]:
            return RouteResult(
                decision=RouteDecision.PROMPT_USER,
                confidence=0.7,
                reason=f"Low semantic similarity: {similarity:.2f}"
            )

        # 4. 时间间隔检查 Time gap check
        gap_hours = self._compute_time_gap(conversation)
        if gap_hours > self.config["time_gap_new_session_hours"]:
            return RouteResult(
                decision=RouteDecision.PROMPT_USER,
                confidence=0.6,
                reason=f"Long time gap: {gap_hours:.1f}h"
            )

        # 5. 默认继续 Default to continue
        return RouteResult(
            decision=RouteDecision.CONTINUE,
            confidence=0.9,
            reason="All signals normal"
        )

    def _detect_intent(self, message: str) -> str | None:
        """检测显式意图 Detect explicit new-session intent"""
        text = message.lower().strip()
        all_keywords = (
            self.config["intent_keywords_zh"] +
            self.config["intent_keywords_en"]
        )
        for kw in all_keywords:
            if kw in text:
                return kw
        return None

    def _check_context_utilization(self, conversation) -> float:
        """计算上下文使用率 Calculate context utilization"""
        # 实际实现需要 token 计数 Actual impl needs token counting
        total_tokens = sum(
            len(m.get("content", "")) * 0.75  # 粗略估算 Rough estimate
            for m in conversation.get("messages", [])
        )
        max_tokens = conversation.get("model_max_tokens", 128000)
        return total_tokens / max_tokens

    async def _compute_similarity(self, message, conversation) -> float:
        """计算语义相似度 Compute semantic similarity"""
        # 实际实现使用 embedding 模型 Actual impl uses embedding model
        # 此处为占位 Placeholder
        return 0.5

    def _compute_time_gap(self, conversation) -> float:
        """计算时间间隔(小时) Compute time gap in hours"""
        messages = conversation.get("messages", [])
        if not messages:
            return 0
        from datetime import datetime, timezone
        last_time = messages[-1].get("created_at")
        if not last_time:
            return 0
        now = datetime.now(timezone.utc)
        delta = now - last_time
        return delta.total_seconds() / 3600

    async def _generate_summary(self, conversation) -> str:
        """生成会话摘要用于新会话延续 Generate summary for carry-over"""
        # 实际实现调用 LLM 生成摘要 Actual impl calls LLM
        return "Previous conversation summary..."
```

### API Endpoint Design

```python
# 路由判断端点 Route decision endpoint

@router.post("/chat/route")
async def route_message(request: RouteRequest):
    """
    在发送消息前调用，获取路由建议
    Call before sending message, get routing suggestion
    """
    router = SessionRouter()
    result = await router.route(
        message=request.message,
        conversation=await get_conversation(request.conversation_id)
    )
    return {
        "decision": result.decision.value,
        "confidence": result.confidence,
        "reason": result.reason,
        "summary": result.summary_carry_over
    }
```

---

## Frontend Implementation

### Store Integration (Vue 3 + Pinia)

```javascript
// composables/useSessionRouter.js
// 会话路由组合函数 Session routing composable

import { ref } from 'vue'

/**
 * 会话路由组合函数 Session routing composable
 * 在发送消息前判断是否需要新会话 Determine if new session needed before send
 */
export function useSessionRouter(chatStore) {
  const routeDecision = ref(null)
  const checking = ref(false)

  // 显式意图关键词 Explicit intent keywords
  const INTENT_KEYWORDS = {
    zh: ['新对话', '新会话', '换个话题', '重新开始', '新的问题'],
    en: ['new chat', 'new conversation', 'new topic', 'start over']
  }

  // 时间间隔阈值(毫秒) Time gap thresholds in ms
  const TIME_GAP = {
    PROMPT: 4 * 60 * 60 * 1000,    // 4小时 4 hours
    NEW_SESSION: 24 * 60 * 60 * 1000 // 24小时 24 hours
  }

  /**
   * 快速本地检查 Quick local checks (no API call)
   */
  function quickCheck(message) {
    // 1. 显式意图 Explicit intent
    const text = message.toLowerCase()
    const allKeywords = [...INTENT_KEYWORDS.zh, ...INTENT_KEYWORDS.en]
    const matchedIntent = allKeywords.find(kw => text.includes(kw))
    if (matchedIntent) {
      return { decision: 'new_session', reason: `Intent: "${matchedIntent}"` }
    }

    // 2. 时间间隔 Time gap
    const messages = chatStore.messages
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      const gap = Date.now() - new Date(lastMsg.timestamp).getTime()
      if (gap > TIME_GAP.NEW_SESSION) {
        return { decision: 'prompt_user', reason: 'Long time gap (>24h)' }
      }
      if (gap > TIME_GAP.PROMPT) {
        return { decision: 'prompt_user', reason: 'Medium time gap (>4h)' }
      }
    }

    return null // 需要服务端判断 Need server-side check
  }

  /**
   * 完整路由检查(含 API 调用) Full routing check with API
   */
  async function fullCheck(message, conversationId) {
    checking.value = true
    try {
      // 先做本地快速检查 Local quick check first
      const localResult = quickCheck(message)
      if (localResult) {
        routeDecision.value = localResult
        return localResult
      }

      // 调用后端路由 API Call backend routing API
      const response = await fetch('/api/chat/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversation_id: conversationId })
      })
      const result = await response.json()
      routeDecision.value = result
      return result
    } finally {
      checking.value = false
    }
  }

  return {
    routeDecision,
    checking,
    quickCheck,
    fullCheck
  }
}
```

### Message Send Flow Integration

```javascript
// 在 send 方法中集成路由判断 Integrate routing in send method

async function sendWithRouting({ text, attachments, spaceId }) {
  const router = useSessionRouter(chatStore)

  // 执行路由检查 Perform route check
  const result = await router.fullCheck(text, chatStore.sessionId)

  switch (result.decision) {
    case 'continue':
      // 正常发送 Send normally
      await chatStore.send({ text, attachments, spaceId })
      break

    case 'new_session':
      // 自动创建新会话 Auto-create new session
      chatStore.reset()
      await chatStore.send({ text, attachments, spaceId })
      break

    case 'prompt_user':
      // 弹窗询问用户 Show modal to ask user
      const userChoice = await showRouteConfirmModal({
        reason: result.reason,
        options: ['continue', 'new_session']
      })
      if (userChoice === 'new_session') {
        chatStore.reset()
      }
      await chatStore.send({ text, attachments, spaceId })
      break
  }
}
```

---

## Prompt Engineering Approach

For teams that prefer embedding routing logic into the AI model's system prompt rather than building a separate service, the key principle is:

**Inject a routing analysis step at the beginning of every response generation.**

The AI model receives:
1. Current conversation history
2. The new user message
3. A system instruction to first analyze routing before responding

This approach trades latency for simplicity — no extra infrastructure needed, but adds ~100-200 tokens of overhead per response.

See `examples/session-router-prompt.md` for a production-ready prompt template.

---

## Monitoring and Tuning

### Key Metrics to Track

| Metric | Description | Target |
|--------|-------------|--------|
| Auto-route accuracy | % of auto-routing decisions users don't override | > 90% |
| False positive rate | New sessions created unnecessarily | < 5% |
| False negative rate | Continued sessions that should have been new | < 10% |
| Prompt rate | % of messages requiring user confirmation | < 15% |
| Avg routing latency | Time added by routing check | < 200ms |

### Tuning Approach

1. Start with conservative thresholds (favor CONTINUE over NEW SESSION)
2. Log all routing decisions with user overrides
3. Weekly review: adjust thresholds based on override patterns
4. A/B test threshold changes on a subset of users
