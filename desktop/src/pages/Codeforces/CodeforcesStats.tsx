import React, { useState, useEffect } from "react";
import { useAuth } from "../../utils/useAuth";
import axios from "axios";
import {
    Trophy,
    Award,
    CheckCircle2,
    XCircle,
    Clock,
    BarChart3,
    Search,
    ExternalLink,
    RefreshCw,
    Code2,
    Users,
    Activity,
    Zap,
    TrendingUp,
    WifiOff
} from "lucide-react";
import "./CodeforcesStats.css";

export interface CFUser {
    handle: string;
    email?: string;
    vkId?: string;
    openId?: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    city?: string;
    organization?: string;
    contribution?: number;
    rank?: string;
    rating?: number;
    maxRank?: string;
    maxRating?: number;
    lastOnlineTimeSeconds?: number;
    registrationTimeSeconds?: number;
    friendOfCount?: number;
    avatar?: string;
    titlePhoto?: string;
}

export interface CFRatingChange {
    contestId: number;
    contestName: string;
    handle: string;
    rank: number;
    ratingUpdateTimeSeconds: number;
    oldRating: number;
    newRating: number;
}

export interface CFProblem {
    contestId?: number;
    problemsetArchive?: string;
    index: string;
    name: string;
    type?: string;
    points?: number;
    rating?: number;
    tags?: string[];
}

export interface CFSubmission {
    id: number;
    contestId?: number;
    creationTimeSeconds?: number;
    relativeTimeSeconds?: number;
    problem: CFProblem;
    programmingLanguage: string;
    verdict?: string;
    testset?: string;
    passedTestCount?: number;
    timeConsumedMillis: number;
    memoryConsumedBytes?: number;
}

export function extractHandle(input: string): string {
    if (!input) return "";
    let trimmed = input.trim();
    if (trimmed.includes("codeforces.com/profile/")) {
        const parts = trimmed.split("codeforces.com/profile/");
        return parts[1]?.split("/")[0]?.split("?")[0] || "";
    }
    return trimmed.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function getRankColor(rank?: string): string {
    if (!rank) return "var(--text-primary)";
    const r = rank.toLowerCase();
    if (r.includes("legendary grandmaster") || r.includes("grandmaster")) return "#ef4444";
    if (r.includes("master")) return "#f97316";
    if (r.includes("candidate master")) return "#a855f7";
    if (r.includes("expert")) return "#3b82f6";
    if (r.includes("specialist")) return "#03a89e";
    if (r.includes("pupil")) return "#10b981";
    if (r.includes("newbie")) return "#808080";
    return "var(--text-primary)";
}

export default function CodeforcesStats() {
    const { user } = useAuth();
    const [handle, setHandle] = useState<string>("");
    const [inputHandle, setInputHandle] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isApiDown, setIsApiDown] = useState<boolean>(false);

    const [userInfo, setUserInfo] = useState<CFUser | null>(null);
    const [ratings, setRatings] = useState<CFRatingChange[]>([]);
    const [submissions, setSubmissions] = useState<CFSubmission[]>([]);

    useEffect(() => {
        let defaultHandle = "";
        if (user?.codeforcesLink) {
            defaultHandle = extractHandle(user.codeforcesLink);
        }
        if (defaultHandle) {
            setHandle(defaultHandle);
            setInputHandle(defaultHandle);
        }
    }, [user]);

    const fetchCFData = async (targetHandle: string) => {
        if (!targetHandle) return;
        setLoading(true);
        setError(null);
        setIsApiDown(false);

        try {
            const cleanHandle = extractHandle(targetHandle);

            // Fetch user info, rating changes, and status in parallel
            const [infoRes, ratingRes, statusRes] = await Promise.all([
                axios.get(`https://codeforces.com/api/user.info?handles=${cleanHandle}`),
                axios.get(`https://codeforces.com/api/user.rating?handle=${cleanHandle}`).catch(() => ({ data: { status: "FAILED", result: [] } })),
                axios.get(`https://codeforces.com/api/user.status?handle=${cleanHandle}&from=1&count=1000`).catch(() => ({ data: { status: "FAILED", result: [] } }))
            ]);

            if (infoRes.data.status === "OK" && infoRes.data.result?.length > 0) {
                setUserInfo(infoRes.data.result[0]);
            } else {
                const comment = infoRes.data.comment || "";
                if (comment.toLowerCase().includes("limit") || comment.toLowerCase().includes("overload") || comment.toLowerCase().includes("disabled")) {
                    setIsApiDown(true);
                    throw new Error("Codeforces API servers are currently overloaded or down. Please try again later.");
                }
                throw new Error(comment || "User not found on Codeforces");
            }

            if (ratingRes.data.status === "OK") {
                setRatings(ratingRes.data.result || []);
            } else {
                setRatings([]);
            }

            if (statusRes.data.status === "OK") {
                setSubmissions(statusRes.data.result || []);
            } else {
                setSubmissions([]);
            }

            setHandle(cleanHandle);
        } catch (err: any) {
            console.error("Codeforces API error:", err);
            const status = err.response?.status;
            const comment = err.response?.data?.comment || "";
            const isDown = status === 503 || status === 500 || status === 502 || status === 504 || status === 429 || err.code === "ERR_NETWORK" || err.message === "Network Error" || comment.toLowerCase().includes("limit") || comment.toLowerCase().includes("overload") || comment.toLowerCase().includes("disabled") || isApiDown;

            if (isDown) {
                setIsApiDown(true);
                setError("Codeforces API is currently down, experiencing high load, or under maintenance. Please try again later.");
            } else {
                setIsApiDown(false);
                setError(err.message || "Failed to load Codeforces data. Please verify the handle.");
            }
            setUserInfo(null);
            setRatings([]);
            setSubmissions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (handle) {
            fetchCFData(handle);
        }
    }, [handle]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputHandle.trim()) {
            fetchCFData(inputHandle.trim());
        }
    };

    // Calculate Analytics
    const solvedSet = new Set<string>();
    const ratingBuckets: Record<string, number> = {};
    const verdictCounts: Record<string, number> = { OK: 0, WRONG_ANSWER: 0, TIME_LIMIT_EXCEEDED: 0, OTHER: 0 };
    const langCounts: Record<string, number> = {};

    submissions.forEach(sub => {
        // Verdict counting
        if (sub.verdict === "OK") {
            verdictCounts.OK++;
            const probId = `${sub.problem.contestId || 0}_${sub.problem.index}_${sub.problem.name}`;
            if (!solvedSet.has(probId)) {
                solvedSet.add(probId);

                // Rating distribution
                if (sub.problem.rating) {
                    const r = sub.problem.rating;
                    const bucket = r >= 2400 ? "2400+" : `${Math.floor(r / 200) * 200}`;
                    ratingBuckets[bucket] = (ratingBuckets[bucket] || 0) + 1;
                }
            }
        } else if (sub.verdict === "WRONG_ANSWER") {
            verdictCounts.WRONG_ANSWER++;
        } else if (sub.verdict === "TIME_LIMIT_EXCEEDED") {
            verdictCounts.TIME_LIMIT_EXCEEDED++;
        } else {
            verdictCounts.OTHER++;
        }

        // Language counting
        if (sub.programmingLanguage) {
            const lang = sub.programmingLanguage.split(" ")[0] || sub.programmingLanguage;
            langCounts[lang] = (langCounts[lang] || 0) + 1;
        }
    });

    const totalSubmissions = submissions.length;
    const solvedCount = solvedSet.size;
    const acceptanceRate = totalSubmissions > 0 ? ((verdictCounts.OK / totalSubmissions) * 100).toFixed(1) : "0";

    const rankColor = getRankColor(userInfo?.rank);

    return (
        <div className="cf-stats-page">
            {/* Top Bar Header */}
            <div className="cf-header-bar">
                <div className="cf-title-group">
                    <div className="cf-logo-icon">
                        <Code2 size={22} />
                    </div>
                    <div>
                        <h1 className="cf-title">Codeforces Analytics</h1>
                        <p className="cf-subtitle">Live rating history, problem solving breakdown, and submission stats</p>
                    </div>
                </div>

                <form onSubmit={handleSearchSubmit} className="cf-search-box">
                    <Search size={16} className="text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search CF handle…"
                        value={inputHandle}
                        onChange={(e) => setInputHandle(e.target.value)}
                        className="cf-search-input"
                    />
                    <button type="submit" disabled={loading} className="cf-search-btn">
                        {loading ? "Loading…" : "Search"}
                    </button>
                </form>
            </div>

            {/* Error Message Banner (Standard validation error) */}
            {error && !isApiDown && (
                <div className="auth-alert-banner mb-6">
                    <XCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* API Down Alert Card */}
            {isApiDown && (
                <div className="cf-api-down-card">
                    <div className="cf-api-down-icon">
                        <WifiOff size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Codeforces API is Temporarily Down</h2>
                        <p className="text-sm text-zinc-400 max-w-md mx-auto">
                            The Codeforces API is currently experiencing downtime, heavy load, or undergoing maintenance. Please try again later.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <button
                            onClick={() => fetchCFData(handle || inputHandle)}
                            disabled={loading}
                            className="cf-search-btn flex items-center gap-1.5 px-4 py-2"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            <span>{loading ? "Retrying…" : "Try Again Later"}</span>
                        </button>
                        <a
                            href="https://codeforces.com"
                            target="_blank"
                            rel="noreferrer"
                            className="social-btn py-2 px-4 text-xs"
                        >
                            <span>Open Codeforces.com</span>
                            <ExternalLink size={14} />
                        </a>
                    </div>
                </div>
            )}

            {/* Empty State when no handle is set */}
            {!handle && !loading && !isApiDown && (
                <div className="cf-empty-card">
                    <Code2 size={48} className="text-zinc-500" />
                    <div>
                        <h2 className="text-lg font-bold text-white mb-1">No Codeforces Account Selected</h2>
                        <p className="text-sm text-zinc-400">
                            Enter a Codeforces handle in the search bar above, or link your Codeforces profile in your User Settings.
                        </p>
                    </div>
                </div>
            )}

            {/* Main Stats View */}
            {userInfo && (
                <>
                    {/* User Info Header Card */}
                    <div className="cf-user-card">
                        <div className="cf-user-main">
                            <img
                                src={userInfo.avatar || userInfo.titlePhoto || "https://codeforces.org/s/0/images/user-image.png"}
                                alt={userInfo.handle}
                                className="cf-avatar"
                            />
                            <div className="cf-user-info">
                                <div className="cf-handle-row">
                                    <h2 className="cf-handle-name" style={{ color: rankColor }}>
                                        {userInfo.handle}
                                    </h2>
                                    {userInfo.rank && (
                                        <span className="cf-rank-badge" style={{ background: `${rankColor}20`, color: rankColor, borderColor: `${rankColor}40` }}>
                                            {userInfo.rank}
                                        </span>
                                    )}
                                </div>

                                <div className="cf-user-meta">
                                    {userInfo.organization && (
                                        <span className="cf-meta-item">
                                            <Users size={14} className="text-zinc-400" />
                                            {userInfo.organization}
                                        </span>
                                    )}
                                    {userInfo.country && (
                                        <span className="cf-meta-item">
                                            <Activity size={14} className="text-zinc-400" />
                                            {userInfo.country}
                                        </span>
                                    )}
                                    <span className="cf-meta-item">
                                        <Zap size={14} className="text-amber-400" />
                                        Contribution: {userInfo.contribution ?? 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchCFData(handle)}
                                className="cf-search-btn flex items-center gap-1.5"
                                title="Refresh Codeforces Data"
                            >
                                <RefreshCw size={14} />
                                <span>Refresh</span>
                            </button>
                            <a
                                href={`https://codeforces.com/profile/${userInfo.handle}`}
                                target="_blank"
                                rel="noreferrer"
                                className="social-btn py-1.5 px-3 text-xs"
                            >
                                <span>View Profile</span>
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>

                    {/* Metrics Highlights Bar */}
                    <div className="cf-metrics-grid">
                        <div className="cf-metric-card">
                            <span className="cf-metric-label">
                                <Trophy size={14} style={{ color: rankColor }} />
                                Current Rating
                            </span>
                            <span className="cf-metric-value" style={{ color: rankColor }}>
                                {userInfo.rating ?? "Unrated"}
                            </span>
                            <span className="cf-metric-subtext">Rank: {userInfo.rank || "N/A"}</span>
                        </div>

                        <div className="cf-metric-card">
                            <span className="cf-metric-label">
                                <Award size={14} className="text-purple-400" />
                                Max Rating
                            </span>
                            <span className="cf-metric-value">
                                {userInfo.maxRating ?? "N/A"}
                            </span>
                            <span className="cf-metric-subtext">Peak: {userInfo.maxRank || "N/A"}</span>
                        </div>

                        <div className="cf-metric-card">
                            <span className="cf-metric-label">
                                <CheckCircle2 size={14} className="text-emerald-400" />
                                Problems Solved
                            </span>
                            <span className="cf-metric-value text-emerald-400">
                                {solvedCount}
                            </span>
                            <span className="cf-metric-subtext">From {totalSubmissions} submissions</span>
                        </div>

                        <div className="cf-metric-card">
                            <span className="cf-metric-label">
                                <TrendingUp size={14} className="text-blue-400" />
                                Acceptance Rate
                            </span>
                            <span className="cf-metric-value text-blue-400">
                                {acceptanceRate}%
                            </span>
                            <span className="cf-metric-subtext">{verdictCounts.OK} ACs out of {totalSubmissions}</span>
                        </div>
                    </div>

                    {/* Analytics Grid */}
                    <div className="cf-analytics-grid">
                        {/* Rating Distribution */}
                        <div className="cf-card-panel">
                            <h3 className="cf-panel-title">
                                <BarChart3 size={16} className="text-indigo-400" />
                                Problem Rating Distribution
                            </h3>
                            <div className="cf-bar-list">
                                {Object.keys(ratingBuckets).length === 0 ? (
                                    <p className="text-xs text-zinc-500 italic py-4">No problem rating data found</p>
                                ) : (
                                    Object.entries(ratingBuckets)
                                        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                                        .map(([bucket, count]) => {
                                            const pct = ((count / Math.max(...Object.values(ratingBuckets))) * 100).toFixed(0);
                                            return (
                                                <div key={bucket} className="cf-bar-item">
                                                    <div className="cf-bar-info">
                                                        <span>Difficulty {bucket}</span>
                                                        <span className="font-semibold">{count} solved</span>
                                                    </div>
                                                    <div className="cf-bar-track">
                                                        <div className="cf-bar-fill" style={{ width: `${pct}%`, background: "var(--accent-primary)" }} />
                                                    </div>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>

                        {/* Recent Contests Delta */}
                        <div className="cf-card-panel">
                            <h3 className="cf-panel-title">
                                <Trophy size={16} className="text-amber-400" />
                                Recent Contest History ({ratings.length})
                            </h3>
                            <div className="cf-bar-list">
                                {ratings.length === 0 ? (
                                    <p className="text-xs text-zinc-500 italic py-4">No contest participation recorded</p>
                                ) : (
                                    ratings.slice(-5).reverse().map((contest) => {
                                        const delta = contest.newRating - contest.oldRating;
                                        const isPositive = delta >= 0;
                                        return (
                                            <div key={contest.contestId} className="cf-contest-item">
                                                <div className="cf-contest-info">
                                                    <p className="cf-contest-name" title={contest.contestName}>{contest.contestName}</p>
                                                    <p className="cf-contest-rank">Rank: #{contest.rank}</p>
                                                </div>
                                                <div className="cf-contest-stats">
                                                    <span className={`cf-delta-badge ${isPositive ? 'positive' : 'negative'}`}>
                                                        {isPositive ? `+${delta}` : delta}
                                                    </span>
                                                    <p className="cf-rating-transition">{contest.oldRating} → {contest.newRating}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Submissions Panel */}
                    <div className="cf-card-panel">
                        <h3 className="cf-panel-title">
                            <Clock size={16} className="text-sky-400" />
                            Recent Submissions
                        </h3>

                        <div className="cf-table-container">
                            <table className="cf-table">
                                <thead>
                                    <tr>
                                        <th>Problem</th>
                                        <th>Difficulty</th>
                                        <th>Verdict</th>
                                        <th>Language</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.slice(0, 10).map((sub) => {
                                        const isOk = sub.verdict === "OK";
                                        const isWa = sub.verdict === "WRONG_ANSWER";
                                        const isTle = sub.verdict === "TIME_LIMIT_EXCEEDED";

                                        return (
                                            <tr key={sub.id}>
                                                <td>
                                                    <a
                                                        href={`https://codeforces.com/problemset/problem/${sub.problem.contestId}/${sub.problem.index}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-medium hover:underline text-indigo-300"
                                                    >
                                                        {sub.problem.index}. {sub.problem.name}
                                                    </a>
                                                </td>
                                                <td>
                                                    {sub.problem.rating ? (
                                                        <span className="badge badge-primary">{sub.problem.rating}</span>
                                                    ) : (
                                                        <span className="text-zinc-500">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={isOk ? "verdict-ok" : isWa ? "verdict-wa" : isTle ? "verdict-tle" : "verdict-other"}>
                                                        {sub.verdict ? sub.verdict.replace(/_/g, " ") : "Testing"}
                                                    </span>
                                                </td>
                                                <td className="text-zinc-400">{sub.programmingLanguage}</td>
                                                <td className="text-zinc-400">{sub.timeConsumedMillis} ms</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
