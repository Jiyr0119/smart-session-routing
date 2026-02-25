# Decision Framework for Smart Session Routing

## Signal Categories (Detailed)

### 1. Semantic Relevance (Weight: High)

Measure how closely the incoming message relates to the existing conversation topic.

#### Methods

| Method | Accuracy | Cost | Latency |
|--------|----------|------|---------|
| Embedding cosine similarity | High | Medium | ~100ms |
| LLM classification | Very High | High | ~500ms |
| Keyword overlap (TF-IDF) | Medium | Low | ~10ms |
| Conversation summary comparison | High | Medium | ~200ms |

#### Recommended Thresholds (Cosine Similarity)

| Score | Interpretation | Action |
|-------|---------------|--------|
| > 0.7 | Strongly related | CONTINUE |
| 0.3 - 0.7 | Ambiguous | Check other signals |
| < 0.3 | Unrelated topic | Lean toward NEW SESSION |

#### Implementation Notes

- Compare against a **rolling conversation summary**, not individual messages
- Update the summary every 5-10 messages or when a topic shift is detected
- For embedding models, `text-embedding-3-small` (OpenAI) or `bge-m3` (open-source) provide good multilingual coverage

### 2. Explicit User Intent (Weight: Critical)

Detect when users directly request a new session. This signal overrides all others.

#### Detection Patterns

**Chinese keywords:**
```
新对话, 新会话, 换个话题, 重新开始, 新的问题, 开始新的,
不说这个了, 换一个, 从头开始, 另一个话题
```

**English keywords:**
```
new chat, new conversation, new topic, start over, fresh start,
different subject, switch topic, let's talk about something else,
change the subject, unrelated question
```

#### Pattern Matching Strategy

```
1. Exact match against keyword list (fast path)
2. Fuzzy match with edit distance ≤ 2 (catch typos)
3. Semantic intent classification (catch paraphrases)
```

### 3. Context Window State (Weight: Medium)

Monitor how full the context window is to prevent truncation-related issues.

#### Thresholds

| Utilization | Status | Action |
|-------------|--------|--------|
| < 60% | Healthy | No action |
| 60-80% | Warning | Start summarizing older messages |
| > 80% | Critical | Recommend new session with summary carry-over |
| > 95% | Emergency | Force new session |

#### Summary Carry-Over Protocol

When creating a new session due to context overflow:

1. Generate a structured summary of the current conversation
2. Include: key topics discussed, decisions made, unresolved questions
3. Inject the summary as a system message in the new session
4. Tag the new session with a reference to the parent session ID

### 4. Time Gap (Weight: Low-Medium)

Large gaps between messages suggest the user may have shifted context mentally.

#### Recommended Thresholds

| Gap | Action |
|-----|--------|
| < 1 hour | CONTINUE (no change) |
| 1-4 hours | CONTINUE (re-inject context summary) |
| 4-24 hours | PROMPT USER ("Continue this topic or start fresh?") |
| > 24 hours | Default to NEW SESSION with option to continue |

#### Adjustment Factors

- **Task type**: Coding/debugging sessions tolerate longer gaps (increase thresholds 2x)
- **Incomplete tasks**: If the last message was a question without answer, maintain session longer
- **User preference**: Allow per-user threshold configuration

### 5. Conversation Health (Weight: Medium)

Assess whether the current conversation is productive or stuck.

#### Unhealthy Signals

| Signal | Indicator |
|--------|-----------|
| Error loops | Same error message repeated 3+ times |
| User frustration | Short negative messages ("no", "wrong", "not this") |
| AI confusion | Contradictory responses within 5 messages |
| Dead end | AI offers no actionable next steps |

#### Response Strategy

- Unhealthy conversation + new topic → Strongly favor NEW SESSION
- Unhealthy conversation + same topic → Suggest rephrasing or NEW SESSION with summary

---

## Combined Decision Matrix

When multiple signals fire simultaneously:

| Semantic | Intent | Context | Time | Health | → Decision |
|----------|--------|---------|------|--------|------------|
| Low | New | Any | Any | Any | **NEW SESSION** (100%) |
| Low | None | OK | Short | OK | **PROMPT USER** |
| Low | None | OK | Long | Any | **NEW SESSION** (80%) |
| High | None | OK | Short | OK | **CONTINUE** (100%) |
| High | None | High | Short | OK | **CONTINUE** + summarize |
| High | None | Critical | Any | Any | **NEW SESSION** + carry-over |
| Any | None | Any | Any | Bad | **PROMPT USER** |
| Medium | None | OK | Medium | OK | **CONTINUE** (lean continue) |

## Edge Cases

### Multi-Language Conversations

When users switch languages mid-conversation:
- Language switch alone is NOT a session trigger
- Evaluate semantic relevance in a language-agnostic way (use multilingual embeddings)

### Multi-Modal Messages

When messages include images, files, or code:
- Extract text content for semantic analysis
- File type changes (e.g., Python → Photoshop) may indicate topic shift

### Returning to a Previous Topic

When a user circles back to an earlier topic after a tangent:
- Check similarity against the full conversation summary, not just last N messages
- Consider offering to FORK rather than NEW SESSION

### Intentionally Broad Sessions

Some users prefer one long "general assistant" session:
- Respect user preferences (configurable "never auto-route" setting)
- Provide manual "Split from here" functionality as an alternative
