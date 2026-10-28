/**
 * 影像分析（摄影板块）的模型配置。
 *
 * 下面两项留空就视为「未配置」：点「开始分析」只会提示去填，不会发请求。
 * 也可以不改这个文件，改用环境变量覆盖（见根目录 .env.example）：
 *   VITE_AI_BASE_URL / VITE_AI_API_KEY
 *
 * baseUrl 需要是 OpenAI 兼容的对话接口地址（Gemini 官方也提供同格式的
 * /v1beta/openai/chat/completions），请求体为 messages + image_url。
 */
const ENV = import.meta.env || {};

export const AI_CONFIG = {
  // 预留：接口地址，例如 https://your-endpoint/v1/chat/completions
  baseUrl: ENV.VITE_AI_BASE_URL || "https://api.deepseek.com/chat/completions",
  // 预留：对应服务的 API Key，会以 Bearer 形式放进 Authorization 头
  apiKey: ENV.VITE_AI_API_KEY || "sk-034d4d561a25412da6a5b22c0c15393b",
  model: "deepseek-flash",
  // 视觉模型排队久一点，超过这个时间就主动断开，避免按钮一直转
  timeoutMs: 90_000
};

export const isAIConfigured = () =>
  Boolean(AI_CONFIG.baseUrl && AI_CONFIG.apiKey);

// 提示词是产品定义，改这里就能整体换掉分析口径，不要在组件里拼字符串
export const ANALYSIS_PROMPT = `你是一位专业摄影指导，请对这张照片进行客观、直接的分析。

请严格按以下结构回答：

### 整体评价
用1-2句话总结这张照片的水平，并指出最核心的优缺点。

### 具体问题
从构图、光线、色彩、主体与背景、层次感等方面，指出存在的问题（没有的问题不要硬说）。

### 优化建议
给出具体可执行的改进建议（拍摄角度、构图、光线利用、后期方向等）。

### 图像编辑提示词（英文）
根据以上分析，生成一段适合图像编辑模型使用的英文提示词。要求：
- 保留原图主要内容
- 明确说明要优化的方向（构图、光线、色彩、氛围等）
- 语言精准专业
- 只输出提示词，不要加解释`;
