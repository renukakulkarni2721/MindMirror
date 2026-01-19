import './InsightCard.css';

export default function InsightCard({ title, content, question, icon = '💭' }) {
    return (
        <div className="insight-card fade-in">
            <div className="insight-header">
                <span className="insight-icon">{icon}</span>
                <h3 className="insight-title">{title}</h3>
            </div>
            <p className="insight-content">{content}</p>
            {question && (
                <div className="insight-question">
                    <span className="question-icon">🤔</span>
                    <p>{question}</p>
                </div>
            )}
        </div>
    );
}
