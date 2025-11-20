import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, orderBy, limit, collectionGroup, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';

// --- ICONS & ASSETS ---
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const RefreshIcon = ({ spinning }: { spinning: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={spinning ? "animate-spin" : ""}><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;

// --- COMPONENTS ---

const StatCard = ({ title, value, subvalue, color, trend }: any) => (
    <div className="relative overflow-hidden bg-dark-card/50 border border-white/5 rounded-2xl p-6 group hover:bg-white/5 transition-all duration-300">
        <div className={`absolute top-0 right-0 p-20 rounded-full blur-3xl opacity-10 transition-opacity duration-500 group-hover:opacity-20 ${color === 'primary' ? 'bg-primary' : color === 'accent' ? 'bg-accent' : 'bg-secondary'}`}></div>
        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">{title}</h3>
        <div className="flex items-end gap-3 mb-1">
            <span className="text-3xl font-display font-bold text-white">{value}</span>
            {trend && <span className="text-xs text-green-400 mb-1.5">{trend}</span>}
        </div>
        <p className="text-xs text-gray-500">{subvalue}</p>
    </div>
);

const ActivityChart = () => (
    <div className="w-full h-32 relative">
        <svg viewBox="0 0 500 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7F00FF" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#7F00FF" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d="M0,100 L0,80 Q50,50 100,70 T200,40 T300,60 T400,20 T500,50 L500,100 Z" fill="url(#chartGradient)" />
            <path d="M0,80 Q50,50 100,70 T200,40 T300,60 T400,20 T500,50" fill="none" stroke="#7F00FF" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="drop-shadow-[0_0_10px_rgba(127,0,255,0.5)]" />
        </svg>
        <div className="absolute top-[20%] left-[80%] w-3 h-3 bg-white rounded-full shadow-[0_0_15px_white] animate-pulse"></div>
    </div>
);

const UserRow = ({ email, role, createdAt, uid }: any) => {
    const dateStr = createdAt ? new Date(createdAt).toLocaleDateString('fr-FR') : 'N/A';
    return (
        <div className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-300 group-hover:border-accent/50 group-hover:text-white transition-colors">
                    {email.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="text-sm font-medium text-white">{email}</p>
                    <div className="flex items-center gap-2">
                        <p className={`text-[10px] font-bold uppercase ${role === 'admin' ? 'text-primary' : 'text-gray-500'}`}>{role}</p>
                        <span className="text-[9px] text-gray-600 font-mono">{uid.slice(0, 6)}...</span>
                    </div>
                </div>
            </div>
            <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400">Inscrit le {dateStr}</p>
                <p className="text-[10px] font-bold uppercase text-green-400">Actif</p>
            </div>
        </div>
    );
};

const LogRow = ({ style, ambiance, timestamp, imageCount }: any) => {
    let timeStr = 'Date inconnue';
    if (timestamp) {
        // Handle Firestore Timestamp or Date string
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        timeStr = date.toLocaleString('fr-FR');
    }

    return (
        <div className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
             <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-accent">
                    <ImageIcon />
                 </div>
                 <div>
                     <p className="text-sm font-bold text-white capitalize">{style || 'Style Inconnu'}</p>
                     <p className="text-xs text-gray-500">{ambiance}</p>
                 </div>
             </div>
             <div className="text-right">
                 <p className="text-xs text-white font-mono font-bold">{imageCount || 0} images</p>
                 <p className="text-[10px] text-gray-500">{timeStr}</p>
             </div>
        </div>
    );
}


// --- MAIN DASHBOARD ---

const AdminDashboard: React.FC = () => {
    const auth = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content'>('overview');
    
    // Real Data States
    const [users, setUsers] = useState<any[]>([]);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalGenerations: 0,
        recentGenerations: 0 // Last 24h
    });
    const [loading, setLoading] = useState(true);

    const fetchRealData = useCallback(async () => {
        if (!auth?.isAdmin) return;
        setLoading(true);

        try {
            // 1. Fetch Users
            const usersCollection = collection(db, 'users');
            // Pour le compte total, on utilise getCountFromServer (Quota friendly)
            const userCountSnapshot = await getCountFromServer(usersCollection);
            
            // On récupère les derniers inscrits pour la liste
            const recentUsersQuery = query(usersCollection, limit(10));
            const userSnapshot = await getDocs(recentUsersQuery);
            const usersList = userSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
            setUsers(usersList);

            // 2. Fetch History (Global Activity via Collection Group)
            const historyGroup = collectionGroup(db, 'history');

            try {
                // Compte total absolu grâce à l'index
                const totalHistorySnapshot = await getCountFromServer(historyGroup);
                const totalCount = totalHistorySnapshot.data().count;

                // Logs récents
                const historyQuery = query(historyGroup, orderBy('timestamp', 'desc'), limit(50));
                const historySnapshot = await getDocs(historyQuery);
                const logs = historySnapshot.docs.map(doc => doc.data());
                setActivityLogs(logs);
                
                setStats({
                    totalUsers: userCountSnapshot.data().count,
                    totalGenerations: totalCount, 
                    recentGenerations: logs.length
                });
            } catch (err) {
                console.warn("History fetch failed. Index might be propagating.", err);
                // Fallback stats if index is still building
                setStats(prev => ({
                    ...prev,
                    totalUsers: userCountSnapshot.data().count
                }));
            }

        } catch (error) {
            console.error("Admin Dashboard Error:", error);
        } finally {
            setLoading(false);
        }
    }, [auth?.isAdmin]);

    useEffect(() => {
        fetchRealData();
    }, [fetchRealData]);

    if (!auth?.isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Accès Restreint</h2>
                <p className="text-gray-400 max-w-md">
                    Cette zone est réservée aux administrateurs du système. Votre niveau d'accréditation est insuffisant.
                </p>
            </div>
        );
    }

    return (
        <div className="animate-slide-up pb-20">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                        Nexus de Contrôle
                        <span className="px-2 py-0.5 rounded-md bg-primary/20 border border-primary/30 text-primary text-[10px] uppercase tracking-wider font-sans font-bold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            LIVE
                        </span>
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Supervision globale de l'infrastructure Aura.</p>
                </div>
                
                {/* Controls */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchRealData} 
                        disabled={loading}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Actualiser les données"
                    >
                        <RefreshIcon spinning={loading} />
                    </button>

                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                        {[
                            { id: 'overview', label: 'Vue Globale', icon: <ActivityIcon /> },
                            { id: 'users', label: 'Utilisateurs', icon: <UsersIcon /> },
                            { id: 'content', label: 'Activités', icon: <ImageIcon /> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-white/10 text-white shadow-lg' 
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading && !users.length ? (
                 <div className="flex flex-col items-center justify-center py-20">
                     <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                     <div className="text-gray-500 text-sm">Synchronisation avec le Core...</div>
                 </div>
            ) : (
                <>
                    {/* CONTENT AREA */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard title="Utilisateurs Inscrits" value={stats.totalUsers} subvalue="Base de Données" color="primary" trend="" />
                                <StatCard title="Générations Totales" value={stats.totalGenerations} subvalue="Depuis le lancement" color="accent" trend="▲" />
                                <StatCard title="Activité Récente" value={activityLogs.length} subvalue="Dernières requêtes (log)" color="secondary" />
                                <StatCard title="État API" value="Opérationnel" subvalue="Gemini 2.5 Flash" color="green" />
                            </div>

                            {/* Chart Section */}
                            <div className="bg-dark-card border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-white">Flux de Données</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        <span className="text-xs text-gray-400">Connecté</span>
                                    </div>
                                </div>
                                <ActivityChart />
                                <div className="grid grid-cols-4 gap-4 mt-6 text-center">
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <p className="text-xs text-gray-500 uppercase">Base</p>
                                        <p className="text-lg font-mono font-bold text-primary">Firestore</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <p className="text-xs text-gray-500 uppercase">IA Model</p>
                                        <p className="text-lg font-mono font-bold text-green-400">V 2.5</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <p className="text-xs text-gray-500 uppercase">Index</p>
                                        <p className="text-lg font-mono font-bold text-accent">Actif</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <p className="text-xs text-gray-500 uppercase">Quota</p>
                                        <p className="text-lg font-mono font-bold text-gray-300">Free</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity Split */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-dark-card border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                        <h3 className="font-bold text-white text-sm uppercase tracking-wide">Derniers Inscrits</h3>
                                        <button onClick={() => setActiveTab('users')} className="text-xs text-accent hover:underline">Voir tout</button>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                        {users.slice(0, 5).map((user, i) => (
                                            <UserRow key={i} {...user} />
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="bg-dark-card border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                        <h3 className="font-bold text-white text-sm uppercase tracking-wide">Flux de Production</h3>
                                        <button onClick={() => setActiveTab('content')} className="text-xs text-accent hover:underline">Voir tout</button>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {activityLogs.length === 0 ? (
                                            <div className="p-6 text-center text-gray-500 text-xs italic">
                                                En attente de données ou indexation en cours...
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-white/5">
                                                {activityLogs.slice(0, 6).map((log, i) => (
                                                    <div key={i} className="flex gap-3 items-center p-3 hover:bg-white/5 transition-colors">
                                                        <div className="w-2 h-2 rounded-full bg-accent shrink-0 animate-pulse"></div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-baseline">
                                                                <p className="text-sm text-gray-200 font-medium truncate">{log.style}</p>
                                                                <span className="text-[10px] text-gray-500 font-mono">{log.imageCount} img</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 truncate">{log.ambiance}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="animate-fade-in bg-dark-card border border-white/5 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/5 flex gap-4">
                                <div className="relative flex-1">
                                    <SearchIcon />
                                    <input 
                                        type="text" 
                                        placeholder="Rechercher un utilisateur (bientôt disponible)..." 
                                        disabled
                                        className="absolute inset-0 w-full bg-transparent pl-10 text-sm text-white placeholder-gray-600 outline-none cursor-not-allowed opacity-50"
                                    />
                                </div>
                            </div>
                            <div className="divide-y divide-white/5">
                                {users.map((user, i) => (
                                    <UserRow key={i} {...user} />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="animate-fade-in bg-dark-card border border-white/5 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/5">
                                <h3 className="font-bold text-white text-lg">Journal des Générations</h3>
                                <p className="text-gray-500 text-sm">Historique complet des requêtes IA (Métadonnées uniquement).</p>
                            </div>
                            <div className="divide-y divide-white/5">
                                {activityLogs.length > 0 ? activityLogs.map((log, i) => (
                                    <LogRow key={i} {...log} />
                                )) : (
                                    <div className="p-8 text-center text-gray-500">
                                        Aucune donnée disponible pour le moment.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminDashboard;