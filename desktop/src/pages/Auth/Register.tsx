import React, { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";
import { Github, Mail, Lock, User, AtSign, Eye, EyeOff, X, AlertCircle, UserPlus } from "lucide-react";
import HomeButton from "../../components/Utility/HomeButton";

interface SignUpInputs {
    name: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<SignUpInputs>();

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Handle closing the register view and returning to workspace
    const handleClose = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate("/");
        }
    };

    // Close on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const onSubmit: SubmitHandler<SignUpInputs> = async (data) => {
        setServerError(null);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/auth/register`,
                data
            );

            if (response.status === 200 || response.status === 201) {
                navigate("/login");
            }
        } catch (err: any) {
            console.error("Registration failed:", err);
            const msg = err.response?.data?.message || err.response?.data?.error || "Registration failed. Please check your information and try again.";
            setServerError(msg);
        }
    };

    const handleSocialAuth = (provider: "google" | "github") => {
        window.location.href = `${API_BASE_URL}/auth/register/${provider}`;
    };

    return (
        <div className="auth-page">
            <div className="auth-backdrop" onClick={handleClose} title="Click to close" />
            <HomeButton onClose={handleClose} />

            <div className="auth-card">
                <div className="auth-card-header">
                    <div className="login-header-left">
                        <div className="login-app-badge">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h2 className="auth-title">Create Account</h2>
                            <p className="auth-subtitle">Join and sync your workspace preferences</p>
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

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="reg-name">Full Name</label>
                        <div className="input-wrapper">
                            <User size={16} className="input-icon" />
                            <input
                                id="reg-name"
                                type="text"
                                placeholder="John Doe"
                                {...register("name", {
                                    required: "Name is required",
                                    minLength: { value: 3, message: "Min 3 characters" },
                                })}
                                className={errors.name ? "input error" : "input"}
                            />
                        </div>
                        {errors.name && <p className="error-text">{errors.name.message}</p>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-username">Username</label>
                        <div className="input-wrapper">
                            <AtSign size={16} className="input-icon" />
                            <input
                                id="reg-username"
                                type="text"
                                placeholder="johndoe"
                                {...register("username", {
                                    required: "Username is required",
                                    minLength: { value: 3, message: "Min 3 characters" },
                                })}
                                className={errors.username ? "input error" : "input"}
                            />
                        </div>
                        {errors.username && (
                            <p className="error-text">{errors.username.message}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-email">Email</label>
                        <div className="input-wrapper">
                            <Mail size={16} className="input-icon" />
                            <input
                                id="reg-email"
                                type="email"
                                placeholder="name@example.com"
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: {
                                        value: /^\S+@\S+$/i,
                                        message: "Invalid email address",
                                    },
                                })}
                                className={errors.email ? "input error" : "input"}
                            />
                        </div>
                        {errors.email && (
                            <p className="error-text">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="two-col">
                        <div className="form-group">
                            <label htmlFor="reg-password">Password</label>
                            <div className="input-wrapper">
                                <Lock size={16} className="input-icon" />
                                <input
                                    id="reg-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    {...register("password", {
                                        required: "Required",
                                        minLength: { value: 6, message: "Min 6 chars" },
                                    })}
                                    className={errors.password ? "input has-right-icon error" : "input has-right-icon"}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="error-text">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-confirm">Confirm</label>
                            <div className="input-wrapper">
                                <Lock size={16} className="input-icon" />
                                <input
                                    id="reg-confirm"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    {...register("confirmPassword", {
                                        required: "Required",
                                        validate: (v) =>
                                            v === getValues("password") || "Passwords do not match",
                                    })}
                                    className={errors.confirmPassword ? "input has-right-icon error" : "input has-right-icon"}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex={-1}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="error-text">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="primary-btn">
                        {isSubmitting ? (
                            <>
                                <span className="btn-spinner" />
                                <span>Creating Account…</span>
                            </>
                        ) : (
                            "Sign Up"
                        )}
                    </button>
                </form>

                <div className="divider">OR SIGN UP WITH</div>

                <div className="social-buttons">
                    <button
                        type="button"
                        onClick={() => handleSocialAuth("google")}
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
                        onClick={() => handleSocialAuth("github")}
                        className="social-btn"
                    >
                        <Github size={18} />
                        <span>Continue with GitHub</span>
                    </button>
                </div>

                <p className="footer-text">
                    Already have an account? <Link to="/login" className="footer-link">Log In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
