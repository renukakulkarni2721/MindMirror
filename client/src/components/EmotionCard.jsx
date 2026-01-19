import './EmotionCard.css';

const emotionColors = {
    joy: { bg: '#fef3c7', color: '#92400e', emoji: '😊' },
    happiness: { bg: '#fef3c7', color: '#92400e', emoji: '😄' },
    calm: { bg: '#d1fae5', color: '#065f46', emoji: '😌' },
    peace: { bg: '#d1fae5', color: '#065f46', emoji: '✨' },
    sadness: { bg: '#dbeafe', color: '#1e40af', emoji: '😢' },
    anxiety: { bg: '#fed7aa', color: '#9a3412', emoji: '😰' },
    worry: { bg: '#fed7aa', color: '#9a3412', emoji: '😟' },
    hope: { bg: '#d1fae5', color: '#047857', emoji: '🌱' },
    frustration: { bg: '#fee2e2', color: '#991b1b', emoji: '😤' },
    anger: { bg: '#fee2e2', color: '#991b1b', emoji: '😠' },
    gratitude: { bg: '#fce7f3', color: '#9d174d', emoji: '🙏' },
    overwhelm: { bg: '#e5e7eb', color: '#374151', emoji: '😵' },
    stress: { bg: '#e5e7eb', color: '#374151', emoji: '😓' },
    love: { bg: '#fce7f3', color: '#9d174d', emoji: '💕' },
    excitement: { bg: '#fef3c7', color: '#92400e', emoji: '🎉' },
    fear: { bg: '#e5e7eb', color: '#374151', emoji: '😨' },
    confusion: { bg: '#e5e7eb', color: '#374151', emoji: '😕' },
    contentment: { bg: '#d1fae5', color: '#065f46', emoji: '☺️' },
    loneliness: { bg: '#dbeafe', color: '#1e40af', emoji: '🥺' },
    relief: { bg: '#d1fae5', color: '#047857', emoji: '😮‍💨' }
};

const defaultColor = { bg: '#f3f4f6', color: '#374151', emoji: '💭' };

export default function EmotionCard({ emotion, intensity, isSecondary = false }) {
    const emotionKey = emotion?.toLowerCase() || '';
    const colorScheme = emotionColors[emotionKey] || defaultColor;

    return (
        <div
            className={`emotion-card ${isSecondary ? 'emotion-card-secondary' : ''}`}
            style={{
                backgroundColor: colorScheme.bg,
                color: colorScheme.color
            }}
        >
            <span className="emotion-emoji">{colorScheme.emoji}</span>
            <div className="emotion-content">
                <span className="emotion-name">{emotion || 'Unknown'}</span>
                {intensity && (
                    <span className={`emotion-intensity intensity-${intensity.toLowerCase()}`}>
                        {intensity}
                    </span>
                )}
            </div>
        </div>
    );
}
