
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Weight, Language, Thought } from "../types";

// Always initialize GoogleGenAI with a named parameter for apiKey using process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getAnalysisSchema = (lang: Language) => ({
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      enum: ["LET_THEM", "LET_ME"],
      description: "Classify if this is something outside user control (LET_THEM) or an actionable task (LET_ME)."
    },
    weight: {
      type: Type.STRING,
      enum: ["URGENT", "IMPORTANT", "CASUAL"],
      description: "Priority weight."
    },
    reasoning: {
      type: Type.STRING,
      description: `Explain why taking action on this will improve the user's mental health or reduce stress in ${lang === 'zh' ? 'Chinese' : 'English'}.`
    },
    reframing: {
      type: Type.STRING,
      description: `For LET_THEM, provide a wise, calming reframing of the worry to help the user find peace (max 15 words). In ${lang === 'zh' ? 'Chinese' : 'English'}.`
    }
  },
  required: ["category", "reasoning"]
});

export const analyzeThought = async (
  content: string, 
  lang: Language, 
  calendarContext?: string
): Promise<AnalysisResult> => {
  try {
    const contextPrompt = calendarContext 
      ? `\nUSER CALENDAR CONTEXT: ${calendarContext}`
      : "";

    const prompt = `Analyze this thought for a therapeutic mental health app: "${content}". 
    Dichotomy of Control: Is it actionable (LET_ME) or a worry/emotion to be accepted (LET_THEM)?
    ${contextPrompt}
    Focus on WHY this classification helps the user's mental state.
    Respond in JSON.`;

    // Directly calling ai.models.generateContent with model name and prompt.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: getAnalysisSchema(lang),
        systemInstruction: lang === 'zh' 
          ? "你是一位深谙心理学与斯多葛哲学的导师。你的目标是帮助用户建立心理韧性。对于“行动项”，强调完成它对心理健康的积极影响；对于“接受项”，提供温柔且深刻的转念建议。"
          : "You are a mentor in psychology and Stoic philosophy. Your goal is to build the user's mental resilience. For actions, emphasize the positive impact on mental health once completed. For acceptance, provide gentle and profound reframing suggestions."
      }
    });

    // Access the text property directly on the response object.
    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Graceful fallback for API errors.
    return {
      category: 'LET_ME',
      weight: Weight.CASUAL,
      reasoning: "Action leads to clarity.",
      reframing: "Stillness is strength."
    };
  }
};

export const analyzeChaos = async (thoughts: Thought[], lang: Language): Promise<string> => {
  if (thoughts.length === 0) return "";
  
  const contents = thoughts.map(t => t.content).join(" | ");
  const prompt = `Here is a list of a user's current worries and tasks: "${contents}". 
  Provide a single, short, profound Stoic insight (max 20 words) that summarizes the "vibe" of this chaos and encourages the user to breathe and sort them. 
  Respond in ${lang === 'zh' ? 'Chinese' : 'English'}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are Marcus Aurelius. Be brief, wise, and grounding."
      }
    });
    // Access the text property directly.
    return response.text || "";
  } catch (e) {
    console.error("Gemini Chaos Analysis Error:", e);
    return "";
  }
};
