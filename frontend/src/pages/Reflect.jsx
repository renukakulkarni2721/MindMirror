import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import LoadingSpinner from '../components/LoadingSpinner';
import VoiceRecorder from '../components/VoiceRecorder';
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
    confusion: "It's okay to not have all the answers. 🌙",
    fear: "Courage is feeling the fear anyway. 🦋",
    default: "Thank you for sharing. 💭"
};

export default function Reflect() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [inputMode, setInputMode] = useState('text'); // 'text' or 'voice'
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisStatus, setAnalysisStatus] = useState(null); // 'pending' | 'completed' | 'failed'
    const [currentReflectionId, setCurrentReflectionId] = useState(null);
    const [error, setError] = useState(null);
    const [showPunchline, setShowPunchline] = useState(false);
    const [textInput, setTextInput] = useState('');

    // Firebase real-time listener for analysis updates
    useEffect(() => {
        if (!currentReflectionId || !user) return;

        const docRef = doc(db, 'users', user.uid, 'reflections', currentReflectionId);

        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                console.log('Firebase update:', data);

                setAnalysisStatus(data.analysisStatus);

                if (data.analysisStatus === 'completed') {
                    console.log('✅ Analysis completed! Data:', data);
                    console.log('✅ Setting analysisResult with:', { id: currentReflectionId, ...data });

                    const resultData = {
                        id: currentReflectionId,
                        ...data
                    };

                    setAnalysisResult(resultData);
                    setIsAnalyzing(false);
                    setShowPunchline(true);

                    console.log('✅ State updated - isAnalyzing: false, showPunchline: true');
                    console.log('✅ analysisResult should now be:', resultData);
                } else if (data.analysisStatus === 'failed') {
                    setError('Analysis failed. Your reflection was saved, but we couldn\'t complete the emotional analysis.');
                    setIsAnalyzing(false);
                }
            }
        }, (err) => {
            console.error('Firebase listener error:', err);
        });

        return () => unsubscribe();
    }, [currentReflectionId, user]);

    const handleTextSubmit = async () => {
        if (!textInput.trim() || textInput.trim().length < 20) {
            setError('Please write at least 20 characters to express your thoughts.');
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/analyze-daily`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    userName: user.displayName || 'Anonymous',
                    userEmail: user.email,
                    date: new Date().toISOString().split('T')[0],
                    textInput: textInput.trim()
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                const errorMsg = result.error || 'Analysis failed';
                throw new Error(errorMsg);
            }

            // Use result.analysis (matches new API format)
            setAnalysisResult(result.analysis);
            setShowPunchline(true);
            setTextInput('');

        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleVoiceTranscript = async (transcript, duration) => {
        setIsSaving(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/save-transcript`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    userName: user.displayName || 'Anonymous',
                    userEmail: user.email,
                    date: new Date().toISOString().split('T')[0],
                    transcript: transcript
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                const errorMsg = result.error || 'Failed to save transcript';
                throw new Error(errorMsg);
            }

            console.log('📝 Transcript saved, reflection ID:', result.reflection.id);

            // Set reflection ID to start listening for updates
            setCurrentReflectionId(result.reflection.id);
            setIsSaving(false);
            setIsAnalyzing(true); // Show analyzing status

            // FALLBACK: Poll for completion if listener doesn't fire within 30s
            const pollInterval = setInterval(async () => {
                console.log('🔍 Polling for analysis completion...');
                const checkResponse = await fetch(`${API_URL}/reflection-by-id/${user.uid}/${result.reflection.id}`);
                if (checkResponse.ok) {
                    const checkData = await checkResponse.json();
                    if (checkData.success && checkData.found && checkData.reflection?.analysisStatus === 'completed') {
                        console.log('✅ Analysis complete (via polling)!', checkData.reflection);
                        clearInterval(pollInterval);
                        setAnalysisResult(checkData.reflection);
                        setIsAnalyzing(false);
                        setShowPunchline(true);
                    }
                }
            }, 3000); // Poll every 3 seconds

            // Clear interval after 60 seconds
            setTimeout(() => clearInterval(pollInterval), 60000);

        } catch (err) {
            console.error('Save transcript error:', err);
            setError(err.message || 'Failed to save your reflection. Please try again.');
            setIsSaving(false);
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
        setTextInput('');
        setCurrentReflectionId(null);
        setAnalysisStatus(null);
        setIsSaving(false);
        setIsAnalyzing(false);
    };

    if (isSaving) {
        return (
            <div className="reflect-page page-center">
                <div className="analyzing-container fade-in">
                    <LoadingSpinner size="large" />
                    <h2>Saving your reflection...</h2>
                    <p>Just a moment</p>
                </div>
            </div>
        );
    }

    if (isAnalyzing) {
        console.log('🔄 Rendering analyzing screen');
        return (
            <div className="reflect-page page-center">
                <div className="analyzing-container fade-in">
                    <LoadingSpinner size="large" />
                    <h2>{analysisStatus === 'pending' ? 'Analyzing your emotions...' : 'Reading your reflection...'}</h2>
                    <p>We're processing your thoughts with care</p>
                    {analysisResult && (
                        <div className="saved-indicator">
                            <span className="checkmark">✓</span>
                            <span>Transcript saved</span>
                        </div>
                    )}
                    <div className="analyzing-steps">
                        <span className={`step ${analysisStatus ? 'active' : ''}`}>📝 Processing text</span>
                        <span className={`step ${analysisStatus === 'pending' || analysisStatus === 'completed' ? 'active' : ''}`}>💭 Understanding emotions</span>
                        <span className={`step ${analysisStatus === 'completed' ? 'active' : ''}`}>✨ Generating insight</span>
                    </div>
                </div>
            </div>
        );
    }

    if (analysisResult && showPunchline) {
        console.log('🎉 Rendering results screen with:', { analysisResult, showPunchline });
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
                        {analysisResult.secondaryEmotion && analysisResult.secondaryEmotion !== 'null' && (
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
                            Write Another
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
                    <h1>Today's Reflection</h1>
                    <p>Take a moment to check in with yourself</p>
                </header>

                <div className="reflect-content slide-up">
                    {/* Input Mode Toggle */}
                    <div className="input-mode-toggle">
                        <button
                            className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
                            onClick={() => setInputMode('text')}
                        >
                            ✍️ Write
                        </button>
                        <button
                            className={`mode-btn ${inputMode === 'voice' ? 'active' : ''}`}
                            onClick={() => setInputMode('voice')}
                        >
                            🎙️ Speak
                        </button>
                    </div>

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

                    {inputMode === 'text' ? (
                        <div className="text-input-section">
                            <textarea
                                className="reflection-textarea"
                                placeholder="Write your thoughts here... How are you feeling today? What's on your mind?"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                rows={6}
                                maxLength={2000}
                            />
                            <div className="text-input-footer">
                                <span className="char-count">{textInput.length} / 2000</span>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleTextSubmit}
                                    disabled={textInput.trim().length < 20}
                                >
                                    Submit Reflection
                                </button>
                            </div>
                            <p className="text-hint">Minimum 20 characters to submit</p>
                        </div>
                    ) : (
                        <div className="voice-input-section">
                            <VoiceRecorder onTranscriptReady={handleVoiceTranscript} />
                        </div>
                    )}
                </div>

                <Disclaimer />
            </div>
        </div>
    );
}
