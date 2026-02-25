# Session Router Prompt Template

## System Prompt (Inject Before Main Prompt)

Use this template as a system-level instruction to enable AI-self-judgment session routing.

---

### Chinese Version (中文版)

```
## 会话路由分析

在回复用户消息之前，先执行以下路由分析：

分析步骤：
1. 提取当前对话的主题关键词
2. 判断新消息与当前主题的相关性（高/中/低）
3. 检查是否有显式切换意图（如："新对话"、"换个话题"、"新的问题"）
4. 综合判断路由决策

输出格式（在回复开头以 JSON 注释形式输出）：
<!--session_route: {"decision": "continue|new_session|prompt_user", "reason": "简述原因", "confidence": 0.0-1.0}-->

决策规则：
- 用户说"新对话/换个话题/重新开始" → new_session (confidence: 0.95)
- 新消息与当前话题完全无关 → prompt_user (confidence: 0.7)
- 新消息是当前话题的延续或深入 → continue (confidence: 0.9)
- 不确定时 → prompt_user (confidence: 0.5)

输出路由 JSON 后，正常回复用户消息。如果决策是 new_session，在回复前说明建议开启新对话的原因。
```

### English Version

```
## Session Route Analysis

Before responding to the user's message, perform the following routing analysis:

Analysis steps:
1. Extract topic keywords from the current conversation
2. Assess relevance of the new message to the current topic (high/medium/low)
3. Check for explicit switching intent ("new chat", "different topic", "start over")
4. Determine the routing decision

Output format (as a JSON comment at the beginning of the response):
<!--session_route: {"decision": "continue|new_session|prompt_user", "reason": "brief explanation", "confidence": 0.0-1.0}-->

Decision rules:
- User says "new chat/switch topic/start over" → new_session (confidence: 0.95)
- New message is completely unrelated to current topic → prompt_user (confidence: 0.7)
- New message continues or deepens the current topic → continue (confidence: 0.9)
- Uncertain → prompt_user (confidence: 0.5)

After outputting the route JSON, respond to the user's message normally. If the decision is new_session, explain the reason for suggesting a new conversation before responding.
```

---

## Frontend Parsing Example

```javascript
/**
 * 解析 AI 响应中的路由决策 Parse route decision from AI response
 * @param {string} response - AI 原始响应 Raw AI response
 * @returns {{ route: object|null, content: string }}
 */
function parseRouteDecision(response) {
  const routeRegex = /<!--session_route:\s*({.*?})-->/s
  const match = response.match(routeRegex)

  if (match) {
    try {
      const route = JSON.parse(match[1])
      const content = response.replace(routeRegex, '').trim()
      return { route, content }
    } catch (e) {
      return { route: null, content: response }
    }
  }

  return { route: null, content: response }
}

// 使用示例 Usage example
const { route, content } = parseRouteDecision(aiResponse)
if (route?.decision === 'new_session') {
  // 提示用户 Prompt user
  showNotification('AI 建议开启新对话: ' + route.reason)
}
```

## Integration Tips

1. **Insert the prompt** at the end of the system message, before the conversation history
2. **Parse the JSON comment** from the AI response before rendering to the UI
3. **Strip the comment** before displaying the message to the user
4. **Log decisions** for monitoring and threshold tuning
5. **Fallback gracefully**: if parsing fails, treat as `continue`
