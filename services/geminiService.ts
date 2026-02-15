
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Weight, Language, Thought, ThoughtStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getAnalysisSchema = (lang: Language) => ({
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      enum: ["LET_THEM", "LET_ME"],
      description: "Classify if this is outside control (LET_THEM/Smoke) or an actionable task (LET_ME/Solid)."
    },
    weight: {
      type: Type.STRING,
      enum: ["URGENT", "IMPORTANT", "CASUAL"],
    },
    reasoning: {
      type: Type.STRING,
      description: `Explain why this belongs to this category strictly in ${lang === 'zh' ? 'Chinese' : 'English'}.`
    },
    reframing: {
      type: Type.STRING,
      description: `Reframing or core goal in ${lang === 'zh' ? 'Chinese' : 'English'}.`
    },
    stoicQuote: {
      type: Type.STRING,
      description: `Stoic insight in ${lang === 'zh' ? 'Chinese' : 'English'} (max 15 words).`
    },
    subTasks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: `1-3 steps in ${lang === 'zh' ? 'Chinese' : 'English'}.`
    },
    timeEstimate: {
      type: Type.STRING,
      description: "Time estimate (e.g. '45m')."
    },
    suggestedSlot: {
      type: Type.STRING,
      description: `A recommended TIME of day (e.g. '10:30', '14:00', or '晚上'). Strictly in ${lang === 'zh' ? 'Chinese' : 'English'}. If Today is chosen, this MUST be in the future relative to the Current Time.`
    }
  },
  required: ["category", "reasoning", "stoicQuote", "suggestedSlot"]
});

const splitChaosSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING, description: "One distinct thought or task." }
    },
    required: ["text"]
  }
};

export const splitChaos = async (content: string, lang: Language): Promise<Partial<Thought>[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Deconstruct: "${content}". Split into distinct items. Use language: ${lang === 'zh' ? 'Chinese' : 'English'}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: splitChaosSchema,
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: `You are a deconstruction expert. Explode human input into clean fragments. Output in ${lang}.`
      }
    });

    const results = JSON.parse(response.text || "[]");
    return results.map((r: any) => ({
      content: r.text,
      status: ThoughtStatus.UNSORTED
    }));
  } catch (error: any) {
    const parts = content.split(/[，。？！；,\.?!;]\s*/).filter(p => p.trim().length > 0);
    if (parts.length <= 1) return [{ content: content.trim(), status: ThoughtStatus.UNSORTED }];
    return parts.map(p => ({ content: p.trim(), status: ThoughtStatus.UNSORTED }));
  }
};

export const analyzeThought = async (
  content: string, 
  lang: Language, 
  calendarContext?: string
): Promise<AnalysisResult> => {
  const now = new Date();
  const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Quick analyze: "${content}". Current Time: ${currentTimeStr}. ${calendarContext ? `Context: ${calendarContext}` : ""} Lang: ${lang}. THE SUGGESTED SLOT FOR TODAY MUST BE LATER THAN ${currentTimeStr}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: getAnalysisSchema(lang),
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: `You are a master of Stoicism and productivity. USE ONLY ${lang === 'zh' ? 'Chinese' : 'English'}. NEVER suggest a time for today that has already passed.`
      }
    });

    return JSON.parse(response.text || "{}") as AnalysisResult;
  } catch (error: any) {
    const isQuestion = content.includes('?') || content.includes('？') || content.length > 60;
    let futureHour = (now.getHours() + 1) % 24;
    // Safety check for default fallback
    if (futureHour < now.getHours()) futureHour = now.getHours() + 2; 

    return {
      category: isQuestion ? 'LET_THEM' : 'LET_ME',
      reasoning: lang === 'zh' ? "行动是治疗焦虑的良药。" : "Action is the antidote to anxiety.",
      stoicQuote: lang === 'zh' ? "我们遭受的想象之苦多于现实之苦。" : "We suffer more in imagination than in reality.",
      subTasks: isQuestion ? [] : [lang === 'zh' ? "迈出第一步" : "Take the first step"],
      timeEstimate: "15m",
      suggestedSlot: `${futureHour}:00`
    };
  }
};
