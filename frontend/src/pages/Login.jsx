import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Disclaimer from '../components/Disclaimer';
import LoadingSpinner from '../components/LoadingSpinner';
import './Login.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, loginWithGoogle, error, clearError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        clearError();

        const result = await login(email, password);

        if (result.success) {
            navigate('/home');
        }

        setIsLoading(false);
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        clearError();

        const result = await loginWithGoogle();

        if (result.success) {
            navigate('/home');
        }

        setIsLoading(false);
    };

    return (
        <div className="login-page page-center">
            <div className="login-container fade-in">
                <div className="login-header">
                    <div className="logo">
                        <span className="logo-icon">🪞</span>
                        <h1>MindMirror</h1>
                    </div>
                    <p className="tagline">Reflect. Notice. Grow.</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <div className="form-error-message">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-large"
                        disabled={isLoading}
                    >
                        {isLoading ? <LoadingSpinner size="small" /> : 'Sign In'}
                    </button>
                </form>

                <div className="login-divider">
                    <span>or</span>
                </div>

                <button
                    className="btn btn-secondary btn-large google-btn"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                >
                    <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                <p className="login-footer">
                    New to MindMirror? <Link to="/register">Create an account</Link>
                </p>

                <Disclaimer variant="subtle" />
            </div>
        </div>
    );
}
