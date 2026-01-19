import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Disclaimer from '../components/Disclaimer';
import './Profile.css';

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        const result = await logout();
        if (result.success) {
            navigate('/login');
        }
        setIsLoggingOut(false);
    };

    const handleDeleteAccount = () => {
        // In a production app, you'd implement account deletion here
        alert('Account deletion would be implemented here. For now, please contact support.');
        setShowDeleteConfirm(false);
    };

    const getInitials = () => {
        if (user?.displayName) {
            return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
        }
        return user?.email?.[0]?.toUpperCase() || '?';
    };

    return (
        <div className="profile-page">
            <div className="container container-narrow">
                <header className="profile-header fade-in">
                    <button className="back-button" onClick={() => navigate('/home')}>
                        ← Back
                    </button>
                    <h1>Profile</h1>
                </header>

                <div className="profile-content">
                    {/* User Info Card */}
                    <section className="user-card slide-up">
                        <div className="avatar-large">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Profile" />
                            ) : (
                                <span>{getInitials()}</span>
                            )}
                        </div>
                        <div className="user-info">
                            <h2>{user?.displayName || 'MindMirror User'}</h2>
                            <p>{user?.email}</p>
                        </div>
                    </section>

                    {/* Data Notice */}
                    <section className="notice-card slide-up">
                        <div className="notice-icon">🔒</div>
                        <div className="notice-content">
                            <h3>Your Privacy</h3>
                            <p>
                                Your reflections are stored securely and are only accessible to you.
                                We use a <strong>7-day rolling cycle</strong> for data retention,
                                meaning older reflections are automatically removed to protect your privacy.
                            </p>
                        </div>
                    </section>

                    {/* App Info */}
                    <section className="info-section slide-up">
                        <h3>About MindMirror</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Version</span>
                                <span className="info-value">1.0.0</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Data Retention</span>
                                <span className="info-value">7 days</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">AI Model</span>
                                <span className="info-value">Gemini</span>
                            </div>
                        </div>
                    </section>

                    {/* Actions */}
                    <section className="actions-section slide-up">
                        <button
                            className="btn btn-secondary btn-large action-button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                        </button>

                        <button
                            className="btn btn-ghost delete-button"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            Delete Account
                        </button>
                    </section>

                    <Disclaimer />
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3>Delete Account?</h3>
                            <p>
                                This will permanently delete your account and all your reflections.
                                This action cannot be undone.
                            </p>
                            <div className="modal-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={handleDeleteAccount}
                                >
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
