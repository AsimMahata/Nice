import React, { useState, useEffect } from "react";
import { useAuth } from "../../utils/useAuth";
import { User as UserIcon, Mail, Github, Linkedin, Code2, Edit2, LogOut, Globe, ExternalLink, AtSign, Fingerprint, Camera, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";
import "./Profile.css";

export default function Profile() {
    const { user, refreshAuth } = useAuth();
    const navigate = useNavigate();
    const { setEditorState } = useEditorContext();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        githubLink: "",
        linkedinLink: "",
        codeforcesLink: "",
        leetcodeLink: "",
        avatar: "",
        coverImage: "",
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                username: user.username || "",
                githubLink: user.githubLink || "",
                linkedinLink: user.linkedinLink || "",
                codeforcesLink: user.codeforcesLink || "",
                leetcodeLink: user.leetcodeLink || "",
                avatar: user.avatar || "",
                coverImage: user.coverImage || "",
            });
        }
    }, [user]);

    const handleLogout = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`, {}, { withCredentials: true });
            await refreshAuth();
            setEditorState((prev) => {
                const newOpenTabs = prev.openedTabs.filter((tab: string) => tab !== "nice://profile");
                return {
                    ...prev,
                    openedTabs: newOpenTabs,
                    activeFile: newOpenTabs.length > 0 ? newOpenTabs[0] : null
                };
            });
            navigate("/");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await axios.patch(`${import.meta.env.VITE_API_URL}/user/update`, formData, { withCredentials: true });
            await refreshAuth();
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'coverImage') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [field]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    if (!user) {
        return (
            <div className="profile-page flex flex-col items-center justify-center">
                <div className="btn-spinner mb-4" style={{ width: 32, height: 32, borderWidth: 3 }} />
                <p className="text-sm font-medium tracking-widest uppercase text-muted">Loading Profile…</p>
            </div>
        );
    }

    const currentAvatar = isEditing ? formData.avatar : user.avatar;
    const currentCover = isEditing ? formData.coverImage : user.coverImage;
    const userInitial = (user.name || user.username || 'U').charAt(0).toUpperCase();

    const openCodeforcesTab = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditorState((prev) => {
            const isOpen = prev.openedTabs.includes("nice://codeforces");
            return {
                ...prev,
                openedFiles: {
                    ...prev.openedFiles,
                    "nice://codeforces": {
                        content: "",
                        isDirty: false,
                        fileInfo: {
                            name: "Codeforces Stats",
                            path: "nice://codeforces",
                            isDirectory: false,
                            size: 0,
                            modifiedAt: new Date(),
                            extension: "",
                        }
                    }
                },
                openedTabs: isOpen ? prev.openedTabs : [...prev.openedTabs, "nice://codeforces"],
                activeFile: "nice://codeforces"
            };
        });
    };

    return (
        <div className="profile-page">
            {/* Header Section */}
            <div className="profile-header-container">
                {/* Cover Area */}
                <div className="profile-cover">
                    {currentCover ? (
                        <img src={currentCover} alt="Cover" className="profile-cover-img" />
                    ) : (
                        <div className="profile-cover-gradient" />
                    )}

                    {isEditing && (
                        <label className="cover-upload-overlay">
                            <Camera size={24} className="mb-1" />
                            <span className="text-xs font-semibold">Change Cover Image</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'coverImage')} />
                        </label>
                    )}
                </div>

                {/* Top Action Controls */}
                <div className="profile-top-actions">
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="profile-action-btn profile-btn-edit"
                        >
                            <Edit2 size={14} />
                            <span>Edit Profile</span>
                        </button>
                    )}

                    <button
                        onClick={handleLogout}
                        className="profile-action-btn profile-btn-logout"
                    >
                        <LogOut size={14} />
                        <span>Logout</span>
                    </button>
                </div>

                {/* User Info Banner */}
                <div className="profile-info-banner">
                    <div className="profile-avatar-wrapper">
                        {currentAvatar ? (
                            <img src={currentAvatar} alt="Avatar" className="profile-avatar-img" />
                        ) : (
                            <div className="profile-avatar-initial">{userInitial}</div>
                        )}

                        {isEditing && (
                            <label className="avatar-upload-overlay">
                                <Camera size={20} />
                                <span className="text-[10px] font-semibold mt-0.5">Avatar</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} />
                            </label>
                        )}
                    </div>

                    <div className="profile-user-details">
                        <div className="profile-name-row">
                            <h1 className="profile-user-name">
                                {user.name || 'Anonymous User'}
                            </h1>
                            <span className="profile-provider-badge">
                                {user.provider}
                            </span>
                        </div>

                        <div className="profile-meta-row">
                            <span className="profile-tag-pill">
                                <Mail size={13} />
                                <span>{user.email}</span>
                            </span>
                            <span className="profile-tag-pill">
                                <AtSign size={13} />
                                <span>{user.username ? `@${user.username}` : 'No username'}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Sections */}
            <div className="profile-content">

                {/* Identity Settings */}
                <section>
                    <h2 className="profile-section-title">
                        <Fingerprint size={18} className="text-indigo-400" />
                        <span>Identity Settings</span>
                    </h2>

                    <div className="profile-grid-2">
                        <div className="profile-field-group">
                            <label className="profile-field-label">Display Name</label>
                            {isEditing ? (
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="profile-input"
                                    placeholder="Your display name"
                                />
                            ) : (
                                <div className="profile-field-value">
                                    {user.name || <span className="text-dim italic">Not configured</span>}
                                </div>
                            )}
                        </div>

                        <div className="profile-field-group">
                            <label className="profile-field-label">Username</label>
                            {isEditing ? (
                                <input
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="profile-input"
                                    placeholder="username"
                                />
                            ) : (
                                <div className="profile-field-value">
                                    {user.username ? `@${user.username}` : <span className="text-dim italic">Not configured</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Developer Connections */}
                <section>
                    <h2 className="profile-section-title">
                        <Globe size={18} className="text-purple-400" />
                        <span>Developer Connections</span>
                    </h2>

                    <div className="dev-connections-grid">
                        {/* GitHub */}
                        <div className="profile-field-group">
                            <label className="profile-field-label">GitHub</label>
                            {isEditing ? (
                                <input
                                    name="githubLink"
                                    value={formData.githubLink}
                                    onChange={handleChange}
                                    className="profile-input"
                                    placeholder="https://github.com/username"
                                />
                            ) : (
                                <a
                                    href={user.githubLink || '#'}
                                    target={user.githubLink ? "_blank" : "_self"}
                                    rel="noreferrer"
                                    className={`dev-card ${user.githubLink ? 'is-linked' : ''}`}
                                >
                                    <div className="dev-card-header">
                                        <div className="dev-card-title">
                                            <Github size={16} />
                                            <span>GitHub</span>
                                        </div>
                                        {user.githubLink ? (
                                            <span className="dev-badge-connected">Connected</span>
                                        ) : (
                                            <span className="dev-badge-unlinked">Not linked</span>
                                        )}
                                    </div>
                                    <div className="dev-card-body">
                                        <span className="dev-card-link-text">
                                            {user.githubLink || 'Connect your GitHub profile'}
                                        </span>
                                        {user.githubLink && <ExternalLink size={14} />}
                                    </div>
                                </a>
                            )}
                        </div>

                        {/* LinkedIn */}
                        <div className="profile-field-group">
                            <label className="profile-field-label">LinkedIn</label>
                            {isEditing ? (
                                <input
                                    name="linkedinLink"
                                    value={formData.linkedinLink}
                                    onChange={handleChange}
                                    className="profile-input"
                                    placeholder="https://linkedin.com/in/username"
                                />
                            ) : (
                                <a
                                    href={user.linkedinLink || '#'}
                                    target={user.linkedinLink ? "_blank" : "_self"}
                                    rel="noreferrer"
                                    className={`dev-card ${user.linkedinLink ? 'is-linked' : ''}`}
                                >
                                    <div className="dev-card-header">
                                        <div className="dev-card-title">
                                            <Linkedin size={16} className="text-sky-400" />
                                            <span>LinkedIn</span>
                                        </div>
                                        {user.linkedinLink ? (
                                            <span className="dev-badge-connected">Connected</span>
                                        ) : (
                                            <span className="dev-badge-unlinked">Not linked</span>
                                        )}
                                    </div>
                                    <div className="dev-card-body">
                                        <span className="dev-card-link-text">
                                            {user.linkedinLink || 'Connect your LinkedIn profile'}
                                        </span>
                                        {user.linkedinLink && <ExternalLink size={14} />}
                                    </div>
                                </a>
                            )}
                        </div>

                        {/* Codeforces */}
                        <div className="profile-field-group">
                            <div className="flex items-center justify-between">
                                <label className="profile-field-label">Codeforces</label>
                                <button
                                    type="button"
                                    onClick={openCodeforcesTab}
                                    className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                                >
                                    <span>View Analytics</span>
                                    <ExternalLink size={11} />
                                </button>
                            </div>
                            {isEditing ? (
                                <input
                                    name="codeforcesLink"
                                    value={formData.codeforcesLink}
                                    onChange={handleChange}
                                    className="profile-input"
                                    placeholder="Handle or profile URL"
                                />
                            ) : (
                                <a
                                    href={user.codeforcesLink ? (user.codeforcesLink.includes('http') ? user.codeforcesLink : `https://codeforces.com/profile/${user.codeforcesLink}`) : '#'}
                                    target={user.codeforcesLink ? "_blank" : "_self"}
                                    rel="noreferrer"
                                    className={`dev-card ${user.codeforcesLink ? 'is-linked' : ''}`}
                                >
                                    <div className="dev-card-header">
                                        <div className="dev-card-title">
                                            <Code2 size={16} className="text-rose-400" />
                                            <span>Codeforces</span>
                                        </div>
                                        {user.codeforcesLink ? (
                                            <span className="dev-badge-connected">Connected</span>
                                        ) : (
                                            <span className="dev-badge-unlinked">Not linked</span>
                                        )}
                                    </div>
                                    <div className="dev-card-body">
                                        <span className="dev-card-link-text">
                                            {user.codeforcesLink || 'Connect your Codeforces handle'}
                                        </span>
                                        {user.codeforcesLink && <ExternalLink size={14} />}
                                    </div>
                                </a>
                            )}
                        </div>

                        {/* LeetCode */}
                        <div className="profile-field-group">
                            <label className="profile-field-label">LeetCode</label>
                            {isEditing ? (
                                <input
                                    name="leetcodeLink"
                                    value={formData.leetcodeLink}
                                    onChange={handleChange}
                                    className="profile-input"
                                    placeholder="Handle or profile URL"
                                />
                            ) : (
                                <a
                                    href={user.leetcodeLink ? (user.leetcodeLink.includes('http') ? user.leetcodeLink : `https://leetcode.com/${user.leetcodeLink}`) : '#'}
                                    target={user.leetcodeLink ? "_blank" : "_self"}
                                    rel="noreferrer"
                                    className={`dev-card ${user.leetcodeLink ? 'is-linked' : ''}`}
                                >
                                    <div className="dev-card-header">
                                        <div className="dev-card-title">
                                            <Globe size={16} className="text-amber-400" />
                                            <span>LeetCode</span>
                                        </div>
                                        {user.leetcodeLink ? (
                                            <span className="dev-badge-connected">Connected</span>
                                        ) : (
                                            <span className="dev-badge-unlinked">Not linked</span>
                                        )}
                                    </div>
                                    <div className="dev-card-body">
                                        <span className="dev-card-link-text">
                                            {user.leetcodeLink || 'Connect your LeetCode profile'}
                                        </span>
                                        {user.leetcodeLink && <ExternalLink size={14} />}
                                    </div>
                                </a>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* Bottom Floating Save Bar */}
            {isEditing && (
                <div className="profile-floating-bar">
                    <span className="text-xs font-medium text-secondary">Unsaved profile changes</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                    name: user.name || "",
                                    username: user.username || "",
                                    githubLink: user.githubLink || "",
                                    linkedinLink: user.linkedinLink || "",
                                    codeforcesLink: user.codeforcesLink || "",
                                    leetcodeLink: user.leetcodeLink || "",
                                    avatar: user.avatar || "",
                                    coverImage: user.coverImage || "",
                                });
                            }}
                            className="profile-discard-btn"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="profile-save-btn"
                        >
                            {isLoading ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}