import React, { useState, useEffect } from 'react';
import { ModelOptions, UploadedImage } from '../types';

interface SelectModeleProps {
  modelOptions: ModelOptions;
  setModelOptions: React.Dispatch<React.SetStateAction<ModelOptions>>;
  onGenerate: () => void;
  productImagePreviews: string[];
  error?: string;
  isGenerating: boolean;
  faceImage: UploadedImage | null;
  setFaceImage: (image: UploadedImage | null) => void;
  onRetry: () => void;
  isRemixMode?: boolean;
  onCancelRemix?: () => void;
}

// Composant utilitaire pour les sections pliables ou groupées
const SectionTitle = ({ children }: { children?: React.ReactNode }) => (
    <div className="flex items-center gap-3 mb-6 mt-8 first:mt-0">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <h3 className="text-accent text-sm font-bold uppercase tracking-widest whitespace-nowrap">{children}</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    </div>
);

const PillSelector = ({ label, options, value, onChange, helpText, disabled }: any) => (
  <div className={`mb-6 transition-opacity duration-300 ${disabled ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
    <div className="flex justify-between items-baseline mb-3 ml-1">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</label>
        {helpText && <span className="text-[10px] text-gray-500 italic">{helpText}</span>}
    </div>
    <div className="flex flex-wrap gap-2">
      {options.map((opt: any) => {
         const isActive = value === opt.value;
         return (
            <button
              key={opt.value}
              onClick={() => !disabled && onChange(opt.value)}
              disabled={disabled}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border relative overflow-hidden group ${
                isActive 
                  ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] transform scale-105' 
                  : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/20 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="relative z-10">{opt.label}</span>
              {isActive && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50"></div>}
            </button>
         );
      })}
    </div>
  </div>
);

const SelectModele: React.FC<SelectModeleProps> = ({ 
    modelOptions, 
    setModelOptions, 
    onGenerate, 
    productImagePreviews, 
    isGenerating, 
    faceImage, 
    setFaceImage, 
    error,
    isRemixMode = false,
    onCancelRemix
}) => {
  const handleChange = (k: keyof ModelOptions, v: any) => setModelOptions(p => ({ ...p, [k]: v }));

  // Logique pour adapter les tranches d'âge selon le type de modèle (Adulte vs Enfant)
  const [category, setCategory] = useState<'adulte' | 'enfant' | 'bebe'>('adulte');

  // Effet pour réinitialiser les valeurs par défaut lors du changement de catégorie majeure
  useEffect(() => {
      // On ne change pas les options si on est en mode remix (elles sont fixées par la communauté)
      if (isRemixMode) return; 

      if (category === 'enfant') {
          if (!modelOptions.sexe.includes('Garçon') && !modelOptions.sexe.includes('Fille')) {
             handleChange('sexe', 'Garçon');
          }
          handleChange('age', '6-9 ans');
          handleChange('morphologie', 'Standard');
      } else if (category === 'bebe') {
          handleChange('sexe', 'Bébé');
          handleChange('age', '6-12 mois');
          handleChange('morphologie', 'Potelé');
      } else {
          // Adulte
          if (!modelOptions.sexe.includes('Femme') && !modelOptions.sexe.includes('Homme')) {
             handleChange('sexe', 'Femme');
          }
          handleChange('age', '25-34 ans');
          handleChange('morphologie', 'Standard');
      }
  }, [category, isRemixMode]);

  const getAgeOptions = () => {
      if (category === 'bebe') return [
          {value: '0-6 mois', label: 'Nouveau-né (0-6 mois)'},
          {value: '6-12 mois', label: 'Bébé (6-12 mois)'},
          {value: '12-24 mois', label: 'Tout-petit (1-2 ans)'}
      ];
      if (category === 'enfant') return [
          {value: '3-5 ans', label: 'Petite Enfance (3-5 ans)'},
          {value: '6-9 ans', label: 'Enfant (6-9 ans)'},
          {value: '10-14 ans', label: 'Pré-ado / Ado (10-14 ans)'}
      ];
      return [
          {value: '18-24 ans', label: 'Gen Z (18-24 ans)'},
          {value: '25-34 ans', label: 'Millennial (25-34 ans)'},
          {value: '35-44 ans', label: 'Adulte (35-44 ans)'},
          {value: '45-55 ans', label: 'Mature (45-55 ans)'},
          {value: 'Senior', label: 'Senior (60+ ans)'}
      ];
  };

  const getGenderOptions = () => {
      if (category === 'bebe') return [
          {value: 'Bébé', label: 'Mixte / Neutre'}, 
          {value: 'Bébé Garçon', label: 'Garçon'}, 
          {value: 'Bébé Fille', label: 'Fille'}
      ];
      if (category === 'enfant') return [
          {value: 'Garçon', label: 'Garçon'}, 
          {value: 'Fille', label: 'Fille'}
      ];
      return [
          {value: 'Femme', label: 'Femme'}, 
          {value: 'Homme', label: 'Homme'}
      ];
  };

  const getMorphologyOptions = () => {
      // BÉBÉ
      if (category === 'bebe') return [
          {value: 'Standard', label: 'Standard'},
          {value: 'Potelé', label: 'Potelé (Sain)'},
          {value: 'Fin', label: 'Fin / Petit'}
      ];
      
      // ENFANT
      if (category === 'enfant') return [
          {value: 'Standard', label: 'Standard'},
          {value: 'Mince', label: 'Mince / Élancé'},
          {value: 'Solide', label: 'Solide / Costaud'}
      ];

      // ADULTE - HOMME
      if (modelOptions.sexe === 'Homme') return [
          {value: 'athlétique', label: 'Athlétique (Dessiné)'},
          {value: 'musclé', label: 'Musclé (Bodybuilder)'},
          {value: 'standard', label: 'Standard (Équilibré)'},
          {value: 'mince', label: 'Mince (Slim)'},
          {value: 'carrure large', label: 'Carrure Large (Stocky)'},
          {value: 'élancé', label: 'Grand & Élancé'}
      ];

      // ADULTE - FEMME (Défaut)
      return [
          {value: 'mannequin', label: 'Mannequin (Très mince)'},
          {value: 'mince', label: 'Mince (Slim)'},
          {value: 'standard', label: 'Standard (Naturelle)'},
          {value: 'athlétique', label: 'Athlétique (Fit)'},
          {value: 'curvy', label: 'Curvy (Sablier)'},
          {value: 'voluptueuse', label: 'Voluptueuse (Plus Size)'},
          {value: 'petite', label: 'Petite & Menu'},
          {value: 'élancée', label: 'Grande & Élancée'}
      ];
  };

  return (
    <div className="max-w-7xl mx-auto animate-slide-up pb-20">
       <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">
          
          {/* Left: Configuration */}
          <div className="flex-1">
             <div className="mb-8">
                 <h2 className="text-4xl font-display font-bold text-white mb-2">Direction Artistique</h2>
                 <p className="text-gray-400">Définissez précisément l'avatar qui incarnera votre marque.</p>
             </div>

             {isRemixMode && (
                 <div className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded-2xl flex items-center justify-between animate-pulse-slow">
                     <div className="flex items-center gap-3">
                         <span className="text-xl">🔒</span>
                         <div>
                             <h4 className="text-accent font-bold text-sm">Mode Remix Actif</h4>
                             <p className="text-gray-400 text-xs">Les paramètres de style sont verrouillés pour reproduire le look communautaire.</p>
                         </div>
                     </div>
                     <button 
                        onClick={onCancelRemix}
                        className="px-4 py-2 text-xs bg-black/40 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors"
                     >
                         Déverrouiller / Personnaliser
                     </button>
                 </div>
             )}

             <div className="bg-bg-card/80 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>

                {/* CATEGORY SELECTION */}
                <div className={`grid grid-cols-3 gap-3 mb-10 p-1.5 bg-black/40 rounded-xl border border-white/5 ${isRemixMode ? 'opacity-50 pointer-events-none' : ''}`}>
                    {(['adulte', 'enfant', 'bebe'] as const).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            disabled={isRemixMode}
                            className={`py-4 px-4 rounded-lg font-bold uppercase text-xs tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                                category === cat 
                                ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                        >
                            {cat === 'adulte' && <span className="text-lg">👤</span>}
                            {cat === 'enfant' && <span className="text-lg">🧒</span>}
                            {cat === 'bebe' && <span className="text-lg">👶</span>}
                            {cat === 'bebe' ? 'Bébé' : cat}
                        </button>
                    ))}
                </div>

                {/* --- SECTION 1: PHYSIQUE --- */}
                <SectionTitle>Caractéristiques du Modèle</SectionTitle>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <PillSelector 
                        label="Genre / Type"
                        options={getGenderOptions()}
                        value={modelOptions.sexe}
                        onChange={(v: string) => handleChange('sexe', v)}
                        disabled={isRemixMode}
                    />

                    <PillSelector 
                        label="Tranche d'âge"
                        options={getAgeOptions()}
                        value={modelOptions.age}
                        onChange={(v: string) => handleChange('age', v)}
                        disabled={isRemixMode}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <PillSelector 
                        label="Teint de peau"
                        options={[
                            {value: 'très clair', label: 'Porcelaine / Très Clair'},
                            {value: 'clair', label: 'Clair / Beige'},
                            {value: 'doré', label: 'Doré / Hâlé'},
                            {value: 'olive', label: 'Mat / Olive'},
                            {value: 'métisse', label: 'Métisse / Caramel'},
                            {value: 'bronzé', label: 'Bronzé / Ambré'},
                            {value: 'noir', label: 'Noir / Cacao'},
                            {value: 'ébène', label: 'Ébène Profond'}
                        ]}
                        value={modelOptions.typeDePeau}
                        onChange={(v: string) => handleChange('typeDePeau', v)}
                        disabled={isRemixMode}
                    />
                    
                    <PillSelector 
                        label="Morphologie"
                        options={getMorphologyOptions()}
                        value={modelOptions.morphologie}
                        onChange={(v: string) => handleChange('morphologie', v)}
                        disabled={isRemixMode}
                    />
                </div>

                {/* --- SECTION 2: ORIGINE & STYLE --- */}
                <SectionTitle>Origine & Style</SectionTitle>

                <PillSelector 
                    label="Origine Ethnique Principale"
                    options={[
                        {value: 'Afrique de l’Ouest', label: 'Afrique de l’Ouest (Traits fins)'},
                        {value: 'Afrique Centrale', label: 'Afrique Centrale (Bantou)'},
                        {value: 'Afrique du Nord', label: 'Afrique du Nord (Maghreb)'},
                        {value: 'Afrique de l’Est', label: 'Afrique de l’Est (Nilotique)'},
                        {value: 'Afrique Australe', label: 'Afrique Australe'},
                        {value: 'Afro-américain', label: 'Afro-américain'},
                        {value: 'Afro-caribéen', label: 'Afro-caribéen / Îles'},
                        {value: 'Métisse', label: 'Métisse Universel'},
                        {value: 'Asiatique', label: 'Asiatique'},
                        {value: 'Européen', label: 'Européen / Caucasien'},
                        {value: 'Indien', label: 'Indien / Asie du Sud'},
                        {value: 'Latino', label: 'Latino / Hispanique'}
                    ]}
                    value={modelOptions.origineEthnique}
                    onChange={(v: string) => handleChange('origineEthnique', v)}
                    disabled={isRemixMode}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <PillSelector 
                        label="Expression Faciale"
                        options={[
                            {value: 'sourire radieux', label: 'Sourire Éclatant (Commercial)'},
                            {value: 'sourire doux', label: 'Sourire Doux (Bienveillance)'},
                            {value: 'neutre confiant', label: 'Neutre & Confiant (Luxe)'},
                            {value: 'sérieux couture', label: 'Mode / Couture (Éditorial)'},
                            {value: 'regard intense', label: 'Regard Intense (Séduction)'},
                            {value: 'rire naturel', label: 'Rire / Joie (Lifestyle)'},
                            {value: 'pensif', label: 'Pensif / Lointain'}
                        ]}
                        value={modelOptions.expression}
                        onChange={(v: string) => handleChange('expression', v)}
                        disabled={isRemixMode}
                    />
                    
                    <PillSelector 
                        label="Style Vestimentaire"
                        helpText="(Complémentaire au produit)"
                        options={[
                            {value: 'minimaliste', label: 'Minimaliste / Épuré'},
                            {value: 'streetwear', label: 'Streetwear / Urbain'},
                            {value: 'chic élégant', label: 'Chic / Soirée / Gala'},
                            {value: 'business', label: 'Business / Professionnel'},
                            {value: 'casual', label: 'Casual / Décontracté'},
                            {value: 'traditionnel moderne', label: 'Afro-Moderne / Fusion'},
                            {value: 'bohème', label: 'Bohème / Artistique'},
                            {value: 'sportif', label: 'Sportswear / Fitness'},
                            {value: 'haute couture', label: 'Avant-Garde / Haute Couture'}
                        ]}
                        value={modelOptions.style}
                        onChange={(v: string) => handleChange('style', v)}
                        disabled={isRemixMode}
                    />
                </div>

                {/* --- SECTION 3: AMBIANCE --- */}
                <SectionTitle>Décor & Éclairage</SectionTitle>

                <div className={`mb-6 transition-opacity duration-300 ${isRemixMode ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         {[
                            {value: 'Studio fond uni blanc', label: '⚪️ Studio Fond Blanc Pur (E-commerce)', type: 'studio'},
                            {value: 'Studio fond gris doux', label: '🔘 Studio Fond Gris (Premium)', type: 'studio'},
                            {value: 'Studio fond coloré pastel', label: '🎨 Studio Fond Pastel (Pop)', type: 'studio'},
                            {value: 'Studio éclairage dramatique', label: '🔦 Studio Éclairage Dramatique (Mode)', type: 'studio'},
                            {value: 'Intérieur luxe salon', label: '🛋 Intérieur Luxe / Salon Design', type: 'indoor'},
                            {value: 'Intérieur minimaliste zen', label: '🪴 Intérieur Minimaliste / Zen', type: 'indoor'},
                            {value: 'Intérieur loft industriel', label: '🧱 Loft Industriel / Briques', type: 'indoor'},
                            {value: 'Lumière naturelle golden hour', label: '☀️ Extérieur Golden Hour (Sunset)', type: 'outdoor'},
                            {value: 'Urbain moderne ville', label: '🏙 Ville Moderne / Rue Floue', type: 'outdoor'},
                            {value: 'Nature tropicale plage', label: '🌴 Nature Tropicale / Plage', type: 'outdoor'},
                            {value: 'Nature champêtre', label: '🌾 Nature Champêtre / Fleurs', type: 'outdoor'},
                            {value: 'Abstrait néon futuriste', label: '🟣 Abstrait Néon / Cyberpunk', type: 'artistic'},
                         ].map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => handleChange('ambiance', opt.value)}
                                disabled={isRemixMode}
                                className={`p-3 rounded-xl text-left text-sm transition-all duration-300 border flex items-center gap-3 ${
                                    modelOptions.ambiance === opt.value
                                    ? 'bg-gradient-to-r from-primary/20 to-accent/10 border-primary text-white shadow-glow-primary'
                                    : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <span className="flex-1 font-medium">{opt.label}</span>
                                {modelOptions.ambiance === opt.value && (
                                    <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_5px_#00F0FF]"></div>
                                )}
                            </button>
                         ))}
                    </div>
                </div>

                {/* OPTION VISAGE PERSO */}
                <div className="mt-10 pt-6 border-t border-white/10">
                    <div className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-white/5 to-transparent border border-white/5 hover:border-primary/30 transition-colors ${isRemixMode ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </div>
                            <div>
                                <span className="text-white font-bold block text-base">Face Swap (Beta)</span>
                                <span className="text-xs text-gray-400">Appliquer votre propre visage sur le mannequin généré</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleChange('useMyFace', !modelOptions.useMyFace)}
                            disabled={isRemixMode}
                            className={`w-14 h-8 rounded-full transition-colors relative ${modelOptions.useMyFace ? 'bg-primary shadow-glow-primary' : 'bg-gray-800'}`}
                        >
                            <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow-md ${modelOptions.useMyFace ? 'translate-x-6' : ''}`}></div>
                        </button>
                    </div>
                </div>
             </div>
          </div>

          {/* Right: Preview & Action - Sticky */}
          <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-6">
             <div className="sticky top-8 space-y-6">
                
                {/* Product Card */}
                <div className="bg-bg-card border border-white/10 rounded-3xl p-5 shadow-xl">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent"></span>
                        Produit Source
                    </h3>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        {productImagePreviews.slice(0, 2).map((src, i) => (
                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-black/20">
                                <img src={src} className="w-full h-full object-cover" />
                            </div>
                        ))}
                         {productImagePreviews.length > 2 && (
                             <div className="relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-white/5 flex items-center justify-center">
                                 <span className="text-gray-400 font-medium text-xs">+{productImagePreviews.length - 2}</span>
                             </div>
                         )}
                    </div>
                </div>
                
                {/* Action Card */}
                <div className="bg-gradient-to-b from-bg-card to-black border border-white/10 rounded-3xl p-6 shadow-2xl">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Récapitulatif</h3>
                    
                    <div className="space-y-3 mb-8 text-sm">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-gray-400">Catégorie</span>
                            <span className="text-white font-medium capitalize">{category}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-gray-400">Origine</span>
                            <span className="text-white font-medium truncate max-w-[150px]">{modelOptions.origineEthnique}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                            <span className="text-gray-400">Style</span>
                            <span className="text-white font-medium truncate max-w-[150px]">{modelOptions.style}</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-start gap-2">
                            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        onClick={onGenerate}
                        disabled={isGenerating}
                        className="group w-full py-4 bg-white text-black font-bold rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:shadow-[0_0_35px_rgba(127,0,255,0.5)] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none disabled:shadow-none relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        {isGenerating ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                                <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                                <span className="ml-1">Création en cours...</span>
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                Lancer la Création
                            </span>
                        )}
                    </button>
                    <p className="text-[10px] text-center text-gray-600 mt-3">
                        Studio optimisé pour un rendu commercial haute définition.
                    </p>
                </div>
             </div>
          </div>

       </div>
    </div>
  );
};

export default SelectModele;