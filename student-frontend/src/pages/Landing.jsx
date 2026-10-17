import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const features = [
    { icon: '🤖', title: 'AI-Powered Tutoring', desc: 'Get instant answers from our intelligent AI tutor powered by advanced language models' },
    { icon: '📹', title: 'Live Face-to-Face Classes', desc: 'Connect with instructors in real-time virtual classrooms with HD video' },
    { icon: '🎯', title: 'Adaptive Learning', desc: 'Personalized learning paths that adjust to your pace and performance' },
    { icon: '📊', title: 'Real-Time Analytics', desc: 'Track progress with detailed insights and performance metrics' },
];

export default function Landing() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsError, setStatsError] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        const visibilityTimeout = setTimeout(() => setIsVisible(true), 100);

        fetchStats(controller.signal);

        return () => {
            controller.abort();
            clearTimeout(visibilityTimeout);
        };
    }, []);

    const fetchStats = async (signal) => {
        try {
            const response = await api.get('/analytics/public/stats', { signal });
            const data = response.data;
            const activeStudents = Number(data.active_students);
            const instructors = Number(data.instructors);
            const courses = Number(data.courses);
            const successRate = Number(data.success_rate);

            if (![activeStudents, instructors, courses, successRate].every(Number.isFinite)) {
                throw new Error('The public stats response contains invalid values');
            }

            setStats([
                { value: activeStudents.toLocaleString(), label: 'Active Students' },
                { value: instructors.toLocaleString(), label: 'Expert Instructors' },
                { value: courses.toLocaleString(), label: 'Courses Available' },
                { value: `${Math.round(successRate)}%`, label: 'Success Rate' },
            ]);
        } catch (error) {
            if (!signal.aborted) {
                console.error('Failed to fetch public stats:', error);
                setStatsError(true);
                // Use fallback data if API fails
                setStats([
                    { value: '1,000+', label: 'Active Students' },
                    { value: '50+', label: 'Expert Instructors' },
                    { value: '100+', label: 'Courses Available' },
                    { value: '95%', label: 'Success Rate' },
                ]);
            }
        } finally {
            if (!signal.aborted) setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br from-[#0d0d1a] via-[#1a0533] to-[#0d0d1a] transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Navbar */}
            <nav className="flex items-center justify-between px-8 py-4 animate-fade-in-down">
                <div className="flex items-center gap-2 group cursor-pointer">
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🎓</span>
                    <span className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300">EduVerse</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-white hover:text-purple-300 transition-all duration-300 text-sm font-medium hover:scale-105 transform">Sign In</Link>
                    <Link to="/register" className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 transform">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <div className="text-center px-6 pt-16 pb-12 animate-fade-in-up">
                <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight animate-gradient-text">
                    Transform Your Learning
                </h1>
                <h2 className="text-5xl md:text-6xl font-extrabold mt-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient-shift">
                    Experience
                </h2>
                <p className="text-gray-300 mt-6 max-w-2xl mx-auto text-lg animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    Join the future of education with AI-powered tutoring, live video classes, and personalized learning paths designed for 100% growth
                </p>
                <div className="flex items-center justify-center gap-4 mt-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <Link to="/register" className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white font-semibold hover:opacity-90 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-purple-500/50 transform text-lg">
                        Start Learning Free
                    </Link>
                    <button className="px-8 py-3 bg-white/10 border border-white/20 rounded-full text-white font-semibold hover:bg-white/20 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-white/20 transform text-lg">
                        Watch Demo
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-8 py-10 border-t border-b border-white/10 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                {stats?.map((s) => (
                    <div key={s.label} className="text-center group cursor-default">
                        <div className="text-3xl font-extrabold text-white group-hover:scale-110 transition-transform duration-300">{s.value}</div>
                        <div className="text-gray-400 text-sm mt-1 group-hover:text-purple-300 transition-colors duration-300">{s.label}</div>
                    </div>
                ))}
                {!stats && ['Active Students', 'Expert Instructors', 'Courses Available', 'Success Rate'].map((label) => (
                    <div key={label} className="text-center" aria-live="polite">
                        <div className="text-3xl font-extrabold text-white">
                            {loading ? '...' : statsError ? 'Unavailable' : '—'}
                        </div>
                        <div className="text-gray-400 text-sm mt-1">{label}</div>
                    </div>
                ))}
            </div>

            {/* Features */}
            <div className="px-8 py-16 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                <h2 className="text-3xl font-bold text-white text-center mb-2">Advanced Learning Features</h2>
                <p className="text-gray-400 text-center mb-10">Everything you need to succeed in modern education</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {features.map((f, index) => (
                        <div key={f.title} className="bg-[#1a1a35]/60 border border-purple-900/30 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 transform group">
                            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                {f.icon}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">{f.title}</h3>
                            <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="mx-8 mb-16 bg-gradient-to-br from-purple-600/40 to-pink-600/40 border border-purple-500/30 rounded-3xl p-12 text-center animate-fade-in-up hover:scale-105 transition-transform duration-500" style={{ animationDelay: '1s' }}>
                <div className="text-5xl mb-4">🚀</div>
                <h2 className="text-3xl font-bold text-white mb-3">Ready to Transform Your Learning?</h2>
                <p className="text-gray-300 mb-8">Join thousands of students achieving 100% growth with our AI-powered platform</p>
                <Link to="/register" className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white font-semibold hover:opacity-90 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-purple-500/50 transform text-lg inline-block">
                    Get Started Now
                </Link>
            </div>

            {/* Footer */}
            <footer className="text-center py-6 text-gray-500 text-sm border-t border-white/10 animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
                © 2026 EduVerse. Empowering learners worldwide with AI.
            </footer>
        </div>
    );
}
