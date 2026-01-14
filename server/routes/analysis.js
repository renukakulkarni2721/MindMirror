import express from 'express';
import multer from 'multer';
import { db } from '../firebase-admin.js';
import { analyzeAudioReflection, analyzeWeeklyPatterns, analyzeTextReflection } from '../gemini.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

/**
 * POST /api/analyze-daily
 * Analyze audio/text reflection and save transcript to Firestore
 * Audio is processed in-memory only (not stored)
 */
router.post('/analyze-daily', upload.single('audio'), async (req, res) => {
    try {
        const { userId, date, textInput } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const dateStr = date || new Date().toISOString().split('T')[0];
        let analysis;

        // Analyze audio if provided (in-memory only, not stored)
        if (req.file) {
            analysis = await analyzeAudioReflection(req.file.buffer, req.file.mimetype);
        } else if (textInput) {
            // Fallback to text analysis
            analysis = await analyzeTextReflection(textInput);
        } else {
            return res.status(400).json({ error: 'Audio file or text input required' });
        }

        if (!analysis.success) {
            return res.status(500).json({ error: 'Analysis failed', details: analysis.error });
        }

        // Save to Firestore (transcript only, no audio URL)
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

        const docRef = await db.collection('reflections').add(reflectionData);

        res.json({
            success: true,
            id: docRef.id,
            data: reflectionData
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze reflection', details: error.message });
    }
});

/**
 * GET /api/reflections/:userId
 * Get all reflections for a user
 */
router.get('/reflections/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 7 } = req.query;

        const snapshot = await db.collection('reflections')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(parseInt(limit))
            .get();

        const reflections = [];
        snapshot.forEach(doc => {
            reflections.push({ id: doc.id, ...doc.data() });
        });

        res.json({ success: true, reflections });

    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch reflections', details: error.message });
    }
});

/**
 * GET /api/reflection/:userId/:date
 * Get reflection for a specific date
 */
router.get('/reflection/:userId/:date', async (req, res) => {
    try {
        const { userId, date } = req.params;

        const snapshot = await db.collection('reflections')
            .where('userId', '==', userId)
            .where('date', '==', date)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Reflection not found' });
        }

        const doc = snapshot.docs[0];
        res.json({ success: true, reflection: { id: doc.id, ...doc.data() } });

    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch reflection', details: error.message });
    }
});

/**
 * POST /api/analyze-weekly
 * Analyze patterns from recent reflections
 */
router.post('/analyze-weekly', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Fetch last 7 reflections
        const snapshot = await db.collection('reflections')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(7)
            .get();

        if (snapshot.empty) {
            return res.json({
                success: true,
                hasEnoughData: false,
                message: 'Not enough reflections for weekly analysis'
            });
        }

        const reflections = [];
        snapshot.forEach(doc => {
            reflections.push({ id: doc.id, ...doc.data() });
        });

        // Need at least 3 reflections for meaningful analysis
        if (reflections.length < 3) {
            return res.json({
                success: true,
                hasEnoughData: false,
                message: `Need at least 3 reflections for analysis. Currently have ${reflections.length}.`,
                reflectionCount: reflections.length
            });
        }

        const analysis = await analyzeWeeklyPatterns(reflections);

        if (!analysis.success) {
            return res.status(500).json({ error: 'Weekly analysis failed', details: analysis.error });
        }

        res.json({
            success: true,
            hasEnoughData: true,
            reflectionCount: reflections.length,
            data: analysis.data,
            reflections: reflections.map(r => ({
                date: r.date,
                primaryEmotion: r.primaryEmotion,
                emotionalIntensity: r.emotionalIntensity,
                theme: r.theme
            }))
        });

    } catch (error) {
        console.error('Weekly analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze weekly patterns', details: error.message });
    }
});

/**
 * DELETE /api/reflection/:id
 * Delete a reflection
 */
router.delete('/reflection/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        // Verify ownership
        const doc = await db.collection('reflections').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Reflection not found' });
        }

        if (doc.data().userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await db.collection('reflections').doc(id).delete();

        res.json({ success: true, message: 'Reflection deleted' });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete reflection', details: error.message });
    }
});

export default router;
