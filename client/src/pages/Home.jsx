import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmotionCard from '../components/EmotionCard';
import './Home.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Home() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [todayReflection, setTodayReflection] = useState(null);
    const [weeklyData, setWeeklyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { text: 'Good morning', emoji: '🌅' };
        if (hour < 17) return { text: 'Good afternoon', emoji: '☀️' };
        return { text: 'Good evening', emoji: '🌙' };
    };

    const greeting = getGreeting();
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                // Fetch today's reflection
                const todayRes = await fetch(`${API_URL}/reflection/${user.uid}/${today}`);
                if (todayRes.ok) {
                    const data = await todayRes.json();
                    setTodayReflection(data.reflection);
                }

                // Fetch weekly summary
                const weeklyRes = await fetch(`${API_URL}/analyze-weekly`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.uid })
                });
                if (weeklyRes.ok) {
                    const data = await weeklyRes.json();
                    setWeeklyData(data);
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setError('Unable to load your data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, today]);

    if (loading) {
        return (
            <div className="home-page page-center">
                <LoadingSpinner message="Loading your space..." />
            </div>
        );
    }

    const userName = user?.displayName?.split(' ')[0] || 'there';

    return (
        <div className="home-page">
            <div className="container container-narrow">
                {/* Header */}
                <header className="home-header fade-in">
                    <div className="greeting">
                        <span className="greeting-emoji">{greeting.emoji}</span>
                        <div>
                            <h1>{greeting.text}, {userName}</h1>
                            <p className="greeting-date">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                    <Link to="/profile" className="profile-link">
                        <div className="avatar">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Profile" />
                            ) : (
                                <span>{userName[0]?.toUpperCase()}</span>
                            )}
                        </div>
                    </Link>
                </header>

                {/* Error State */}
                {error && (
                    <div className="error-banner">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Primary Actions */}
                <section className="primary-actions slide-up">
                    <Link to="/reflect" className="action-card action-primary">
                        <span className="action-icon">🎙️</span>
                        <div className="action-content">
                            <h3>Record today's reflection</h3>
                            <p>Take a moment to check in with yourself</p>
                        </div>
                        <span className="action-arrow">→</span>
                    </Link>

                    <Link to="/reflect?mode=quick" className="action-card action-secondary">
                        <span className="action-icon">⚡</span>
                        <div className="action-content">
                            <h3>Quick mood check</h3>
                            <p>Just 30 seconds to log how you feel</p>
                        </div>
                        <span className="action-arrow">→</span>
                    </Link>
                </section>

                {/* Today's Reflection Preview */}
                <section className="preview-section fade-in">
                    <h2 className="section-title">Today's Reflection</h2>
                    {todayReflection ? (
                        <Link to={`/daily/${today}`} className="preview-card">
                            <div className="preview-emotions">
                                <EmotionCard
                                    emotion={todayReflection.primaryEmotion}
                                    intensity={todayReflection.emotionalIntensity}
                                />
                                {todayReflection.secondaryEmotion && (
                                    <EmotionCard
                                        emotion={todayReflection.secondaryEmotion}
                                        isSecondary
                                    />
                                )}
                            </div>
                            <p className="preview-insight">{todayReflection.dailyInsight}</p>
                            <span className="preview-link">View full analysis →</span>
                        </Link>
                    ) : (
                        <div className="preview-empty">
                            <span className="empty-icon">📝</span>
                            <p>No reflection yet today</p>
                            <Link to="/reflect" className="btn btn-primary">
                                Start reflecting
                            </Link>
                        </div>
                    )}
                </section>

                {/* Weekly Summary Preview */}
                <section className="preview-section fade-in">
                    <h2 className="section-title">Weekly Patterns</h2>
                    {weeklyData?.hasEnoughData ? (
                        <Link to="/weekly" className="preview-card">
                            <div className="weekly-preview">
                                <div className="weekly-stat">
                                    <span className="stat-label">Dominant Emotions</span>
                                    <span className="stat-value">
                                        {weeklyData.data?.dominantEmotions?.slice(0, 2).join(', ') || 'Analyzing...'}
                                    </span>
                                </div>
                                <div className="weekly-stat">
                                    <span className="stat-label">Key Themes</span>
                                    <span className="stat-value">
                                        {weeklyData.data?.dominantThemes?.slice(0, 2).join(', ') || 'Analyzing...'}
                                    </span>
                                </div>
                            </div>
                            <span className="preview-link">View weekly insights →</span>
                        </Link>
                    ) : (
                        <div className="preview-empty">
                            <span className="empty-icon">📊</span>
                            <p>
                                {weeklyData?.message || 'Record at least 3 reflections to see patterns'}
                            </p>
                            <span className="progress-text">
                                {weeklyData?.reflectionCount || 0} / 3 reflections
                            </span>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
