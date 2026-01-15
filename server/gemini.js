import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// TEXT-ONLY MODEL (STABLE)
const model = genAI.getGenerativeModel({
    model: "models/gemini-2.5-flash"
});

/**
 * Safe Gemini call wrapper
 */
async function callGemini(prompt) {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log("RAW GEMINI RESPONSE:\n", text);

    let jsonStr = text;

    // Strip markdown if present
    const match = text.match(/```(?:json)?([\s\S]*?)```/);
    if (match) jsonStr = match[1];

    try {
        return JSON.parse(jsonStr.trim());
    } catch (err) {
        console.error("JSON PARSE ERROR:", jsonStr);
        throw new Error("Invalid AI response format");
    }
}

/**
 * DAILY TEXT ANALYSIS
 */
export async function analyzeTextReflection(textInput) {
    const prompt = `
You are a compassionate emotional awareness assistant for a reflection app called MindMirror.

Analyze the reflection below and respond ONLY with valid JSON.

Reflection:
"${textInput}"

Return EXACTLY this format:
{
  "transcript": "${textInput}",
  "primaryEmotion": "one main emotion",
  "secondaryEmotion": "secondary emotion or null",
  "theme": "work | relationships | self | health | family | creativity | growth | finances",
  "emotionalIntensity": "low | medium | high",
  "dailyInsight": "A gentle 2–3 sentence reflection focused on awareness, not advice."
}

Rules:
- No medical advice
- No diagnosis
- No solutions
- Only reflection and awareness
`;

    try {
        const data = await callGemini(prompt);
        return { success: true, data };
    } catch (error) {
        console.error("TEXT ANALYSIS ERROR:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * WEEKLY PATTERN ANALYSIS
 */
export async function analyzeWeeklyPatterns(reflections) {
    if (!reflections || reflections.length < 3) {
        return {
            success: false,
            error: "Not enough reflections for weekly analysis"
        };
    }

    const summary = reflections.map(r => ({
        date: r.date,
        primaryEmotion: r.primaryEmotion,
        secondaryEmotion: r.secondaryEmotion,
        theme: r.theme,
        emotionalIntensity: r.emotionalIntensity
    }));

    const prompt = `
You are an emotional pattern analyst for MindMirror.

Analyze the following reflections and respond ONLY with valid JSON:

${JSON.stringify(summary, null, 2)}

Return EXACTLY:
{
  "dominantEmotions": ["emotion1", "emotion2"],
  "dominantThemes": ["theme1", "theme2"],
  "emotionalPattern": "brief description of patterns noticed",
  "weeklyInsight": "2–3 sentence reflective observation",
  "reflectiveQuestion": "one open-ended question"
}

Rules:
- Descriptive only
- No advice
- No diagnosis
- Gentle, neutral tone
`;

    try {
        const data = await callGemini(prompt);
        return { success: true, data };
    } catch (error) {
        console.error("WEEKLY ANALYSIS ERROR:", error.message);
        return { success: false, error: error.message };
    }
}
