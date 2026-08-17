import { useState, useEffect } from "react";
import { useAuth } from "../../utils/useAuth";
import { User, Mail, Github, Linkedin, Code2, Edit2, Save, LogOut, Globe, ExternalLink, AtSign, Fingerprint } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";

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
                const newOpenTabs = prev.openTabs.filter(tab => tab !== "nice://profile");
                return {
                    ...prev,
                    openTabs: newOpenTabs,
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
            <div className="h-full w-full bg-[#1e1e1e] text-zinc-400 flex flex-col items-center justify-center font-sans">
                <div className="w-8 h-8 border-2 border-[#333333] border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <p className="text-sm tracking-widest uppercase">Loading Profile</p>
            </div>
        );
    }

    const currentAvatar = isEditing ? formData.avatar : user.avatar;
    const currentCover = isEditing ? formData.coverImage : user.coverImage;

    return (
        <div className="h-full w-full bg-[#1e1e1e] text-zinc-300 font-sans overflow-y-auto custom-scrollbar selection:bg-blue-500/30">
            {/* Header Section */}
            <div className="w-full border-b border-[#333333] bg-[#252526] relative">
                {/* Cover Image Area */}
                <div className="w-full h-48 bg-[#1a1a1a] relative overflow-hidden group">
                    {currentCover ? (
                        <img src={currentCover} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
                    )}
                    {isEditing && (
                        <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            <Edit2 className="text-white mb-2" size={24} />
                            <span className="text-white text-sm font-medium">Change Cover Image</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'coverImage')} />
                        </label>
                    )}
                </div>

                {/* Profile Controls (Edit / Logout) - Now absolutely positioned at the top right of the cover image */}
                <div className="absolute top-4 right-8 flex items-center gap-3 z-20">
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium shadow-lg backdrop-blur-md bg-black/50 hover:bg-black/70 text-white border border-white/10"
                        >
                            <Edit2 size={14} />
                            Edit Profile
                        </button>
                    )}

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-red-400 bg-black/50 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200 shadow-lg backdrop-blur-md"
                    >
                        <LogOut size={14} />
                        <span>Logout</span>
                    </button>
                </div>

                <div className="w-full px-12 pb-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 -mt-16 z-10">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="relative w-32 h-32 rounded-full bg-[#1e1e1e] border-4 border-[#252526] flex items-center justify-center overflow-hidden shadow-xl">
                                {currentAvatar ? (
                                    <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={56} className="text-zinc-500" />
                                )}
                                {isEditing && (
                                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                        <Edit2 className="text-white mb-1" size={20} />
                                        <span className="text-white text-xs font-medium">Avatar</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="text-center md:text-left pt-2 md:pt-16">
                            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                                <h1 className="text-3xl font-bold text-white tracking-wide drop-shadow-sm">
                                    {user.name || 'Anonymous User'}
                                </h1>
                                <span className="px-3 py-1 rounded bg-[#333333] text-zinc-300 text-xs font-semibold tracking-wider uppercase border border-[#444444]">
                                    {user.provider}
                                </span>
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-3 text-zinc-400 text-sm mt-3">
                                <span className="flex items-center gap-1.5 bg-[#1e1e1e] px-3 py-1.5 rounded border border-[#333333]">
                                    <Mail size={14} className="text-zinc-500" />
                                    {user.email}
                                </span>
                                <span className="flex items-center gap-1.5 bg-[#1e1e1e] px-3 py-1.5 rounded border border-[#333333]">
                                    <AtSign size={14} className="text-zinc-500" />
                                    {user.username || 'No username'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="w-full px-12 py-12 space-y-16">

                {/* Identity Settings */}
                <section>
                    <h2 className="text-lg font-medium text-white flex items-center gap-2 mb-6 pb-2 border-b border-[#333333]">
                        <Fingerprint size={18} className="text-blue-500" />
                        Identity Settings
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 max-w-5xl">
                        {/* Name Field */}
                        <div className="space-y-2 relative group">
                            <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Display Name</label>
                            {isEditing ? (
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-[#252526] border border-[#333333] rounded-md px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                    placeholder="Your display name"
                                />
                            ) : (
                                <div className="w-full border-b border-transparent group-hover:border-[#333333] py-2 flex items-center gap-3 transition-colors">
                                    <span className="text-zinc-200 text-lg">{user.name || <span className="text-zinc-600 italic">Not configured</span>}</span>
                                </div>
                            )}
                        </div>

                        {/* Username Field */}
                        <div className="space-y-2 relative group">
                            <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Username</label>
                            {isEditing ? (
                                <input
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full bg-[#252526] border border-[#333333] rounded-md px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                    placeholder="username"
                                />
                            ) : (
                                <div className="w-full border-b border-transparent group-hover:border-[#333333] py-2 flex items-center gap-3 transition-colors">
                                    <span className="text-zinc-200 text-lg">{user.username ? `@${user.username}` : <span className="text-zinc-600 italic">Not configured</span>}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Developer Connections */}
                <section>
                    <h2 className="text-lg font-medium text-white flex items-center gap-2 mb-6 pb-2 border-b border-[#333333]">
                        <Globe size={18} className="text-purple-500" />
                        Developer Connections
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* GitHub */}
                        <div className="flex flex-col gap-3">
                            <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                                <Github size={16} className="text-zinc-300" />
                                GitHub
                            </label>
                            {isEditing ? (
                                <input
                                    name="githubLink"
                                    value={formData.githubLink}
                                    onChange={handleChange}
                                    className="w-full bg-[#252526] border border-[#333333] rounded-md px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-all"
                                    placeholder="https://github.com/..."
                                />
                            ) : (
                                <a
                                    href={user.githubLink || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`w-full bg-[#252526] border border-[#333333] rounded-md px-5 py-4 flex items-center justify-between group transition-all duration-200 ${user.githubLink ? 'hover:border-zinc-400 hover:bg-[#2a2a2b] cursor-pointer' : 'opacity-50 cursor-default'}`}
                                >
                                    <span className="text-zinc-300 font-medium text-sm truncate pr-2">
                                        {user.githubLink ? user.githubLink : 'Not linked'}
                                    </span>
                                    {user.githubLink && <ExternalLink size={14} className="text-zinc-500 group-hover:text-zinc-300" />}
                                </a>
                            )}
                        </div>

                        {/* LinkedIn */}
                        <div className="flex flex-col gap-3">
                            <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                                <Linkedin size={16} className="text-[#0a66c2]" />
                                LinkedIn
                            </label>
                            {isEditing ? (
                                <input
                                    name="linkedinLink"
                                    value={formData.linkedinLink}
                                    onChange={handleChange}
                                    className="w-full bg-[#252526] border border-[#333333] rounded-md px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#0a66c2] transition-all"
                                    placeholder="https://linkedin.com/in/..."
                                />
                            ) : (
                                <a
                                    href={user.linkedinLink || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`w-full bg-[#252526] border border-[#333333] rounded-md px-5 py-4 flex items-center justify-between group transition-all duration-200 ${user.linkedinLink ? 'hover:border-[#0a66c2] hover:bg-[#2a2a2b] cursor-pointer' : 'opacity-50 cursor-default'}`}
                                >
                                    <span className="text-zinc-300 font-medium text-sm truncate pr-2">
                                        {user.linkedinLink ? user.linkedinLink : 'Not linked'}
                                    </span>
                                    {user.linkedinLink && <ExternalLink size={14} className="text-zinc-500 group-hover:text-zinc-300" />}
                                </a>
                            )}
                        </div>

                        {/* Codeforces */}
                        <div className="flex flex-col gap-3">
                            <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                                <Code2 size={16} className="text-red-500" />
                                Codeforces
                            </label>
                            {isEditing ? (
                                <input
                                    name="codeforcesLink"
                                    value={formData.codeforcesLink}
                                    onChange={handleChange}
                                    className="w-full bg-[#252526] border border-[#333333] rounded-md px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-all"
                                    placeholder="Handle or URL"
                                />
                            ) : (
                                <a
                                    href={user.codeforcesLink ? (user.codeforcesLink.includes('http') ? user.codeforcesLink : `https://codeforces.com/profile/${user.codeforcesLink}`) : '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`w-full bg-[#252526] border border-[#333333] rounded-md px-5 py-4 flex items-center justify-between group transition-all duration-200 ${user.codeforcesLink ? 'hover:border-red-500 hover:bg-[#2a2a2b] cursor-pointer' : 'opacity-50 cursor-default'}`}
                                >
                                    <span className="text-zinc-300 font-medium text-sm truncate pr-2">
                                        {user.codeforcesLink ? (user.codeforcesLink.includes('http') ? user.codeforcesLink : `https://codeforces.com/profile/${user.codeforcesLink}`) : 'Not linked'}
                                    </span>
                                    {user.codeforcesLink && <ExternalLink size={14} className="text-zinc-500 group-hover:text-zinc-300" />}
                                </a>
                            )}
                        </div>

                        {/* LeetCode */}
                        <div className="flex flex-col gap-3">
                            <label className="text-xs text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                                <Globe size={16} className="text-amber-500" />
                                LeetCode
                            </label>
                            {isEditing ? (
                                <input
                                    name="leetcodeLink"
                                    value={formData.leetcodeLink}
                                    onChange={handleChange}
                                    className="w-full bg-[#252526] border border-[#333333] rounded-md px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all"
                                    placeholder="Handle or URL"
                                />
                            ) : (
                                <a
                                    href={user.leetcodeLink ? (user.leetcodeLink.includes('http') ? user.leetcodeLink : `https://leetcode.com/${user.leetcodeLink}`) : '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`w-full bg-[#252526] border border-[#333333] rounded-md px-5 py-4 flex items-center justify-between group transition-all duration-200 ${user.leetcodeLink ? 'hover:border-amber-500 hover:bg-[#2a2a2b] cursor-pointer' : 'opacity-50 cursor-default'}`}
                                >
                                    <span className="text-zinc-300 font-medium text-sm truncate pr-2">
                                        {user.leetcodeLink ? (user.leetcodeLink.includes('http') ? user.leetcodeLink : `https://leetcode.com/${user.leetcodeLink}`) : 'Not linked'}
                                    </span>
                                    {user.leetcodeLink && <ExternalLink size={14} className="text-zinc-500 group-hover:text-zinc-300" />}
                                </a>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* Bottom Floating Save Bar */}
            {isEditing && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#252526] border border-[#333333] rounded-full px-6 py-4 flex items-center gap-6 shadow-2xl z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <span className="text-sm font-medium text-zinc-400">Unsaved changes</span>
                    <div className="flex items-center gap-3">
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
                            className="px-4 py-2 rounded-full text-sm font-medium text-zinc-300 hover:text-white hover:bg-[#333333] transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2 rounded-full bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors shadow-lg shadow-green-900/20"
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}