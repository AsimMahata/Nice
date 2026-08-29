import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import * as useAuth from '../../utils/useAuth';
import './Login.css';
import { Github, Mail, Lock, Eye, EyeOff, X, AlertCircle, LogIn } from 'lucide-react';
import HomeButton from '../../components/Utility/HomeButton';

interface LoginInputs {
    email: string;
    password: string;
}

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { refreshAuth } = useAuth.useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginInputs>();

    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

    // Handle closing the login view and returning to workspace
    const handleClose = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const onSubmit: SubmitHandler<LoginInputs> = async (data) => {
        setServerError(null);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/auth/login`,
                data,
                { withCredentials: true }
            );

            await refreshAuth();

            if (response.status === 200 || response.status === 201) {
                navigate('/');
            }
        } catch (err: any) {
            console.error('Login failed:', err);
            const msg = err.response?.data?.message || err.response?.data?.error || 'Invalid email or password. Please try again.';
            setServerError(msg);
        }
    };

    const handleSocialAuth = async (provider: 'google' | 'github') => {
        // @ts-ignore
        if (window.auth && window.auth.openAuthWindow) {
            // @ts-ignore
            const result = await window.auth.openAuthWindow(`${API_BASE_URL}/auth/desktop/${provider}`);
            if (result && result.success && result.token) {
                try {
                    await axios.post(
                        `${API_BASE_URL}/auth/login-token`,
                        { token: result.token },
                        { withCredentials: true }
                    );
                    await refreshAuth();
                    navigate('/');
                } catch (err) {
                    console.error('Failed to exchange token:', err);
                    setServerError('Social authentication failed. Please try again.');
                }
            }
        } else {
            window.location.href = `${API_BASE_URL}/auth/register/${provider}`;
        }
    };

    return (
        <div className="login-page">
            <div className="login-backdrop" onClick={handleClose} title="Click to close" />
            <HomeButton onClose={handleClose} />

            <div className="login-card">
                <div className="login-card-header">
                    <div className="login-header-left">
                        <div className="login-app-badge">
                            <LogIn size={20} />
                        </div>
                        <div>
                            <h2 className="login-title">Log In</h2>
                            <p className="login-subtitle">Welcome back to your workspace</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="login-close-icon-btn"
                        aria-label="Close"
                        title="Close (Esc)"
                    >
                        <X size={18} />
                    </button>
                </div>

                {serverError && (
                    <div className="auth-alert-banner">
                        <AlertCircle size={16} />
                        <span>{serverError}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email-input">Email</label>
                        <div className="input-wrapper">
                            <Mail size={16} className="input-icon" />
                            <input
                                id="email-input"
                                type="email"
                                placeholder="name@example.com"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^\S+@\S+$/i,
                                        message: 'Invalid email format',
                                    },
                                })}
                                className={errors.email ? 'input error' : 'input'}
                            />
                        </div>
                        {errors.email && (
                            <p className="error-text">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password-input">Password</label>
                        <div className="input-wrapper">
                            <Lock size={16} className="input-icon" />
                            <input
                                id="password-input"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: { value: 6, message: 'Minimum 6 characters' },
                                })}
                                className={errors.password ? 'input has-right-icon error' : 'input has-right-icon'}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="error-text">{errors.password.message}</p>
                        )}
                    </div>

                    <button type="submit" disabled={isSubmitting} className="primary-btn">
                        {isSubmitting ? (
                            <>
                                <span className="btn-spinner" />
                                <span>Logging in…</span>
                            </>
                        ) : (
                            'Log In'
                        )}
                    </button>
                </form>

                <div className="divider">OR LOG IN WITH</div>

                <div className="social-buttons">
                    <button
                        type="button"
                        onClick={() => handleSocialAuth('google')}
                        className="social-btn"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.1-6.68-4.93H1.31v3.15C3.32 21.36 7.39 24 12 24z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.32 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.31C.47 8.25 0 10.07 0 12s.47 3.75 1.31 5.42l4.01-3.15z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.32 2.64 1.31 6.58l4.01 3.15c.94-2.83 3.57-4.98 6.68-4.98z"
                            />
                        </svg>
                        <span>Continue with Google</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSocialAuth('github')}
                        className="social-btn"
                    >
                        <Github size={18} />
                        <span>Continue with GitHub</span>
                    </button>
                </div>

                <p className="footer-text">
                    Don&apos;t have an account? <Link to="/register" className="footer-link">Register</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
