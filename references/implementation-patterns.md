# Implementation Patterns for Smart Session Routing

## Architecture Approaches

Three architectural patterns for integrating session routing, ordered by implementation complexity:

### Pattern 1: Prompt Injection (Zero Infrastructure)

Embed routing logic directly into the AI model's system prompt. The model evaluates its own conversation context and outputs a routing decision before responding.

**How it works:**
```
System Prompt → includes routing instructions
     ↓
AI receives: [conversation history] + [new message]
     ↓
AI outputs: <!--session_route: {decision, confidence}--> + response
     ↓
Frontend parses the JSON comment and acts on the decision
```

**Pros:** No backend changes, works with any LLM API, fastest to ship
**Cons:** Adds ~100-200 tokens overhead per response, routing quality depends on model capability
**Best for:** MVPs, small teams, applications with < 10k daily active users

See `examples/session-router-prompt.md` for the complete prompt template.

---

### Pattern 2: Lightweight Middleware (Moderate Complexity)

A thin routing layer between the frontend and the AI model. Intercepts messages, runs quick checks, and decides routing before the message reaches the model.

**Architecture:**
```
Frontend → [Session Router Middleware] → AI Model
               │
               ├── Intent Detector (keyword matching)
               ├── Time Gap Checker (timestamp comparison)
               ├── Context Monitor (token counting)
               └── Decision Aggregator
```

**Key design decisions:**
- **Synchronous fast path:** Intent detection + time gap check (< 10ms combined)
- **Async slow path:** Semantic similarity via embeddings (optional, ~100ms)
- **Fallback:** If routing service is down, default to CONTINUE (never block the user)

**Where to place the router:**
- As API middleware (intercept before handler)
- As a service layer function (called explicitly by the chat handler)
- As a frontend pre-send hook (client-side only, no backend needed for basic checks)

**Pros:** Deterministic, tunable, auditable routing decisions
**Cons:** Requires backend deployment, needs threshold tuning
**Best for:** Production applications, teams that need control and observability

---

### Pattern 3: Hybrid (Production Grade)

Combines client-side heuristics with server-side intelligence for the best user experience.

**Architecture:**
```
┌─────── Frontend ───────┐     ┌─────── Backend ────────┐
│                         │     │                         │
│  Quick checks:          │     │  Deep checks:           │
│  • Intent keywords      │────▶│  • Semantic similarity  │
│  • Time gap             │     │  • Context window state  │
│  • Message count        │     │  • Conversation health   │
│                         │     │  • Historical patterns   │
│  If clear → act locally │     │                         │
│  If unsure → ask server │     │  Returns: decision +    │
│                         │     │  confidence + reason     │
└─────────────────────────┘     └─────────────────────────┘
```

**Key principle: Frontend handles the obvious, backend handles the subtle.**

- User says "新对话" → Frontend catches it instantly, no round trip
- Ambiguous topic shift → Frontend asks backend for semantic analysis
- Context window warning → Backend monitors token count, triggers proactively

**Pros:** Fast UX for obvious cases, smart decisions for ambiguous cases
**Cons:** Most complex to implement and maintain
**Best for:** Large-scale applications with high routing accuracy requirements

---

## Key Design Principles

### 1. Never Block the User

Routing should be transparent. If the routing check takes too long or fails:
- Default to **CONTINUE**
- Log the failure for later analysis
- Never show an error to the user about routing

### 2. Graceful Degradation

```
Full service available  → Semantic + Intent + Context + Time
Embedding service down  → Intent + Context + Time (skip semantic)
Backend unreachable     → Frontend intent + time checks only
Everything fails        → Just send the message (CONTINUE)
```

### 3. Summary Carry-Over

When auto-creating a new session, preserve context:
- Generate a structured summary of the previous conversation
- Include: topics discussed, key decisions, unresolved questions
- Inject as the first system message in the new session
- Keep a reference link between parent and child sessions

### 4. User Override

Always respect explicit user choices:
- If user says "继续" after a routing prompt → honor it
- Provide a "New Session" button in the UI for manual control
- Allow per-user preference: "Never auto-route" setting
- Track override patterns to improve threshold calibration

### 5. Observability

Log every routing decision for analysis:

| Field | Purpose |
|-------|---------|
| `message_preview` | First 50 chars of the triggering message |
| `decision` | continue / new_session / prompt / fork |
| `confidence` | 0.0 - 1.0 |
| `signals_fired` | Which of the 5 signals triggered |
| `user_override` | Did the user override the decision? |
| `latency_ms` | How long the routing check took |

Use this data to:
- Tune thresholds (if override rate > 10%, adjust)
- Identify new intent keywords from user messages
- Detect model-specific routing quality issues

---

## Monitoring & Tuning

### Key Metrics

| Metric | Target | Red Flag |
|--------|--------|----------|
| Auto-route accuracy | > 90% | < 80% |
| User override rate | < 10% | > 20% |
| False positive rate (unnecessary new sessions) | < 5% | > 10% |
| False negative rate (missed topic shifts) | < 10% | > 20% |
| Routing latency (P95) | < 200ms | > 500ms |

### Tuning Loop

1. Start with conservative thresholds (favor CONTINUE)
2. Log all decisions + user overrides
3. Weekly review: adjust thresholds based on override patterns
4. A/B test threshold changes on a subset of users
5. Repeat
