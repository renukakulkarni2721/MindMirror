import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';

config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use a model that supports audio input
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * Sleep helper for retry delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff for rate limits
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 2000) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if it's a rate limit error (429)
            const isRateLimited = error.message?.includes('429') ||
                error.message?.includes('Too Many Requests') ||
                error.message?.includes('RESOURCE_EXHAUSTED');

            if (isRateLimited && attempt < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, attempt); // Exponential backoff
                console.log(`Rate limited. Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
                await sleep(delay);
            } else if (!isRateLimited) {
                throw error; // Non-rate-limit errors should fail immediately
            }
        }
    }

    throw lastError;
}

/**
 * Transcribe and analyze audio for daily reflection
 * @param {Buffer} audioBuffer - The audio file buffer
 * @param {string} mimeType - The MIME type of the audio
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzeAudioReflection(audioBuffer, mimeType) {
    const base64Audio = audioBuffer.toString('base64');

    const prompt = `You are a compassionate emotional awareness assistant for a reflection app called MindMirror. 
  
Listen to this audio reflection and respond ONLY with valid JSON in this exact format:
{
  "transcript": "full transcription of the audio",
  "primaryEmotion": "the main emotion expressed (e.g., joy, sadness, anxiety, gratitude, frustration, hope, calm, overwhelm)",
  "secondaryEmotion": "a secondary emotion if present, or null",
  "theme": "the main theme (work, relationships, self, health, family, creativity, growth, finances)",
  "emotionalIntensity": "low, medium, or high",
  "dailyInsight": "A gentle 2-3 sentence reflection that helps the user notice patterns without giving advice. Focus on acknowledgment and awareness. Example: 'It sounds like you're carrying a lot right now. Taking time to notice these feelings is a meaningful step.'"
}

Remember:
- Never provide medical advice, diagnosis, or therapeutic recommendations
- Keep the tone warm, supportive, and non-judgmental
- Focus on reflection and awareness, not solutions
- If the audio is unclear, do your best to transcribe what you can hear`;

    try {
        const result = await retryWithBackoff(async () => {
            return await model.generateContent([
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Audio
                    }
                },
                { text: prompt }
            ]);
        });

        const responseText = result.response.text();

        // Extract JSON from response (handle potential markdown formatting)
        let jsonStr = responseText;
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        // Clean up and parse JSON
        jsonStr = jsonStr.trim();
        const analysis = JSON.parse(jsonStr);

        return {
            success: true,
            data: analysis
        };
    } catch (error) {
        console.error('Gemini analysis error:', error);

        // Check if rate limited after all retries
        if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
            return {
                success: false,
                error: 'The AI service is temporarily busy. Please wait a moment and try again.',
                isRateLimited: true
            };
        }

        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Analyze weekly patterns from multiple reflections
 * @param {Array} reflections - Array of reflection objects from Firestore
 * @returns {Promise<Object>} - Weekly analysis results
 */
export async function analyzeWeeklyPatterns(reflections) {
    if (!reflections || reflections.length === 0) {
        return {
            success: false,
            error: 'No reflections to analyze'
        };
    }

    const reflectionsSummary = reflections.map(r => ({
        date: r.date,
        primaryEmotion: r.primaryEmotion,
        secondaryEmotion: r.secondaryEmotion,
        theme: r.theme,
        intensity: r.emotionalIntensity,
        transcript: r.transcript?.substring(0, 200) // Truncate for context
    }));

    const prompt = `You are an emotional pattern analyst for MindMirror, a reflection app focused on self-awareness.

Analyze these ${reflections.length} recent reflections and respond ONLY with valid JSON:

${JSON.stringify(reflectionsSummary, null, 2)}

Respond in this exact format:
{
  "dominantEmotions": ["emotion1", "emotion2"],
  "dominantThemes": ["theme1", "theme2"],
  "emotionalPattern": "brief description of emotional fluctuations observed",
  "weeklyInsight": "A thoughtful 2-3 sentence observation about patterns noticed this week. Focus on what the person might want to be aware of, not what they should do.",
  "reflectiveQuestion": "A single open-ended question to encourage deeper self-reflection"
}

Guidelines:
- Be descriptive, not prescriptive
- Never provide medical advice or diagnosis
- Focus on patterns and awareness
- Keep the tone gentle and supportive
- The reflective question should be thought-provoking but not intrusive`;

    try {
        const result = await retryWithBackoff(async () => {
            return await model.generateContent(prompt);
        });

        const responseText = result.response.text();

        // Extract JSON from response
        let jsonStr = responseText;
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        const analysis = JSON.parse(jsonStr.trim());

        return {
            success: true,
            data: analysis
        };
    } catch (error) {
        console.error('Weekly analysis error:', error);

        if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
            return {
                success: false,
                error: 'The AI service is temporarily busy. Please wait a moment and try again.',
                isRateLimited: true
            };
        }

        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Fallback text-based analysis when audio processing fails
 * @param {string} textInput - User's text input 
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzeTextReflection(textInput) {
    const prompt = `You are a compassionate emotional awareness assistant for MindMirror.

Analyze this reflection text and respond ONLY with valid JSON:

"${textInput}"

Format:
{
  "transcript": "${textInput}",
  "primaryEmotion": "main emotion",
  "secondaryEmotion": "secondary emotion or null",
  "theme": "main theme (work, relationships, self, health, family, creativity, growth, finances)",
  "emotionalIntensity": "low, medium, or high",
  "dailyInsight": "A gentle 2-3 sentence reflection focused on acknowledgment and awareness."
}

Remember: No medical advice, diagnosis, or therapeutic recommendations. Focus on reflection and awareness.`;

    try {
        const result = await retryWithBackoff(async () => {
            return await model.generateContent(prompt);
        });

        const responseText = result.response.text();

        let jsonStr = responseText;
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        const analysis = JSON.parse(jsonStr.trim());

        return {
            success: true,
            data: analysis
        };
    } catch (error) {
        console.error('Text analysis error:', error);

        if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
            return {
                success: false,
                error: 'The AI service is temporarily busy. Please wait a moment and try again.',
                isRateLimited: true
            };
        }

        return {
            success: false,
            error: error.message
        };
    }
}
