import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import './APIUsage.css';

// Gemini free tier limits (approximate)
const FREE_TIER_DAILY_LIMIT = 1500;
const FREE_TIER_MONTHLY_LIMIT = 50000;

export default function APIUsage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [apiLogs, setApiLogs] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [stats, setStats] = useState({});
    const [apiUsage, setApiUsage] = useState({ byDate: {}, byType: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        const userRef = doc(db, 'users', user.uid);

        // Try Firestore listener first
        const unsubscribe = onSnapshot(
            userRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setTotalCount(data.apiRequestCount || 0);
                    const logs = data.apiLogs || [];
                    setApiLogs(logs);
                    setApiUsage(data.apiUsage || { byDate: {}, byType: {} });

                    // Calculate stats from logs
                    const operationCounts = {};
                    logs.forEach(log => {
                        operationCounts[log.operation] = (operationCounts[log.operation] || 0) + 1;
                    });
                    setStats(operationCounts);
                } else {
                    // Document doesn't exist yet - show empty state
                    setTotalCount(0);
                    setApiLogs([]);
                    setApiUsage({ byDate: {}, byType: {} });
                }
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Firestore listener error:', err);
                // Firestore permissions failed - try API fallback
                fetchViaAPI();
            }
        );

        return () => unsubscribe();
    }, [user, navigate]);

    // Fallback: Fetch via backend API when Firestore direct access fails
    const fetchViaAPI = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/user-stats/${user.uid}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setTotalCount(data.stats?.apiRequestCount || 0);
                    setApiLogs(data.stats?.apiLogs || []);
                    setApiUsage(data.stats?.apiUsage || { byDate: {}, byType: {} });
                    setError(null);
                }
            } else {
                setError('Unable to load API usage data');
            }
        } catch (err) {
            console.error('API fetch error:', err);
            setError('Unable to load API usage data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Get today's usage
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = apiUsage.byDate?.[today] || 0;
    const usagePercent = Math.min((todayUsage / FREE_TIER_DAILY_LIMIT) * 100, 100);
    const isWarning = usagePercent >= 80;
    const isDanger = usagePercent >= 95;

    // Get last 7 days of usage
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            days.push({
                date: dateStr,
                label: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
                count: apiUsage.byDate?.[dateStr] || 0
            });
        }
        return days;
    };

    const last7Days = getLast7Days();
    const maxDailyCount = Math.max(...last7Days.map(d => d.count), 1);

    if (loading) {
        return (
            <div className="api-usage-page page-center">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="api-usage-page">
            <div className="container container-narrow">
                <header className="page-header">
                    <button className="back-button" onClick={() => navigate('/home')}>
                        ← Back
                    </button>
                    <h1>API Usage Dashboard</h1>
                    <p>Track your Gemini API requests</p>
                </header>

                {/* Usage Warning */}
                {isWarning && (
                    <div className={`usage-warning ${isDanger ? 'danger' : 'warning'}`}>
                        <span className="warning-icon">{isDanger ? '🚨' : '⚠️'}</span>
                        <div className="warning-content">
                            <strong>{isDanger ? 'Critical Usage!' : 'High Usage Today'}</strong>
                            <p>You've used {todayUsage} of {FREE_TIER_DAILY_LIMIT} daily requests ({usagePercent.toFixed(0)}%)</p>
                        </div>
                    </div>
                )}

                {/* Main Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card total">
                        <div className="stat-icon">🔢</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Requests</div>
                            <div className="stat-value">{totalCount}</div>
                        </div>
                    </div>

                    <div className="stat-card today">
                        <div className="stat-icon">📅</div>
                        <div className="stat-content">
                            <div className="stat-label">Today</div>
                            <div className="stat-value">{todayUsage}</div>
                        </div>
                    </div>

                    {/* Type-based stats */}
                    <div className="stat-card">
                        <div className="stat-icon">📝</div>
                        <div className="stat-content">
                            <div className="stat-label">Text Analysis</div>
                            <div className="stat-value">{apiUsage.byType?.text || 0}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">🎙️</div>
                        <div className="stat-content">
                            <div className="stat-label">Voice Analysis</div>
                            <div className="stat-value">{apiUsage.byType?.voice || 0}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <div className="stat-label">Weekly Analysis</div>
                            <div className="stat-value">{apiUsage.byType?.weekly || 0}</div>
                        </div>
                    </div>
                </div>

                {/* Daily Usage Bar Chart */}
                <div className="usage-chart-section">
                    <h2>Last 7 Days</h2>
                    <div className="daily-chart">
                        {last7Days.map((day) => (
                            <div key={day.date} className="chart-bar-container">
                                <div className="chart-bar-wrapper">
                                    <div
                                        className="chart-bar"
                                        style={{ height: `${(day.count / maxDailyCount) * 100}%` }}
                                    >
                                        <span className="chart-bar-value">{day.count}</span>
                                    </div>
                                </div>
                                <span className="chart-label">{day.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Free Tier Info */}
                <div className="tier-info">
                    <h3>💡 Free Tier Limits</h3>
                    <p>Gemini API free tier allows approximately {FREE_TIER_DAILY_LIMIT.toLocaleString()} requests/day.</p>
                    <div className="tier-progress">
                        <div className="tier-progress-bar">
                            <div
                                className={`tier-progress-fill ${isWarning ? (isDanger ? 'danger' : 'warning') : ''}`}
                                style={{ width: `${usagePercent}%` }}
                            ></div>
                        </div>
                        <span className="tier-progress-text">{usagePercent.toFixed(1)}% of daily limit</span>
                    </div>
                </div>

                {/* Request History */}
                <div className="logs-section">
                    <h2>Recent Requests</h2>
                    {apiLogs.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">📭</span>
                            <p>No API requests yet</p>
                            <p className="empty-hint">Create a reflection to see your usage here</p>
                        </div>
                    ) : (
                        <div className="logs-list">
                            {apiLogs.slice().reverse().slice(0, 20).map((log, index) => (
                                <div key={index} className="log-item">
                                    <div className="log-header">
                                        <span className="log-operation">
                                            {log.operation === 'text-analysis' && '📝 Text Analysis'}
                                            {log.operation === 'voice-analysis' && '🎙️ Voice Analysis'}
                                            {log.operation === 'weekly-analysis' && '📊 Weekly Analysis'}
                                            {!['text-analysis', 'voice-analysis', 'weekly-analysis'].includes(log.operation) && `🔧 ${log.operation}`}
                                        </span>
                                        <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                                    </div>
                                    {log.details && (
                                        <div className="log-details">
                                            <span className="detail-badge">{log.details}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

