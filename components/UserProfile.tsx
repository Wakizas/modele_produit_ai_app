
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../firebase';

const RANKS = [
    { name: 'Néophyte', threshold: 0, color: 'text-gray-400', icon: '🌱' },
    { name: 'Initié', threshold: 100, color: 'text-accent', icon: '⚡' },
    { name: 'Créateur', threshold: 300, color: 'text-primary', icon: '🎨' },
    { name: 'Visionnaire', threshold: 600, color: 'text-purple-400', icon: '🔮' },
    { name: 'Architecte', threshold: 1200, color: 'text-yellow-400', icon: '🏗️' },
    { name: 'Entité', threshold: 2500, color: 'text-red-500', icon: '🌌' }
];

const ACHIEVEMENTS = [
    { id: 'first_gen', title: 'Premier Pas', desc: 'Générer 1 image', xpReq: 50, icon: '🚀' },
    { id: 'stylist', title: 'Styliste', desc: 'Utiliser 5 styles différents', xpReq: 300, icon: '👔' },
    { id: 'night_owl', title: 'Oiseau de Nuit', desc: 'Créer après 22h', xpReq: 500, icon: '🦉' },
    { id: 'pro', title: 'Pro Studio', desc: 'Atteindre le niveau Visionnaire', xpReq: 600, icon: '🏆' },
];

const UserProfile: React.FC = () => {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'badges'>('overview');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
      if (auth?.userProfile?.displayName) {
          setEditName(auth.userProfile.displayName);
      }
  }, [auth?.userProfile]);

  useEffect(() => {
      if (activeTab === 'history' && auth?.currentUser) {
          const fetchHistory = async () => {
              setLoadingHistory(true);
              try {
                const q = query(
                    collection(db, "users", auth.currentUser!.uid, "history"),
                    orderBy("timestamp", "desc"),
                    limit(20)
                );
                const snap = await getDocs(q);
                setHistory(snap.docs.map(d => d.data()));
              } catch (e) {
                  console.error(e);
              } finally {
                  setLoadingHistory(false);
              }
          };
          fetchHistory();
      }
  }, [activeTab, auth?.currentUser]);

  const handleSaveProfile = async () => {
      if (!auth?.currentUser || !editName.trim()) return;
      setIsSaving(true);
      try {
          // 1. Update Firebase Auth
          await updateProfile(auth.currentUser, { displayName: editName });
          
          // 2. Update Firestore User Document
          const userRef = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userRef, { displayName: editName });

          // 3. Update Local State (force reload if needed, or wait for AuthContext listener)
          setIsEditing(false);
      } catch (error) {
          console.error("Error updating profile:", error);
          alert("Erreur lors de la mise à jour du profil.");
      } finally {
          setIsSaving(false);
      }
  };

  if (!auth || !auth.currentUser) return <div className="text-white">Chargement...</div>;

  const xp = auth.userProfile?.xp || 0;
  
  // Calculate Rank
  let currentRank = RANKS[0];
  let nextRank = RANKS[1];
  for (let i = 0; i < RANKS.length; i++) {
      if (xp >= RANKS[i].threshold) {
          currentRank = RANKS[i];
          nextRank = RANKS[i + 1] || { name: 'Max', threshold: xp * 1.5, color: 'text-white', icon: '👑' };
      }
  }
  const progress = Math.min(100, Math.max(0, ((xp - currentRank.threshold) / (nextRank.threshold - currentRank.threshold)) * 100));

  const userAvatar = auth.currentUser.photoURL ? (
    <img src={auth.currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-white">
      {auth.currentUser.email?.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <div className="animate-slide-up pb-20 max-w-4xl mx-auto">
      {/* Header Card */}
      <div className="bg-dark-card border border-white/10 rounded-3xl p-8 mb-8 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
         
         <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
             <div className="w-28 h-28 rounded-full border-4 border-bg-dark shadow-glow-primary relative">
                 <div className="w-full h-full rounded-full overflow-hidden">
                    {userAvatar}
                 </div>
                 <div className="absolute -bottom-2 -right-2 bg-bg-dark rounded-full p-2 shadow-lg border border-white/10 text-xl">
                     {currentRank.icon}
                 </div>
             </div>
             
             <div className="text-center md:text-left flex-1 w-full md:w-auto">
                 {isEditing ? (
                     <div className="flex flex-col items-start gap-2 mb-2">
                         <label className="text-xs text-gray-500 uppercase">Modifier le pseudo</label>
                         <div className="flex gap-2 w-full">
                             <input 
                                type="text" 
                                value={editName} 
                                onChange={(e) => setEditName(e.target.value)}
                                className="bg-black/40 border border-accent rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-accent w-full md:w-64"
                             />
                             <button 
                                onClick={handleSaveProfile} 
                                disabled={isSaving}
                                className="bg-accent text-black px-3 py-2 rounded-lg font-bold text-sm hover:bg-white transition-colors"
                             >
                                 {isSaving ? '...' : 'OK'}
                             </button>
                             <button 
                                onClick={() => setIsEditing(false)} 
                                className="bg-white/10 text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-white/20 transition-colors"
                             >
                                 X
                             </button>
                         </div>
                     </div>
                 ) : (
                     <div className="flex items-center justify-center md:justify-start gap-3 mb-1 group">
                         <h1 className="text-3xl font-bold text-white">
                            {auth.userProfile?.displayName || auth.currentUser.email?.split('@')[0]}
                         </h1>
                         <button 
                            onClick={() => setIsEditing(true)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                            title="Modifier le profil"
                         >
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                         </button>
                     </div>
                 )}
                 
                 <p className={`text-sm font-bold uppercase tracking-widest mb-4 ${currentRank.color}`}>{currentRank.name} • Niveau {Math.floor(xp / 100) + 1}</p>
                 
                 {/* XP Bar */}
                 <div className="max-w-md mx-auto md:mx-0">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{xp} XP</span>
                        <span>{nextRank.threshold} XP</span>
                    </div>
                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Prochain rang : {nextRank.name}</p>
                 </div>
             </div>

             <button onClick={() => auth.logout()} className="px-4 py-2 border border-white/10 hover:bg-red-500/10 hover:border-red-500/50 text-gray-400 hover:text-red-400 rounded-xl transition-colors text-sm mt-4 md:mt-0">
                 Déconnexion
             </button>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-white/5 pb-1 overflow-x-auto">
          {['overview', 'history', 'badges'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors whitespace-nowrap ${
                    activeTab === tab ? 'text-white border-b-2 border-primary' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                  {tab === 'overview' ? 'Vue d\'ensemble' : tab === 'history' ? 'Historique' : 'Succès'}
              </button>
          ))}
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
          {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                      <h3 className="text-lg font-bold text-white mb-4">Statistiques</h3>
                      <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                              <span className="text-gray-400 text-sm">Compte créé le</span>
                              <span className="text-white font-mono">{new Date(auth.userProfile?.createdAt || Date.now()).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                              <span className="text-gray-400 text-sm">Rôle</span>
                              <span className="text-accent uppercase text-xs font-bold">{auth.userProfile?.role}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                              <span className="text-gray-400 text-sm">XP Total</span>
                              <span className="text-primary font-bold">{xp}</span>
                          </div>
                      </div>
                  </div>
                  <div className="bg-gradient-to-br from-primary/10 to-transparent rounded-2xl p-6 border border-primary/20 flex flex-col items-center justify-center text-center">
                      <div className="text-4xl mb-2">🚀</div>
                      <h3 className="text-xl font-bold text-white mb-2">Boostez votre Aura</h3>
                      <p className="text-gray-400 text-sm mb-4">Participez aux défis communautaires dans le Nexus pour gagner des points bonus.</p>
                      <button className="px-4 py-2 bg-white text-black font-bold rounded-full text-sm hover:scale-105 transition-transform">Aller au Nexus</button>
                  </div>
              </div>
          )}

          {activeTab === 'history' && (
              <div className="animate-fade-in">
                  {loadingHistory ? (
                      <div className="text-center py-10 text-gray-500">Chargement des archives...</div>
                  ) : history.length === 0 ? (
                      <div className="text-center py-10 text-gray-500">Aucune activité récente.</div>
                  ) : (
                      <div className="space-y-3">
                          {history.map((item, i) => (
                              <div key={i} className="flex items-center justify-between p-4 bg-dark-card border border-white/5 rounded-xl hover:border-white/20 transition-colors">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg">
                                          🖼️
                                      </div>
                                      <div>
                                          <p className="text-white font-medium text-sm">{item.style} / {item.ambiance}</p>
                                          <p className="text-gray-500 text-xs">
                                              {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString() : 'Date inconnue'}
                                          </p>
                                      </div>
                                  </div>
                                  <span className="text-xs font-mono text-accent">{item.imageCount} img</span>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'badges' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-in">
                  {ACHIEVEMENTS.map((badge) => {
                      const isUnlocked = xp >= badge.xpReq;
                      return (
                          <div key={badge.id} className={`p-4 rounded-xl border ${isUnlocked ? 'bg-primary/10 border-primary/50' : 'bg-white/5 border-white/5 grayscale opacity-50'} transition-all`}>
                              <div className="text-3xl mb-2">{badge.icon}</div>
                              <h4 className="text-white font-bold text-sm mb-1">{badge.title}</h4>
                              <p className="text-gray-400 text-xs mb-2">{badge.desc}</p>
                              {!isUnlocked && <p className="text-[10px] text-accent">Requis: {badge.xpReq} XP</p>}
                          </div>
                      );
                  })}
              </div>
          )}
      </div>
    </div>
  );
};

export default UserProfile;
