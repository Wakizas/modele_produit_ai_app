
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

interface DashboardProps {
    onStartNew: () => void;
}

const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

const NEURAL_TIPS = [
    {
        category: "Qualité d'Entrée",
        title: "La photo source est reine.",
        text: "Assurez-vous que votre photo produit est nette et bien éclairée. L'IA préserve les détails de votre image originale : meilleure est la source, plus réaliste sera le rendu final sur le mannequin."
    },
    {
        category: "Description Produit",
        title: "Les mots créent la matière.",
        text: "Ne négligez pas l'étape de description. Précisez les matériaux (ex: 'velours côtelé', 'métal brossé') pour que l'IA puisse simuler correctement les reflets et la physique du tissu."
    },
    {
        category: "Stratégie de Marque",
        title: "Ciblez votre audience.",
        text: "Utilisez les réglages d'âge et de style pour aligner le mannequin avec votre clientèle cible. Une représentation authentique augmente l'identification et l'engagement."
    },
    {
        category: "Contexte d'Usage",
        title: "Adaptez le décor.",
        text: "Pour une fiche produit e-commerce, privilégiez les fonds 'Studio' neutres. Pour Instagram ou la publicité, osez les ambiances 'Lifestyle' ou 'Néon' pour capter l'attention."
    }
];

const Dashboard: React.FC<DashboardProps> = ({ onStartNew }) => {
    const { userProfile, currentUser, logout } = useAuth() || {};
    // Prioritize displayName (Username), fallback to email prefix
    const displayName = userProfile?.displayName || (userProfile?.email ? userProfile.email.split('@')[0] : 'Créateur');
    
    const [stats, setStats] = useState({ count: 0, favoriteStyle: '--', loading: true });

    // Slider State
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    // Stats Fetching
    useEffect(() => {
        const fetchStats = async () => {
            if (!currentUser) return;
            try {
                const historyRef = collection(db, "users", currentUser.uid, "history");
                const q = query(historyRef, orderBy("timestamp", "desc"), limit(50));
                const querySnapshot = await getDocs(q);
                
                const count = querySnapshot.size;
                let favorite = '--';
                
                if (count > 0) {
                    const styles: Record<string, number> = {};
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        const style = data.style || 'Inconnu';
                        styles[style] = (styles[style] || 0) + 1;
                    });
                    favorite = Object.keys(styles).reduce((a, b) => styles[a] > styles[b] ? a : b);
                }

                setStats({ count, favoriteStyle: favorite.charAt(0).toUpperCase() + favorite.slice(1), loading: false });
            } catch (error) {
                console.error("Error fetching stats:", error);
                setStats(prev => ({ ...prev, loading: false }));
            }
        };

        fetchStats();
    }, [currentUser]);

    // Slider Logic
    const nextTip = () => {
        setCurrentTipIndex((prev) => (prev + 1) % NEURAL_TIPS.length);
    };

    const prevTip = () => {
        setCurrentTipIndex((prev) => (prev - 1 + NEURAL_TIPS.length) % NEURAL_TIPS.length);
    };

    useEffect(() => {
        if (isPaused) return;
        timeoutRef.current = window.setTimeout(nextTip, 8000); // 8 seconds auto-play
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [currentTipIndex, isPaused]);

    return (
        <div className="animate-slide-up pb-20">
            {/* Top Header with Date and Status */}
            <div className="relative flex flex-col md:flex-row md:justify-between md:items-end mb-8 px-2">
                <div className="mt-2 md:mt-0 pr-12 md:pr-0">
                    <p className="text-gray-400 text-xs md:text-sm font-medium mb-1 uppercase tracking-widest">
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h1 className="text-3xl md:text-5xl font-display font-bold text-white break-words">
                        Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent capitalize">{displayName}</span>
                    </h1>
                </div>
                
                <div className="absolute top-0 right-0 md:relative md:top-auto md:right-auto">
                    <button 
                        onClick={() => logout && logout()} 
                        className="flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full bg-white/10 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 transition-all group shadow-lg backdrop-blur-md"
                        aria-label="Déconnexion"
                    >
                        <span className="hidden md:inline text-sm font-bold text-gray-300 group-hover:text-red-400">Déconnexion</span>
                        <span className="text-gray-400 group-hover:text-red-400"><LogoutIcon /></span>
                    </button>
                </div>
            </div>

            {/* Hero Section - Create */}
            <div 
                onClick={onStartNew}
                className="group relative w-full h-[340px] md:h-[400px] rounded-3xl overflow-hidden cursor-pointer border border-white/10 shadow-2xl mb-12 transition-transform duration-500 hover:scale-[1.01] bg-[#1a1512]"
            >
                {/* Background Animation & Image */}
                <div className="absolute inset-0 z-0">
                    {/* Left Blob - Warm earthy tone to match the beige/brown of the image */}
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-orange-900/20 rounded-full blur-[100px] group-hover:bg-orange-800/30 transition-all duration-1000"></div>
                    {/* Right Blob - Deep purple to match AfroVibe brand but darker */}
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-[#2E1A47]/40 rounded-full blur-[100px] group-hover:bg-[#3b215c]/50 transition-all duration-1000"></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                    
                    {/* African Model Image */}
                     <div className="absolute right-0 bottom-0 h-full w-1/2 md:w-7/12 opacity-100 transition-all duration-1000 mix-blend-normal group-hover:scale-105">
                        {/* Gradient Mask for seamless blending with dark background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1512] via-[#1a1512]/20 to-transparent z-10"></div>
                        <img 
                            src="https://images.pexels.com/photos/29831745/pexels-photo-29831745.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                            className="h-full w-full object-cover object-top" 
                            alt="Modele Afro Style" 
                            style={{ maskImage: 'linear-gradient(to right, transparent 5%, black 50%)', WebkitMaskImage: 'linear-gradient(to right, transparent 5%, black 50%)' }}
                        />
                    </div>
                </div>

                {/* Content - Aligned slightly left to accommodate the image on the right */}
                <div className="relative z-20 h-full flex flex-col items-center md:items-start justify-center text-center md:text-left p-8 md:pl-16 max-w-2xl">
                    <div className="w-16 h-16 rounded-full bg-primary border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(127,0,255,0.6)] group-hover:scale-110 transition-transform duration-300">
                         <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 tracking-tight drop-shadow-lg">
                        Nouvelle Campagne
                    </h2>
                    <p className="text-gray-300 text-lg mb-8 font-light drop-shadow-md max-w-md">
                        Lancez une session de génération. Transformez vos produits en œuvres d'art visuelles.
                    </p>
                    <span className="px-8 py-3 bg-white text-black font-bold rounded-full text-sm uppercase tracking-wide hover:bg-gray-100 transition-colors shadow-lg">
                        Accéder au Studio
                    </span>
                </div>
            </div>

            {/* Creative Flux Section */}
            <div className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Card 1: Neural Tips Slider */}
                <div 
                    className="bg-gradient-to-br from-bg-card to-black border border-white/10 rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[240px]"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                     <div className="absolute top-4 right-4 opacity-20">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path></svg>
                     </div>
                     
                     <div>
                        <span className="text-accent text-xs font-bold uppercase tracking-widest mb-4 block">
                            Conseil Neural • {currentTipIndex + 1}/{NEURAL_TIPS.length}
                        </span>
                        <div className="animate-fade-in" key={currentTipIndex}>
                            <h3 className="text-2xl font-display font-bold text-white mb-3 min-h-[32px]">
                                {NEURAL_TIPS[currentTipIndex].title}
                            </h3>
                            <p className="text-gray-400 leading-relaxed min-h-[72px]">
                                {NEURAL_TIPS[currentTipIndex].text}
                            </p>
                        </div>
                     </div>

                     <div className="mt-6 flex items-center justify-between">
                        {/* Dots */}
                        <div className="flex gap-2">
                            {NEURAL_TIPS.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentTipIndex(idx)}
                                    className={`h-1 rounded-full transition-all duration-300 ${idx === currentTipIndex ? 'w-8 bg-white' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                                    aria-label={`Aller au conseil ${idx + 1}`}
                                />
                            ))}
                        </div>
                        
                        {/* Arrows */}
                        <div className="flex gap-2">
                             <button 
                                onClick={prevTip}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                             >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                             </button>
                             <button 
                                onClick={nextTip}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                             >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                             </button>
                        </div>
                     </div>
                </div>

                {/* Card 2: Abstract Visualizer */}
                <div className="bg-black border border-white/10 rounded-2xl relative overflow-hidden min-h-[200px] flex items-center justify-center">
                     {/* CSS Animation Background */}
                     <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                     <div className="w-32 h-32 border border-primary/30 rounded-full absolute animate-[spin_10s_linear_infinite]"></div>
                     <div className="w-48 h-48 border border-accent/20 rounded-full absolute animate-[spin_15s_linear_infinite_reverse]"></div>
                     <div className="w-24 h-24 bg-primary/20 blur-2xl rounded-full absolute animate-pulse"></div>
                     
                     <div className="relative z-10 text-center backdrop-blur-sm px-6 py-3 rounded-xl border border-white/5 bg-black/40">
                         <p className="text-xs font-mono text-accent mb-1">AURA ENGINE V2.5</p>
                         <p className="text-white font-bold text-lg tracking-widest">PRÊT À CRÉER</p>
                     </div>
                </div>
            </div>

            {/* Stats Row - REAL DATA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-dark-card border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="9"></rect><rect x="14" y="7" width="3" height="5"></rect></svg>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Projets Créés</p>
                        <p className="text-xl font-bold text-white">
                            {stats.loading ? '...' : stats.count}
                        </p>
                    </div>
                </div>
                <div className="bg-dark-card border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Style Favori</p>
                        <p className="text-xl font-bold text-white truncate max-w-[150px]">
                            {stats.loading ? '...' : stats.favoriteStyle}
                        </p>
                    </div>
                </div>
                <div className="bg-dark-card border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Crédits IA</p>
                        <p className="text-xl font-bold text-white">Illimité</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
