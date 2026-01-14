import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AudioRecorder from '../components/AudioRecorder';
import LoadingSpinner from '../components/LoadingSpinner';
import Disclaimer from '../components/Disclaimer';
import './Reflect.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Punchlines based on primary emotion
const punchlines = {
    joy: "Your joy is worth celebrating! 🎉",
    happiness: "Happiness looks good on you! ✨",
    calm: "Finding peace in the moment. 🌿",
    peace: "Serenity is a strength. 🕊️",
    sadness: "It's okay to feel this. 💙",
    anxiety: "You're facing your feelings bravely. 🌊",
    worry: "Acknowledging worry is the first step. 🌱",
    hope: "Hope is a beautiful thing to nurture. 🌅",
    frustration: "Your feelings are valid. 🔥",
    anger: "It's okay to feel strongly. 💪",
    gratitude: "Gratitude transforms perspective. 🙏",
    overwhelm: "One breath at a time. 🌬️",
    stress: "You're handling more than you know. ⭐",
    love: "Love is what connects us. 💕",
    default: "Thank you for sharing. 💭"
};

export default function Reflect() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isQuickMode = searchParams.get('mode') === 'quick';

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);
    const [showPunchline, setShowPunchline] = useState(false);

    const handleRecordingComplete = async (audioBlob, duration) => {
        setIsAnalyzing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'reflection.webm');
            formData.append('userId', user.uid);
            formData.append('date', new Date().toISOString().split('T')[0]);

            const response = await fetch(`${API_URL}/analyze-daily`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                // Check for rate limit or specific error messages
                const errorMsg = result.error || result.details || 'Analysis failed';
                if (errorMsg.includes('busy') || errorMsg.includes('rate') || errorMsg.includes('429')) {
                    throw new Error('The AI service is busy. Please wait 30 seconds and try again.');
                }
                throw new Error(errorMsg);
            }

            setAnalysisResult(result.data);

            // Show punchline first, then details
            setShowPunchline(true);

        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getPunchline = (emotion) => {
        const key = emotion?.toLowerCase() || 'default';
        return punchlines[key] || punchlines.default;
    };

    const handleViewDetails = () => {
        const today = new Date().toISOString().split('T')[0];
        navigate(`/daily/${today}`);
    };

    const handleNewReflection = () => {
        setAnalysisResult(null);
        setShowPunchline(false);
        setError(null);
    };

    if (isAnalyzing) {
        return (
            <div className="reflect-page page-center">
                <div className="analyzing-container fade-in">
                    <LoadingSpinner size="large" />
                    <h2>Listening to your reflection...</h2>
                    <p>We're processing your thoughts with care</p>
                    <div className="analyzing-steps">
                        <span className="step active">🎧 Processing audio</span>
                        <span className="step">📝 Transcribing</span>
                        <span className="step">💭 Understanding emotions</span>
                    </div>
                </div>
            </div>
        );
    }

    if (analysisResult && showPunchline) {
        return (
            <div className="reflect-page page-center">
                <div className="result-container fade-in">
                    <div className="punchline-display">
                        <span className="punchline-emoji">🪞</span>
                        <h2>{getPunchline(analysisResult.primaryEmotion)}</h2>
                    </div>

                    <div className="result-emotions">
                        <div className="emotion-badge primary">
                            {analysisResult.primaryEmotion}
                        </div>
                        {analysisResult.secondaryEmotion && (
                            <div className="emotion-badge secondary">
                                {analysisResult.secondaryEmotion}
                            </div>
                        )}
                    </div>

                    <div className="result-reassurance">
                        <p>🔒 No judgment. This is private.</p>
                    </div>

                    <p className="result-insight">{analysisResult.dailyInsight}</p>

                    <div className="result-actions">
                        <button className="btn btn-primary" onClick={handleViewDetails}>
                            View Full Analysis
                        </button>
                        <button className="btn btn-secondary" onClick={handleNewReflection}>
                            Record Another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reflect-page">
            <div className="container container-narrow">
                <header className="reflect-header fade-in">
                    <button className="back-button" onClick={() => navigate('/home')}>
                        ← Back
                    </button>
                    <h1>{isQuickMode ? 'Quick Mood Check' : "Today's Reflection"}</h1>
                    <p>
                        {isQuickMode
                            ? 'Just 30 seconds to capture how you feel'
                            : 'Take a moment to check in with yourself'}
                    </p>
                </header>

                <div className="reflect-content slide-up">
                    <div className="prompt-card">
                        <h3>💭 Reflection Prompts</h3>
                        <ul>
                            <li>How are you really feeling right now?</li>
                            <li>What's been on your mind today?</li>
                            <li>What moment stood out to you?</li>
                        </ul>
                    </div>

                    {error && (
                        <div className="error-message">
                            <span>⚠️</span> {error}
                            <button onClick={() => setError(null)}>Dismiss</button>
                        </div>
                    )}

                    <AudioRecorder
                        onRecordingComplete={handleRecordingComplete}
                        maxDuration={isQuickMode ? 45 : 60}
                        minDuration={isQuickMode ? 15 : 30}
                    />
                </div>

                <Disclaimer />
            </div>
        </div>
    );
}
