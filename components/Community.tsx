
import React, { useState, useEffect } from 'react';
import { CommunityCreation } from '../types';
import { collection, onSnapshot, orderBy, query, updateDoc, doc, increment, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface CommunityProps {
    onRemix: (creation: CommunityCreation) => void;
}

// Mock Data for "Trending" (High quality examples)
const TRENDING_MOCKS: CommunityCreation[] = [
    {
        id: 'trend_1',
        style: 'Cyberpunk Neon',
        ambiance: 'Abstrait néon futuriste',
        morphologie: 'Athlétique',
        likes: 1240,
        likedBy: [],
        author: 'Tendance',
        authorUid: 'system',
        gradient: 'linear-gradient(135deg, #FF0080 0%, #7F00FF 100%)'
    },
    {
        id: 'trend_2',
        style: 'Haute Couture',
        ambiance: 'Studio éclairage dramatique',
        morphologie: 'Mannequin',
        likes: 895,
        likedBy: [],
        author: 'Tendance',
        authorUid: 'system',
        gradient: 'linear-gradient(135deg, #000000 0%, #434343 100%)'
    },
    {
        id: 'trend_3',
        style: 'Bohème Chic',
        ambiance: 'Nature tropicale plage',
        morphologie: 'Standard',
        likes: 650,
        likedBy: [],
        author: 'Tendance',
        authorUid: 'system',
        gradient: 'linear-gradient(135deg, #FDB99B 0%, #CF8BF3 100%)'
    },
    {
        id: 'trend_4',
        style: 'Business Luxury',
        ambiance: 'Intérieur luxe salon',
        morphologie: 'Carrure Large',
        likes: 520,
        likedBy: [],
        author: 'Tendance',
        authorUid: 'system',
        gradient: 'linear-gradient(135deg, #FFD700 0%, #E2B13C 100%)'
    },
    {
        id: 'trend_5',
        style: 'Urban Streetwear',
        ambiance: 'Urbain moderne ville',
        morphologie: 'Mince',
        likes: 480,
        likedBy: [],
        author: 'Tendance',
        authorUid: 'system',
        gradient: 'linear-gradient(135deg, #00F0FF 0%, #0000FF 100%)'
    }
];

const Community: React.FC<CommunityProps> = ({ onRemix }) => {
  const [activeTab, setActiveTab] = useState<'trending' | 'community'>('trending');
  const [creations, setCreations] = useState<CommunityCreation[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

  // Fetch real creations from Firestore
  useEffect(() => {
    const q = query(collection(db, 'community_creations'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as CommunityCreation[];
        setCreations(items);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLike = async (creation: CommunityCreation) => {
    if (!auth?.currentUser) return;
    if (activeTab === 'trending') return; // Cannot like static mocks persistently

    // Check if user already liked
    if (creation.likedBy && creation.likedBy.includes(auth.currentUser.uid)) {
        return; // Already liked
    }

    const ref = doc(db, 'community_creations', creation.id);
    try {
        await updateDoc(ref, {
            likes: increment(1),
            likedBy: arrayUnion(auth.currentUser.uid)
        });
    } catch (e) {
        console.error("Error liking creation:", e);
    }
  };

  const handleDelete = async (creation: CommunityCreation) => {
    if (!auth?.currentUser) return;
    const isAdmin = auth.userProfile?.role === 'admin';
    const isAuthor = creation.authorUid === auth.currentUser.uid;

    if (isAdmin || isAuthor) {
        if (window.confirm("Voulez-vous vraiment supprimer cette création du Nexus ?")) {
             try {
                 await deleteDoc(doc(db, 'community_creations', creation.id));
             } catch (e) {
                 console.error("Error deleting:", e);
             }
        }
    }
  };

  const displayedItems = activeTab === 'trending' ? TRENDING_MOCKS : creations;

  return (
    <div className="animate-slide-up pb-24">
      <div className="text-center mb-10">
          <h2 className="text-4xl font-display font-bold text-white mb-2">AfroVibe Community</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
              Explorez l'ADN des meilleures créations. Copiez les styles, pas les images. 
              Une communauté sans limites, sans consommation de données.
          </p>
      </div>

      {/* Guide Card */}
      <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-white/10 rounded-2xl p-6 mb-10 flex flex-col md:flex-row items-center gap-6">
          <div className="text-4xl">🧬</div>
          <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">Comment ça marche ?</h3>
              <p className="text-sm text-gray-300">
                  Ici, on ne partage pas les photos (trop lourd !). On partage la <strong>Recette</strong> (Style + Ambiance + Prompt).
                  Trouvez une "Vibe" qui vous plait, cliquez sur <strong>Remix</strong>, et l'IA appliquera ces réglages exacts à VOTRE produit.
              </p>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-6 mb-8">
          <button 
            onClick={() => setActiveTab('trending')}
            className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'trending' ? 'text-white border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'}`}
          >
              Tendances
          </button>
          <button 
            onClick={() => setActiveTab('community')}
            className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'community' ? 'text-white border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'}`}
          >
              Partages Utilisateurs
          </button>
      </div>

      {/* Grid */}
      {activeTab === 'community' && loading ? (
          <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Synchronisation avec le Nexus...</p>
          </div>
      ) : displayedItems.length === 0 ? (
           <div className="text-center py-12 bg-white/5 rounded-xl">
              <p className="text-gray-400">Aucune création pour le moment. Soyez le premier à publier !</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedItems.map((creation) => {
                  const canDelete = activeTab === 'community' && auth?.currentUser && (auth.userProfile?.role === 'admin' || creation.authorUid === auth.currentUser.uid);
                  const displayStyle = creation.style || 'Style';
                  const hasLiked = activeTab === 'community' && auth?.currentUser && creation.likedBy?.includes(auth.currentUser.uid);
                  
                  return (
                  <div key={creation.id} className="group relative bg-dark-card border border-white/10 rounded-2xl overflow-hidden hover:border-accent/50 transition-all duration-300 hover:-translate-y-1">
                      {/* Abstract Art Representation (No Image Bandwidth!) */}
                      <div 
                        className="h-40 w-full relative overflow-hidden"
                        style={{ background: creation.gradient || 'linear-gradient(45deg, #333, #111)' }}
                      >
                          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl font-display font-bold text-white opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500">
                                  {displayStyle.substring(0, 2).toUpperCase()}
                              </span>
                          </div>
                          
                          {/* Remix Button Overlay */}
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                onClick={() => onRemix(creation)}
                                className="px-6 py-2 bg-white text-black font-bold rounded-full transform scale-90 group-hover:scale-100 transition-transform shadow-glow-white"
                              >
                                  ⚡ REMIXER
                              </button>
                          </div>

                           {/* Delete Button */}
                           {canDelete && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(creation); }}
                                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    title="Supprimer"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            )}
                      </div>

                      <div className="p-5">
                          <div className="flex justify-between items-start mb-3">
                              <div>
                                  <h4 className="text-white font-bold text-lg">{creation.style || 'Sans titre'}</h4>
                                  <p className="text-xs text-gray-400">{creation.ambiance}</p>
                              </div>
                              <div className="flex flex-col items-end">
                                   <span className="text-xs text-accent font-mono">@{creation.author || 'Tendance'}</span>
                              </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                              <div className="flex gap-2">
                                  <span className="px-2 py-1 rounded bg-white/5 text-[10px] text-gray-400 uppercase">{creation.morphologie}</span>
                              </div>
                              <button 
                                onClick={() => handleLike(creation)}
                                disabled={hasLiked || activeTab === 'trending'}
                                className={`flex items-center gap-1 transition-colors ${hasLiked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
                              >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={hasLiked ? "0" : "2"}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                  <span className="text-xs font-bold">{creation.likes || 0}</span>
                              </button>
                          </div>
                      </div>
                  </div>
              )})}
          </div>
      )}
    </div>
  );
};

export default Community;
