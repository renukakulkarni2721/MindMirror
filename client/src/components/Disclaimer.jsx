import './Disclaimer.css';

export default function Disclaimer({ variant = 'default' }) {
    return (
        <div className={`disclaimer disclaimer-${variant}`}>
            <span className="disclaimer-icon">ℹ️</span>
            <span>
                MindMirror is a reflection tool and does not provide medical or therapeutic advice.
            </span>
        </div>
    );
}
