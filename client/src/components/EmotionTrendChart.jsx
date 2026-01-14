import './EmotionTrendChart.css';

const emotionColors = {
    joy: '#F4D06F',
    happiness: '#F4D06F',
    calm: '#7FBFBA',
    peace: '#7FBFBA',
    sadness: '#89A7C2',
    anxiety: '#D4A574',
    worry: '#D4A574',
    hope: '#A8D5BA',
    frustration: '#D98880',
    anger: '#D98880',
    gratitude: '#E8B4A0',
    overwhelm: '#9CA3AF',
    stress: '#9CA3AF',
    love: '#F9A8D4',
    contentment: '#A8D5BA'
};

const intensityHeight = {
    low: 30,
    medium: 60,
    high: 90
};

export default function EmotionTrendChart({ reflections = [] }) {
    if (!reflections || reflections.length === 0) {
        return (
            <div className="emotion-chart-empty">
                <span className="empty-icon">📊</span>
                <p>No reflections yet to show trends</p>
            </div>
        );
    }

    // Sort by date ascending
    const sortedReflections = [...reflections].sort((a, b) =>
        new Date(a.date) - new Date(b.date)
    );

    const maxHeight = 100;

    return (
        <div className="emotion-chart">
            <div className="chart-container">
                <div className="chart-bars">
                    {sortedReflections.map((reflection, index) => {
                        const emotion = reflection.primaryEmotion?.toLowerCase() || 'unknown';
                        const intensity = reflection.emotionalIntensity?.toLowerCase() || 'medium';
                        const color = emotionColors[emotion] || '#9CA3AF';
                        const height = intensityHeight[intensity] || 60;

                        const date = new Date(reflection.date);
                        const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
                        const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                        return (
                            <div key={reflection.id || index} className="chart-bar-wrapper">
                                <div className="chart-bar-container">
                                    <div
                                        className="chart-bar"
                                        style={{
                                            height: `${height}%`,
                                            backgroundColor: color
                                        }}
                                        title={`${reflection.primaryEmotion} (${intensity})`}
                                    >
                                        <span className="bar-emotion">{reflection.primaryEmotion}</span>
                                    </div>
                                </div>
                                <div className="chart-label">
                                    <span className="day-label">{dayLabel}</span>
                                    <span className="date-label">{dateLabel}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="chart-y-axis">
                    <span>High</span>
                    <span>Med</span>
                    <span>Low</span>
                </div>
            </div>

            <div className="chart-legend">
                <div className="legend-item">
                    <span className="legend-bar" style={{ height: '30%' }}></span>
                    <span>Low</span>
                </div>
                <div className="legend-item">
                    <span className="legend-bar" style={{ height: '60%' }}></span>
                    <span>Medium</span>
                </div>
                <div className="legend-item">
                    <span className="legend-bar" style={{ height: '90%' }}></span>
                    <span>High</span>
                </div>
            </div>
        </div>
    );
}
