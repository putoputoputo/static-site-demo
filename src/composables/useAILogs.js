// 把 aiLog 的订阅接到 Vue 响应式上。
// aiLog 本身零依赖，所以 Node 下的回归脚本可以放心直接 import 请求层。

import { onBeforeUnmount, ref } from 'vue'
import { clearLogs, getLogs, subscribe } from '../utils/aiLog.js'

export function useAILogs() {
  const logs = ref(getLogs())
  const stop = subscribe((next) => {
    logs.value = next
  })

  onBeforeUnmount(stop)

  return { logs, clear: clearLogs }
}
