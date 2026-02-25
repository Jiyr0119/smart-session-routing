/**
 * 前端会话路由集成示例 Frontend session routing integration example
 *
 * 展示如何在 Vue 3 + Pinia 项目中集成智能会话路由
 * Demonstrates smart session routing in a Vue 3 + Pinia project
 *
 * 使用方式：在你的 chatStore 或 composable 中引入此逻辑
 * Usage: Import this logic into your chatStore or composable
 */

// ========================================
// 配置 Configuration
// ========================================

// 显式意图关键词 Explicit intent keywords
const INTENT_KEYWORDS = {
  zh: ['新对话', '新会话', '换个话题', '重新开始', '新的问题', '不说这个了', '换一个', '另一个话题', '从头开始'],
  en: ['new chat', 'new conversation', 'new topic', 'start over', 'fresh start', 'different subject', 'switch topic', 'change the subject']
};

// 时间阈值(毫秒) Time thresholds in ms
const TIME_THRESHOLDS = {
  PROMPT: 4 * 60 * 60 * 1000,       // 4小时 4 hours → 提示用户 prompt user
  NEW_SESSION: 24 * 60 * 60 * 1000   // 24小时 24 hours → 建议新会话 suggest new session
};

// ========================================
// 意图检测 Intent Detection
// ========================================

/**
 * 检测消息中的显式新会话意图 Detect explicit new-session intent in message
 * @param {string} message - 用户消息 User message
 * @returns {string|null} 匹配到的关键词或 null Matched keyword or null
 */
function detectIntent (message) {
  const text = message.toLowerCase().trim();
  const allKeywords = [...INTENT_KEYWORDS.zh, ...INTENT_KEYWORDS.en];

  for (const keyword of allKeywords) {
    if (text.includes(keyword.toLowerCase())) {
      return keyword;
    }
  }
  return null;
}

// ========================================
// 时间间隔检查 Time Gap Check
// ========================================

/**
 * 检查最后一条消息的时间间隔 Check time gap since last message
 * @param {Array} messages - 消息列表 Message list
 * @returns {{ gap: number, level: string }} 间隔和级别 Gap and level
 */
function checkTimeGap (messages) {
  if (!messages || messages.length === 0) {
    return { gap: 0, level: 'none' };
  }

  const lastMessage = messages[messages.length - 1];
  const lastTime = lastMessage.timestamp || lastMessage.created_at;
  if (!lastTime) {
    return { gap: 0, level: 'none' };
  }

  const gap = Date.now() - new Date(lastTime).getTime();

  if (gap > TIME_THRESHOLDS.NEW_SESSION) {
    return { gap, level: 'new_session' };
  }
  if (gap > TIME_THRESHOLDS.PROMPT) {
    return { gap, level: 'prompt' };
  }
  return { gap, level: 'ok' };
}

// ========================================
// 路由决策 Route Decision
// ========================================

/**
 * 本地快速路由检查 Local quick route check (no API call)
 * @param {string} message - 用户消息 User message
 * @param {Array} messages - 当前会话消息 Current session messages
 * @returns {{ decision: string, reason: string, confidence: number } | null}
 */
function quickRouteCheck (message, messages) {
  // 1. 显式意图(最高优先级) Explicit intent (highest priority)
  const intent = detectIntent(message);
  if (intent) {
    return {
      decision: 'new_session',
      reason: `用户意图: "${intent}"`,
      confidence: 0.95
    };
  }

  // 2. 时间间隔 Time gap
  const { gap, level } = checkTimeGap(messages);
  if (level === 'new_session') {
    const hours = Math.round(gap / (60 * 60 * 1000));
    return {
      decision: 'prompt_user',
      reason: `距上次消息已过 ${hours} 小时`,
      confidence: 0.7
    };
  }
  if (level === 'prompt') {
    const hours = Math.round(gap / (60 * 60 * 1000));
    return {
      decision: 'prompt_user',
      reason: `距上次消息已过 ${hours} 小时`,
      confidence: 0.5
    };
  }

  // 3. 消息数量过多(简易上下文窗口检查) Message count check (simple context window)
  if (messages.length > 50) {
    return {
      decision: 'prompt_user',
      reason: `当前会话已有 ${messages.length} 条消息，建议整理`,
      confidence: 0.4
    };
  }

  // 无法本地判断，需要后端 Cannot determine locally, need backend
  return null;
}

// ========================================
// Vue 3 Composable 集成 Integration
// ========================================

/**
 * useSessionRouter composable 示例 Example
 * 在 Vue 3 组件中使用 Use in Vue 3 components
 *
 * @example
 * ```vue
 * <script setup>
 * import { useSessionRouter } from './composables/useSessionRouter'
 * import { useChatSessionStore } from '@/store/chatSessionStore'
 *
 * const chatStore = useChatSessionStore()
 * const { checkAndRoute, routeResult } = useSessionRouter(chatStore)
 *
 * async function handleSend(text) {
 *   const shouldContinue = await checkAndRoute(text)
 *   if (shouldContinue) {
 *     chatStore.send({ text, spaceId: currentSpaceId })
 *   }
 * }
 * </script>
 * ```
 */

// import { ref } from 'vue'
// import { Modal } from 'ant-design-vue'
//
// export function useSessionRouter(chatStore) {
//   const routeResult = ref(null)
//
//   async function checkAndRoute(message) {
//     // 本地快速检查 Local quick check
//     const result = quickRouteCheck(message, chatStore.messages)
//
//     if (!result) {
//       // 无特殊信号，直接继续 No special signals, continue
//       return true
//     }
//
//     routeResult.value = result
//
//     switch (result.decision) {
//       case 'new_session':
//         // 高置信度自动执行 High confidence, auto-execute
//         if (result.confidence > 0.9) {
//           chatStore.reset()
//           return true
//         }
//         // 否则询问 Otherwise ask
//         return await promptUser(result.reason)
//
//       case 'prompt_user':
//         return await promptUser(result.reason)
//
//       default:
//         return true
//     }
//   }
//
//   async function promptUser(reason) {
//     return new Promise((resolve) => {
//       Modal.confirm({
//         title: '会话路由建议',
//         content: `${reason}，是否开启新对话？`,
//         okText: '新对话',
//         cancelText: '继续当前',
//         onOk: () => {
//           chatStore.reset()
//           resolve(true)
//         },
//         onCancel: () => resolve(true)
//       })
//     })
//   }
//
//   return { checkAndRoute, routeResult }
// }

// ========================================
// 导出 Exports
// ========================================
export {
  detectIntent,
  checkTimeGap,
  quickRouteCheck,
  INTENT_KEYWORDS,
  TIME_THRESHOLDS
};
