import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmotionTrendChart from '../components/EmotionTrendChart';
import InsightCard from '../components/InsightCard';
import Disclaimer from '../components/Disclaimer';
import './Weekly.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Weekly() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [weeklyData, setWeeklyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWeeklyData = async () => {
            if (!user) return;

            try {
                const response = await fetch(`${API_URL}/analyze-weekly`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.uid })
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch weekly analysis');
                }

                const data = await response.json();
                setWeeklyData(data);
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Unable to load weekly analysis. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchWeeklyData();
    }, [user]);

    if (loading) {
        return (
            <div className="weekly-page page-center">
                <LoadingSpinner message="Analyzing your patterns..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="weekly-page page-center">
                <div className="error-state fade-in">
                    <span className="error-icon">📊</span>
                    <h2>Unable to load analysis</h2>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    if (!weeklyData?.hasEnoughData) {
        return (
            <div className="weekly-page page-center">
                <div className="empty-state fade-in">
                    <span className="empty-icon">📊</span>
                    <h2>Building Your Patterns</h2>
                    <p>{weeklyData?.message}</p>
                    <div className="progress-indicator">
                        <div
                            className="progress-fill"
                            style={{ width: `${((weeklyData?.reflectionCount || 0) / 3) * 100}%` }}
                        ></div>
                    </div>
                    <span className="progress-text">
                        {weeklyData?.reflectionCount || 0} of 3 reflections needed
                    </span>
                    <Link to="/reflect" className="btn btn-primary">
                        Record a reflection
                    </Link>
                </div>
            </div>
        );
    }

    const { data, reflections } = weeklyData;

    return (
        <div className="weekly-page">
            <div className="container container-narrow">
                <header className="weekly-header fade-in">
                    <button className="back-button" onClick={() => navigate('/home')}>
                        ← Back
                    </button>
                    <div className="header-content">
                        <span className="header-badge">Weekly Patterns</span>
                        <h1>Your Week in Reflection</h1>
                        <p>Based on {weeklyData.reflectionCount} reflections</p>
                    </div>
                </header>

                <div className="weekly-content">
                    {/* Emotion Trend Chart */}
                    <section className="chart-section slide-up">
                        <h2 className="section-title">Emotional Journey</h2>
                        <EmotionTrendChart reflections={reflections} />
                    </section>

                    {/* Dominant Patterns */}
                    <section className="patterns-section slide-up">
                        <div className="pattern-card">
                            <h3>💭 Dominant Emotions</h3>
                            <div className="pattern-tags">
                                {data.dominantEmotions?.map((emotion, index) => (
                                    <span key={index} className="pattern-tag emotion-tag">
                                        {emotion}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="pattern-card">
                            <h3>🎯 Key Themes</h3>
                            <div className="pattern-tags">
                                {data.dominantThemes?.map((theme, index) => (
                                    <span key={index} className="pattern-tag theme-tag">
                                        {theme}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Emotional Pattern Description */}
                    {data.emotionalPattern && (
                        <section className="pattern-description slide-up">
                            <div className="description-card">
                                <span className="description-icon">🌊</span>
                                <div>
                                    <h3>Emotional Flow</h3>
                                    <p>{data.emotionalPattern}</p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Weekly Insight */}
                    <section className="insight-section slide-up">
                        <InsightCard
                            title="Weekly Insight"
                            content={data.weeklyInsight}
                            question={data.reflectiveQuestion}
                            icon="🔮"
                        />
                    </section>

                    {/* Past Reflections */}
                    <section className="reflections-list slide-up">
                        <h2 className="section-title">This Week's Reflections</h2>
                        <div className="reflections-grid">
                            {reflections?.map((reflection, index) => (
                                <Link
                                    key={reflection.id || index}
                                    to={`/daily/${reflection.date}`}
                                    className="reflection-item"
                                >
                                    <span className="reflection-date">
                                        {new Date(reflection.date).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </span>
                                    <span className="reflection-emotion">{reflection.primaryEmotion}</span>
                                    <span className="reflection-arrow">→</span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <Disclaimer variant="subtle" />
                </div>
            </div>
        </div>
    );
}
