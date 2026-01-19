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
    const [recentReflections, setRecentReflections] = useState([]);
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
                const todayRes = await fetch(`${API_URL}/today-reflection/${user.uid}`);
                if (todayRes.ok) {
                    const todayData = await todayRes.json();
                    if (todayData.success && todayData.hasReflection) {
                        setTodayReflection(todayData.reflection);
                    }
                }

                // Fetch recent reflections (last 7)
                const reflectionsRes = await fetch(`${API_URL}/reflections/${user.uid}?limit=7`);
                if (reflectionsRes.ok) {
                    const reflectionsData = await reflectionsRes.json();
                    if (reflectionsData.success) {
                        setRecentReflections(reflectionsData.reflections || []);
                    }
                }

                // Fetch weekly summary only if we have enough data
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
                setError(`Error: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, today]);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[date.getMonth()]} ${date.getDate()}`;
    };

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
                        <span className="action-icon">✍️</span>
                        <div className="action-content">
                            <h3>Write today's reflection</h3>
                            <p>Take a moment to check in with yourself</p>
                        </div>
                        <span className="action-arrow">→</span>
                    </Link>
                    <Link to="/api-usage" className="action-card action-secondary">
                        <span className="action-icon">📊</span>
                        <div className="action-content">
                            <h3>API Usage</h3>
                            <p>Track your Gemini API requests</p>
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
                                {todayReflection.secondaryEmotion && todayReflection.secondaryEmotion !== 'null' && (
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

                {/* Recent Reflections List */}
                {recentReflections.length > 0 && (
                    <section className="preview-section fade-in">
                        <h2 className="section-title">Recent Reflections</h2>
                        <div className="reflections-list">
                            {recentReflections.map((reflection) => (
                                <Link
                                    key={reflection.id}
                                    to={`/daily/${reflection.date}`}
                                    className="reflection-list-item"
                                >
                                    <div className="reflection-date">
                                        {formatDate(reflection.date)}
                                    </div>
                                    <div className="reflection-emotion">
                                        {reflection.primaryEmotion ||
                                            (reflection.transcript?.substring(0, 30) + '...') ||
                                            'Processing...'}
                                    </div>
                                    <div className="reflection-type">
                                        {reflection.inputType || 'text'}
                                    </div>
                                    <span className="reflection-arrow">→</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Weekly Insight Status */}
                <section className="preview-section fade-in">
                    <h2 className="section-title">Weekly Insights</h2>
                    {weeklyData?.hasEnoughData ? (
                        <Link to="/weekly" className="preview-card">
                            <div className="weekly-preview">
                                <p className="weekly-summary">
                                    {weeklyData.analysis?.emotionalPattern ||
                                        'Your weekly patterns are ready to explore'}
                                </p>
                                <div className="weekly-stats-mini">
                                    <span className="stat-pill">
                                        {weeklyData.analysis?.dominantEmotions?.[0] || 'Emotion'}
                                    </span>
                                    <span className="stat-pill">
                                        {weeklyData.analysis?.dominantThemes?.[0] || 'Theme'}
                                    </span>
                                </div>
                            </div>
                            <span className="preview-link">View weekly summary →</span>
                        </Link>
                    ) : (
                        <div className="preview-empty">
                            <span className="empty-icon">📊</span>
                            <p className="insight-explainer">
                                Your weekly insights will appear once you've shared a few reflections
                            </p>
                            <div className="progress-indicator">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${((weeklyData?.reflectionCount || 0) / 3) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="progress-text">
                                    {weeklyData?.reflectionCount || 0} of 3 reflections recorded
                                </span>
                            </div>
                        </div>
                    )}
                </section>

                {/* Microcopy / Explanation */}
                <section className="info-card fade-in">
                    <p className="subtle-info">
                        MindMirror builds weekly insights based on your recent reflections
                    </p>
                </section>
            </div>
        </div>
    );
}
