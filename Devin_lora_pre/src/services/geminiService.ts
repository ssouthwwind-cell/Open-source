import { ModelConfig } from '../types';

export interface TaggingResult {
  tags: string[];
  caption: string;
}

const API_URL = "/api/proxy/analyze";
const HEADERS = {
  "Content-Type": "application/json",
};

export async function analyzeImage(
  imageBlobUrl: string, 
  config: ModelConfig,
  language: 'zh' | 'en' = 'zh',
  type: 'tags' | 'caption' | 'both' = 'both'
): Promise<TaggingResult> {
  let lastError: any = null;
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Convert blob URL to Data URL with compression
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions to prevent 413 errors
          const MAX_SIZE = 1024;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round(height * (MAX_SIZE / width));
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round(width * (MAX_SIZE / height));
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }
          
          // Fill white background in case of transparent PNG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.8 quality
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => reject(new Error("Failed to load image for compression"));
        img.src = imageBlobUrl;
      });

      const systemInstruction = `你是一个专业的图像训练数据打标助手，专门为 LoRA、Stable Diffusion、Flux 等视觉模型生成训练标签。

你的目标不是写文学描述，而是输出适合训练和后续人工二次筛选的高质量结构化标注。

请严格遵守以下规则：
1. 只描述图像中明确可见的内容，不要脑补，不要根据常识推断不可见信息。
2. 如果某个特征不确定，就不要写；宁可略少，也不要写错。
3. 标签可以相对丰富，但必须稳定、独立、可复用、便于后续人工筛选。
4. 标签应尽量简短，偏训练关键词风格；避免完整句子、解释性短语和主观评价。
5. 不要输出重复标签、近义重复标签或几乎等价的冗余标签。
6. 不要输出无训练价值的空泛词，例如“好看”“高质量”“精美”“awesome”“masterpiece”等主观质量词，除非用户明确需要。
7. 优先关注这些维度：
   - 主体数量与类型
   - 明显外观特征
   - 发型发色、眼睛、表情
   - 服饰、饰品、道具
   - 姿态、动作、手部状态
   - 构图、视角、镜头距离、画面裁切
   - 场景、背景、时间、天气、光照
   - 画风、媒介、渲染方式
8. 标签顺序尽量稳定，按以下顺序组织：
   主体 > 外观 > 服饰/配件 > 动作/姿态 > 构图/视角 > 场景/背景 > 风格/画法。
9. caption 只需要做简洁总结，1 句话即可，不要过长，不要加入不可见信息。
10. 最终输出必须是合法 JSON，不要输出 Markdown 代码块。`;

      let userPrompt = `请分析这张图片，并输出适合训练数据整理的结构化结果。
输出语言：${language === 'zh' ? '中文' : 'English'}。

标签允许比极简模式更丰富一些，方便后续人工筛选和二次处理，但必须遵守以下约束：
- 只写明确可见的内容
- 不要脑补身份、剧情、性格、关系、职业等不可直接确认的信息
- 不要重复
- 优先使用短标签
- 顺序尽量稳定

请严格按照以下 JSON 格式返回结果：`;
      
      if (type === 'tags' || type === 'both') {
        userPrompt += `\n1. "tags": 一个字符串数组，内容是适合训练的关键词标签。标签可以适当丰富，但必须去重、稳定、简短，并尽量按照“主体 > 外观 > 服饰/配件 > 动作/姿态 > 构图/视角 > 场景/背景 > 风格/画法”的顺序输出。(例如: ${language === 'zh' ? '"1个女孩", "独自", "蓝发", "长发", "白色连衣裙", "站立", "看向镜头", "户外", "日落", "动漫风格"' : '"1girl", "solo", "blue hair", "long hair", "white dress", "standing", "looking at viewer", "outdoor", "sunset", "anime style"'}).`;
      }
      
      if (type === 'caption' || type === 'both') {
        userPrompt += `\n2. "caption": 一句简洁的自然语言总结，只概括图中明确可见的主要内容，不要写成长段，不要加入推测。(例如: ${language === 'zh' ? '"一个蓝发女孩穿着白色连衣裙站在日落下的户外场景中"' : '"A blue-haired girl in a white dress standing outdoors at sunset"'}).`;
      }

      userPrompt += `\n\n只返回包含 "tags" (字符串数组) 和 "caption" (字符串) 的 JSON 对象。如果未请求某种类型，则返回空值。不要包含 Markdown 代码块标记，不要输出额外说明。`;

      const payload = {
        messages: [
          { role: "system", content: systemInstruction },
          { 
            role: "user", 
            content: [
              { type: "text", text: userPrompt },
              { 
                type: "image_url", 
                image_url: { url: dataUrl } 
              }
            ] 
          },
        ],
        stream: false
      };

      const requestBody = {
        config,
        payload
      };

      const apiResponse = await fetch(API_URL, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(requestBody),
      });

      if (!apiResponse.ok) {
        throw new Error(`API Request failed with status ${apiResponse.status}`);
      }

      const responseData = await apiResponse.json();
      
      const generatedText = responseData.choices?.[0]?.message?.content || "";
      
      // Strip markdown code fences if present
      const cleanText = generatedText.replace(/```json\n?|```/g, "").trim();
      
      const parsed = JSON.parse(cleanText);
      return {
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        caption: typeof parsed.caption === 'string' ? parsed.caption : "",
      };
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  console.error("Error analyzing image after retries:", lastError);
  throw lastError;
}
