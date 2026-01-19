import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';
import EmotionCard from '../components/EmotionCard';
import InsightCard from '../components/InsightCard';
import Disclaimer from '../components/Disclaimer';
import './Daily.css';

export default function Daily() {
    const { date } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [reflection, setReflection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReflection = async () => {
            if (!user || !date) return;

            try {
                // Fetch directly from Firestore
                const q = query(
                    collection(db, 'reflections'),
                    where('userId', '==', user.uid),
                    where('date', '==', date),
                    limit(1)
                );

                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    setError('No reflection found for this date.');
                    setLoading(false);
                    return;
                }

                const doc = snapshot.docs[0];
                setReflection({ id: doc.id, ...doc.data() });
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Unable to load reflection. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchReflection();
    }, [user, date]);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const isToday = (dateStr) => {
        return dateStr === new Date().toISOString().split('T')[0];
    };

    if (loading) {
        return (
            <div className="daily-page page-center">
                <LoadingSpinner message="Loading your reflection..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="daily-page page-center">
                <div className="error-state fade-in">
                    <span className="error-icon">📝</span>
                    <h2>No reflection found</h2>
                    <p>{error}</p>
                    <div className="error-actions">
                        <Link to="/reflect" className="btn btn-primary">
                            Write a reflection
                        </Link>
                        <button className="btn btn-secondary" onClick={() => navigate('/home')}>
                            Go home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="daily-page">
            <div className="container container-narrow">
                <header className="daily-header fade-in">
                    <button className="back-button" onClick={() => navigate('/home')}>
                        ← Back
                    </button>
                    <div className="header-content">
                        <span className="header-badge">
                            {isToday(date) ? "Today's Reflection" : 'Past Reflection'}
                        </span>
                        <h1>{formatDate(date)}</h1>
                    </div>
                </header>

                <div className="daily-content">
                    {/* Emotions Section */}
                    <section className="emotions-section slide-up">
                        <h2 className="section-title">Emotional State</h2>
                        <div className="emotions-grid">
                            <div className="emotion-item">
                                <span className="emotion-label">Primary</span>
                                <EmotionCard
                                    emotion={reflection.primaryEmotion}
                                    intensity={reflection.emotionalIntensity}
                                />
                            </div>
                            {reflection.secondaryEmotion && reflection.secondaryEmotion !== 'null' && (
                                <div className="emotion-item">
                                    <span className="emotion-label">Secondary</span>
                                    <EmotionCard
                                        emotion={reflection.secondaryEmotion}
                                        isSecondary
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Theme & Intensity */}
                    <section className="details-section slide-up">
                        <div className="detail-card">
                            <span className="detail-icon">🎯</span>
                            <div className="detail-content">
                                <span className="detail-label">Theme</span>
                                <span className="detail-value">{reflection.theme}</span>
                            </div>
                        </div>
                        <div className="detail-card">
                            <span className="detail-icon">📊</span>
                            <div className="detail-content">
                                <span className="detail-label">Intensity</span>
                                <span className={`detail-value intensity-badge ${reflection.emotionalIntensity?.toLowerCase()}`}>
                                    {reflection.emotionalIntensity}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Transcript */}
                    {reflection.transcript && (
                        <section className="transcript-section slide-up">
                            <h2 className="section-title">Your Words</h2>
                            <blockquote className="transcript-block">
                                "{reflection.transcript}"
                            </blockquote>
                        </section>
                    )}

                    {/* Daily Insight */}
                    <section className="insight-section slide-up">
                        <InsightCard
                            title="Today's Insight"
                            content={reflection.dailyInsight}
                            icon="✨"
                        />
                    </section>

                    {/* Reflection Prompt */}
                    <section className="prompt-section fade-in">
                        <div className="reflection-prompt">
                            <span className="prompt-icon">🤔</span>
                            <p>What would you like to carry forward from today?</p>
                        </div>
                    </section>

                    <nav className="daily-nav fade-in">
                        <Link to="/weekly" className="nav-link">
                            View weekly patterns →
                        </Link>
                    </nav>

                    <Disclaimer variant="subtle" />
                </div>
            </div>
        </div>
    );
}
