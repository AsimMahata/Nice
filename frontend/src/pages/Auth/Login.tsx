import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as useAuth from '../../utils/useAuth';
import './Login.css';
import { Github } from "lucide-react";
import HomeButton from '../../components/Utility/HomeButton';

interface SignUpInputs {
    email: string;
    password: string;
    confirmPassword: string;
}

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { refreshAuth } = useAuth.useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignUpInputs>();

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const onSubmit: SubmitHandler<SignUpInputs> = async (data) => {
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
        } catch (err) {
            console.error('Login failed:', err);
        }
    };

    const handleSocialAuth = (provider: 'google' | 'github') => {
        window.location.href = `${API_BASE_URL}/auth/register/${provider}`;
    };

    return (
        <div className="login-page">
            <HomeButton />
            <div className="login-card">
                <h2 className="login-title">Log In</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="login-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^\S+@\S+$/i,
                                    message: 'Invalid email format',
                                },
                            })}
                            className={errors.email ? 'input error' : 'input'}
                        />
                        {errors.email && (
                            <p className="error-text">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            {...register('password', {
                                required: 'Required',
                                minLength: { value: 6, message: 'Min 6 chars' },
                            })}
                            className={errors.password ? 'input error' : 'input'}
                        />
                        {errors.password && (
                            <p className="error-text">{errors.password.message}</p>
                        )}
                    </div>

                    <button type="submit" disabled={isSubmitting} className="primary-btn">
                        {isSubmitting ? 'Logging in…' : 'Log In'}
                    </button>
                </form>

                <div className="divider">OR LOG IN WITH</div>

                <div className="social-buttons">
                    <button
                        onClick={() => handleSocialAuth('google')}
                        className="google-btn"
                    >
                        Google
                    </button>

                    <button
                        onClick={() => handleSocialAuth('github')}
                        className="github-btn"
                    >
                        GitHub <Github />
                    </button>
                </div>

                <p className="footer-text">
                    Don&apos;t have an account? <a href="/register">Register</a>
                </p>
            </div>
        </div>
    );
};

export default Login;
