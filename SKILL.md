---
name: Smart Session Routing
description: This skill should be used when the user asks to "determine if a new session is needed", "implement smart session routing", "detect topic changes in chat", "auto-create new conversations", "handle session switching logic", "build conversation continuity detection", or needs guidance on when to start a new AI chat session versus continuing an existing one.
version: 0.1.0
---

# Smart Session Routing

Provide AI chat applications with an intelligent decision framework for determining whether a user's new message should continue the current conversation or trigger a new session. This prevents context pollution, reduces hallucination from irrelevant history, and improves user experience.

## Core Concept

**Session Routing** is the process of evaluating an incoming message against the current conversation context to decide the optimal routing path:

| Route | Condition | Action |
|-------|-----------|--------|
| **Continue** | Message relates to current topic | Append to existing session |
| **New Session** | Topic shift detected | Create new session, archive current |
| **Fork** | Subtopic that may return | Create linked child session |
| **Prompt User** | Ambiguous intent | Ask user to confirm |

## When to Apply

Apply session routing when building any AI chat interface that supports:
- Multi-turn conversations with persistent history
- Multiple concurrent sessions or conversation threads
- Long-running sessions where context may become stale
- AI agents that consume conversation history as context

## Decision Signals (Quick Reference)

Five categories of signals determine the routing decision:

| # | Signal | Weight | Example |
|---|--------|--------|---------|
| 1 | **Semantic Relevance** | High | Current topic: "API testing" → New message: "Write me a poem" |
| 2 | **Explicit Intent** | Critical | "Start a new chat", "New topic", "Let's switch to..." |
| 3 | **Context Window** | Medium | Token count approaching model limit |
| 4 | **Time Gap** | Low-Med | >24h since last message in session |
| 5 | **Conversation Health** | Medium | Repeated errors, stuck loops, user frustration |

> For detailed scoring rules and thresholds, consult `references/decision-framework.md`.

## Quick Decision Flow

```
Incoming Message
    │
    ├─ Explicit new-session intent? ──YES──→ NEW SESSION
    │
    ├─ Context window >80% full?  ──YES──→ NEW SESSION (with summary carry-over)
    │
    ├─ Semantic similarity < 0.3?  ──YES──→ PROMPT USER or NEW SESSION
    │
    ├─ Time gap > threshold?       ──YES──→ PROMPT USER
    │
    └─ None of the above          ──────→ CONTINUE
```

## Implementation Approaches

### Approach 1: AI-Self-Judgment (Prompt-Based)

Embed routing logic into the system prompt. The AI model evaluates its own conversation and decides.

**Best for**: Quick integration, smaller teams, prototype phase.

```
Inject a routing analysis step before generating the response.
The AI outputs a structured decision (continue/new/prompt) before answering.
```

See `examples/session-router-prompt.md` for a complete prompt template.

### Approach 2: Middleware / Service Layer

Implement routing as a dedicated service that intercepts messages before they reach the AI model.

**Best for**: Production systems, high-traffic applications, fine-grained control.

Key components:
- **Semantic Analyzer**: Embedding-based similarity between new message and conversation summary
- **Intent Detector**: Regex + NLU for explicit session commands
- **Context Monitor**: Token counter and window state tracker
- **Router**: Aggregates signals and makes the final decision

See `references/implementation-patterns.md` for architecture details.

### Approach 3: Frontend Heuristics

Lightweight client-side checks before sending the message to the backend.

**Best for**: Augmenting server-side routing, instant UX feedback.

```javascript
// 在发送前检查时间间隔 Check time gap before sending
const lastMessageTime = session.messages.at(-1)?.timestamp;
const gap = Date.now() - lastMessageTime;
if (gap > 24 * 60 * 60 * 1000) {
  promptUserForNewSession();
}
```

See `examples/frontend-integration.js` for a complete integration example.

## Integration Checklist

When implementing session routing:

- [ ] Define explicit intent keywords for the target language(s)
- [ ] Set semantic similarity threshold (recommended: 0.3 for cosine similarity)
- [ ] Configure context window monitoring (trigger at 80% capacity)
- [ ] Implement graceful degradation (if routing fails, default to CONTINUE)
- [ ] Add "New Session" UI affordance so users can explicitly switch
- [ ] Log routing decisions for analysis and threshold tuning
- [ ] Handle summary carry-over when auto-creating new sessions

## Additional Resources

### Reference Files

For detailed decision logic and implementation architecture, consult:
- **`references/decision-framework.md`** - Complete scoring model, thresholds, edge cases, and decision matrix
- **`references/implementation-patterns.md`** - Backend service architecture, frontend store integration, API design patterns

### Example Files

Working examples in `examples/`:
- **`examples/session-router-prompt.md`** - Production-ready prompt template for AI-self-judgment approach
- **`examples/frontend-integration.js`** - Frontend store integration with session routing hooks
