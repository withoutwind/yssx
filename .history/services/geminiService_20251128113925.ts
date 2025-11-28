import { Deity, Tier, GeminiResponse } from "../src/types";

import axios from "axios";

function decryptXOR(encryptedB64:string, key:string) {
  const encryptedBytes = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
  const keyBytes = new TextEncoder().encode(key);

  const decrypted = encryptedBytes.map((b, i) => 
    b ^ keyBytes[i % keyBytes.length]
  );

  return new TextDecoder().decode(decrypted);
}

// 使用方式
const encryptionKey = "12345678901234567890123456789012";
const encrypted = "QlkeUQcPAwELUQEGC1UGAg8JDwgJAFZQAAUAXV8DAAQIBAo=";

const apiKey = decryptXOR(encrypted, encryptionKey);

export const getDivineGuidance = async (
  deity: Deity,
  wish: string,
  totalDonation: number
): Promise<GeminiResponse> => {
  if (!apiKey) {
    return {
      prediction: "心诚则灵，万事胜意。",
      guidance: "API Key未配置，请配置后重试。今日宜修身养性。",
      luckyNumber: 8,
    };
  }

  const systemInstruction = `
    你现在扮演一位中国传统神仙或庙祝（根据用户选择的神仙：${deity.name}）。
    用户正在进行“手机烧香”祈福。

    用户的愿望是：${wish || "祈求平安顺遂"}。
    用户供奉的香火钱总额是：${totalDonation}元。

    请根据供奉金额（金额越高语气越赞赏，但保持慈悲），结合愿望内容，
    生成一份签文反馈。

    ⚠️返回格式必须是JSON对象，包含字段：
    - prediction: 古风签文，四句或八句诗。
    - guidance: 白话解读 + 建议，语气庄重又风趣。
    - luckyNumber: 1-99 的整数。
  `;

  try {
    const response = await axios.post(
      "https://api.deepseek.com/beta/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: "请生成签文，用 JSON 输出。" }
        ],
        temperature: 0.7,
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const raw = response.data.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error("Empty DeepSeek response");

    return JSON.parse(raw); // 必须是 JSON 格式
  } catch (error) {
    console.error("DeepSeek API Error:", error);

    return {
      prediction: "云深雾散，静候良缘。",
      guidance: "似乎神灵暂未回应，请稍后再试。",
      luckyNumber: 3,
    };
  }
};
