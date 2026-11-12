/**
 * 把毫秒数格式化为简洁易读的中文时长。
 * 例如：
 * - 0 -> "0 秒"
 * - 45000 -> "45 秒"
 * - 60000 -> "1 分钟"
 * - 75000 -> "1 分 15 秒"
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds} 秒`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (seconds === 0) {
    return `${minutes} 分钟`;
  }
  return `${minutes} 分 ${seconds} 秒`;
}
