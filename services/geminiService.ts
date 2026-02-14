
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
      description: `Explain why this belongs to this category in ${lang === 'zh' ? 'Chinese' : 'English'}.`
    },
    reframing: {
      type: Type.STRING,
      description: "For LET_THEM, a gentle reframing. For LET_ME, the core goal."
    },
    stoicQuote: {
      type: Type.STRING,
      description: "A short profound Stoic-style insight (max 15 words)."
    },
    subTasks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "For LET_ME, 1-3 micro-tasks (15 mins each). Empty for LET_THEM."
    },
    timeEstimate: {
      type: Type.STRING,
      description: "Total time estimate for actionable items."
    }
  },
  required: ["category", "reasoning", "stoicQuote"]
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

/**
 * Semantic Explosion: Simplified for fragment confirmation only.
 */
export const splitChaos = async (content: string, lang: Language): Promise<Partial<Thought>[]> => {
  try {
    const prompt = `Deconstruct: "${content}". 
    Split into distinct items. Keep it raw and atomic.
    Language: ${lang === 'zh' ? 'Chinese' : 'English'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: splitChaosSchema,
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: "You are a deconstruction expert. Explode messy human input into clean, distinct fragments of thought."
      }
    });

    const results = JSON.parse(response.text || "[]");
    return results.map((r: any) => ({
      content: r.text,
      status: ThoughtStatus.UNSORTED
    }));
  } catch (error) {
    console.error("Split Chaos Error:", error);
    return [{ content, status: ThoughtStatus.UNSORTED }];
  }
};

export const analyzeThought = async (
  content: string, 
  lang: Language, 
  calendarContext?: string
): Promise<AnalysisResult> => {
  try {
    const prompt = `Quick analyze: "${content}".
    ${calendarContext ? `Context: ${calendarContext}` : ""}
    Language: ${lang === 'zh' ? 'Chinese' : 'English'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: getAnalysisSchema(lang),
        thinkingConfig: { thinkingBudget: 0 },
        systemInstruction: "You are a master of Stoicism. Provide concise reframing or micro-tasks instantly."
      }
    });

    return JSON.parse(response.text || "{}") as AnalysisResult;
  } catch (error) {
    console.error("Analysis Error:", error);
    return {
      category: 'LET_ME',
      reasoning: "Action clarifies.",
      stoicQuote: "The obstacle is the way.",
      subTasks: ["First step"],
      timeEstimate: "15m"
    };
  }
};

export const analyzeChaos = async (thoughts: Thought[], lang: Language): Promise<string> => {
  if (thoughts.length === 0) return "";
  const contents = thoughts.map(t => t.content).join(" | ");
  const prompt = `Summarize mental chaos in <15 words: "${contents}". Language: ${lang === 'zh' ? 'Chinese' : 'English'}.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "";
  } catch (e) {
    return "Focus on what you control.";
  }
};
