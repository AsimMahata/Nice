import { useState, useEffect } from "react";
import { useAuth } from "../../utils/useAuth";
import { User, Mail, Github, Linkedin, Code2, Link as LinkIcon, Edit2, Save, X, LogOut, ArrowLeft } from "lucide-react";
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

    if (!user) {
        return (
            <div className="h-full w-full bg-[#1e1e1e] text-white flex items-center justify-center">
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[#1e1e1e] text-gray-200 p-8 font-sans overflow-y-auto custom-scrollbar">
            <div className="max-w-5xl mx-auto">
                <div className="bg-[#1e1e1e] border-b border-[#333333] pb-8 mb-8">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-[#252526] rounded-full flex items-center justify-center border border-[#333333] flex-shrink-0">
                                <User size={48} className="text-gray-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{user.name || 'Anonymous User'}</h1>
                                <p className="text-gray-400 flex items-center gap-2">
                                    <Mail size={16} /> {user.email}
                                    <span className="px-2 py-0.5 rounded-full bg-[#333333] text-xs ml-2 border border-[#444444]">
                                        {user.provider}
                                    </span>
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                disabled={isLoading}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                                    isEditing 
                                        ? "bg-green-600 hover:bg-green-700 text-white" 
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                            >
                                {isEditing ? (
                                    <>
                                        <Save size={16} />
                                        {isLoading ? 'Saving...' : 'Save Profile'}
                                    </>
                                ) : (
                                    <>
                                        <Edit2 size={16} />
                                        Edit Profile
                                    </>
                                )}
                            </button>

                            <button 
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-red-400 border border-[#4a2a2a] hover:bg-red-400/10 hover:border-red-900 transition-colors px-4 py-2 rounded-lg text-sm font-medium"
                            >
                                <LogOut size={16} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Personal Info Group */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-300 border-b border-[#333333] pb-2">Personal Information</h3>
                                
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Name</label>
                                    {isEditing ? (
                                        <input 
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full bg-[#1e1e1e] border border-[#333333] rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Your full name"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-300 bg-[#1e1e1e] px-3 py-2 rounded-md border border-transparent">
                                            <User size={18} className="text-gray-500" />
                                            {user.name || <span className="text-gray-600 italic">Not set</span>}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Username</label>
                                    {isEditing ? (
                                        <input 
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            className="w-full bg-[#1e1e1e] border border-[#333333] rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Your username"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-300 bg-[#1e1e1e] px-3 py-2 rounded-md border border-transparent">
                                            <span className="text-gray-500 font-mono">@</span>
                                            {user.username || <span className="text-gray-600 italic">Not set</span>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Links Group */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-300 border-b border-[#333333] pb-2">Developer Links</h3>
                                
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">GitHub</label>
                                    {isEditing ? (
                                        <input 
                                            name="githubLink"
                                            value={formData.githubLink}
                                            onChange={handleChange}
                                            className="w-full bg-[#1e1e1e] border border-[#333333] rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="https://github.com/username"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-300 bg-[#1e1e1e] px-3 py-2 rounded-md border border-transparent">
                                            <Github size={18} className="text-gray-500" />
                                            {user.githubLink ? <a href={user.githubLink} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all">{user.githubLink}</a> : <span className="text-gray-600 italic">Not set</span>}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">LinkedIn</label>
                                    {isEditing ? (
                                        <input 
                                            name="linkedinLink"
                                            value={formData.linkedinLink}
                                            onChange={handleChange}
                                            className="w-full bg-[#1e1e1e] border border-[#333333] rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="https://linkedin.com/in/username"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-300 bg-[#1e1e1e] px-3 py-2 rounded-md border border-transparent">
                                            <Linkedin size={18} className="text-gray-500" />
                                            {user.linkedinLink ? <a href={user.linkedinLink} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all">{user.linkedinLink}</a> : <span className="text-gray-600 italic">Not set</span>}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Codeforces</label>
                                    {isEditing ? (
                                        <input 
                                            name="codeforcesLink"
                                            value={formData.codeforcesLink}
                                            onChange={handleChange}
                                            className="w-full bg-[#1e1e1e] border border-[#333333] rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Codeforces handle or URL"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-300 bg-[#1e1e1e] px-3 py-2 rounded-md border border-transparent">
                                            <Code2 size={18} className="text-gray-500" />
                                            {user.codeforcesLink ? <a href={user.codeforcesLink.includes('http') ? user.codeforcesLink : `https://codeforces.com/profile/${user.codeforcesLink}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all">{user.codeforcesLink}</a> : <span className="text-gray-600 italic">Not set</span>}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 uppercase font-semibold">LeetCode</label>
                                    {isEditing ? (
                                        <input 
                                            name="leetcodeLink"
                                            value={formData.leetcodeLink}
                                            onChange={handleChange}
                                            className="w-full bg-[#1e1e1e] border border-[#333333] rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="LeetCode handle or URL"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-300 bg-[#1e1e1e] px-3 py-2 rounded-md border border-transparent">
                                            <Code2 size={18} className="text-gray-500" />
                                            {user.leetcodeLink ? <a href={user.leetcodeLink.includes('http') ? user.leetcodeLink : `https://leetcode.com/${user.leetcodeLink}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all">{user.leetcodeLink}</a> : <span className="text-gray-600 italic">Not set</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {isEditing && (
                            <div className="mt-8 pt-4 border-t border-[#333333] flex justify-end">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        // Reset to original data
                                        setFormData({
                                            name: user.name || "",
                                            username: user.username || "",
                                            githubLink: user.githubLink || "",
                                            linkedinLink: user.linkedinLink || "",
                                            codeforcesLink: user.codeforcesLink || "",
                                            leetcodeLink: user.leetcodeLink || "",
                                        });
                                    }}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors mr-4"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
            </div>
        </div>
    );
}
