import React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import { Github } from "lucide-react";
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

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<SignUpInputs>();

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    const onSubmit: SubmitHandler<SignUpInputs> = async (data) => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/auth/register`,
                data
            );

            if (response.status === 200 || response.status === 201) {
                navigate("/login");
            }
        } catch (err) {
            console.error("Registration failed:", err);
        }
    };

    const handleSocialAuth = (provider: "google" | "github") => {
        window.location.href = `${API_BASE_URL}/auth/register/${provider}`;
    };

    return (
        <div className="auth-page">
            <HomeButton />
            <div className="auth-card">
                <h2 className="auth-title">Create Account</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            {...register("name", {
                                required: "Name is required",
                                minLength: { value: 3, message: "Min 3 chars" },
                            })}
                            className={errors.name ? "input error" : "input"}
                        />
                        {errors.name && <p className="error-text">{errors.name.message}</p>}
                    </div>

                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            {...register("username", {
                                required: "Username is required",
                                minLength: { value: 3, message: "Min 3 chars" },
                            })}
                            className={errors.username ? "input error" : "input"}
                        />
                        {errors.username && (
                            <p className="error-text">{errors.username.message}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^\S+@\S+$/i,
                                    message: "Invalid email",
                                },
                            })}
                            className={errors.email ? "input error" : "input"}
                        />
                        {errors.email && (
                            <p className="error-text">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="two-col">
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                {...register("password", {
                                    required: "Required",
                                    minLength: { value: 6, message: "Min 6 chars" },
                                })}
                                className={errors.password ? "input error" : "input"}
                            />
                            {errors.password && (
                                <p className="error-text">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Confirm</label>
                            <input
                                type="password"
                                {...register("confirmPassword", {
                                    required: "Required",
                                    validate: (v) =>
                                        v === getValues("password") || "No match",
                                })}
                                className={errors.confirmPassword ? "input error" : "input"}
                            />
                            {errors.confirmPassword && (
                                <p className="error-text">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="primary-btn">
                        {isSubmitting ? "Creating Account…" : "Sign Up"}
                    </button>
                </form>

                <div className="divider">OR SIGN UP WITH</div>

                <div className="social-buttons">
                    <button
                        onClick={() => handleSocialAuth("google")}
                        className="google-btn"
                    >
                        Google
                    </button>

                    <button
                        onClick={() => handleSocialAuth("github")}
                        className="github-btn"
                    >
                        GitHub <Github />
                    </button>
                </div>

                <p className="footer-text">
                    Already have an account? <a href="/login">Log In</a>
                </p>
            </div>
        </div>
    );
};

export default Register;
