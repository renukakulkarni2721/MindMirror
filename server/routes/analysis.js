import express from "express";
import { db } from "../firebase-admin.js";
import { analyzeTextReflection, analyzeWeeklyPatterns } from "../gemini.js";

const router = express.Router();

/**
 * POST /api/analyze-daily
 * TEXT-ONLY daily analysis (audio disabled for stability)
 */
router.post("/analyze-daily", async (req, res) => {
    try {
        const { userId, date, textInput } = req.body;

        console.log("REQ BODY:", req.body);

        if (!userId || !textInput) {
            return res.status(400).json({
                success: false,
                error: "userId and textInput are required"
            });
        }

        const dateStr = date || new Date().toISOString().split("T")[0];

        const analysis = await analyzeTextReflection(textInput);

        if (!analysis.success) {
            return res.status(500).json({
                success: false,
                error: analysis.error
            });
        }

        const reflectionData = {
            userId,
            date: dateStr,
            transcript: analysis.data.transcript,
            primaryEmotion: analysis.data.primaryEmotion,
            secondaryEmotion: analysis.data.secondaryEmotion,
            theme: analysis.data.theme,
            emotionalIntensity: analysis.data.emotionalIntensity,
            dailyInsight: analysis.data.dailyInsight,
            createdAt: new Date()
        };

        const docRef = await db.collection("reflections").add(reflectionData);

        return res.json({
            success: true,
            analysis: {
                id: docRef.id,
                ...reflectionData
            }
        });
    } catch (error) {
        console.error("DAILY ANALYSIS ROUTE ERROR:", error);
        res.status(500).json({
            success: false,
            error: "Failed to analyze reflection"
        });
    }
});

/**
 * POST /api/analyze-weekly
 */
router.post("/analyze-weekly", async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: "User ID is required"
            });
        }

        const snapshot = await db
            .collection("reflections")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(7)
            .get();

        if (snapshot.empty) {
            return res.json({
                success: true,
                hasEnoughData: false,
                message: "Not enough reflections"
            });
        }

        const reflections = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (reflections.length < 3) {
            return res.json({
                success: true,
                hasEnoughData: false,
                reflectionCount: reflections.length
            });
        }

        const analysis = await analyzeWeeklyPatterns(reflections);

        if (!analysis.success) {
            return res.status(500).json({
                success: false,
                error: analysis.error
            });
        }

        return res.json({
            success: true,
            hasEnoughData: true,
            reflectionCount: reflections.length,
            analysis: analysis.data
        });
    } catch (error) {
        console.error("WEEKLY ANALYSIS ROUTE ERROR:", error);
        res.status(500).json({
            success: false,
            error: "Weekly analysis failed"
        });
    }
});

export default router;
