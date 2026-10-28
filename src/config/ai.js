/**
 * 影像分析的「非账号」参数。
 *
 * 接口地址 / API Key / 模型名都不在这里：它们在摄影板块的「选择模型」弹窗里
 * 由使用者填写，保存在本机 localStorage（见 composables/useAISettings.js）。
 * 这个文件只留与谁用无关、可以写死在前端的调参项。
 */
const ENV = import.meta.env || {};

export const AI_CONFIG = {
  // 四段中文分析 + 英文提示词，1500 会在「具体问题」之后就用完，
  // 表现就是「优化建议」整段消失。这里留足余量给正文与思考 token。
  maxTokens: Number(ENV.VITE_AI_MAX_TOKENS) || 4096,
  temperature: 0.4,
  // 视觉模型排队久一点，超过这个时间就主动断开，避免按钮一直转
  timeoutMs: 90_000
};

// 接口地址需要是 OpenAI 兼容的对话接口（Gemini 官方也有同格式的
// /v1beta/openai/chat/completions），请求体为 messages + image_url。
export const BASE_URL_EXAMPLE = 'https://api.deepseek.com/chat/completions';
export const MODEL_EXAMPLE = 'deepseek-flash';

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
