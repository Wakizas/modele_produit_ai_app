import React, { useEffect } from 'react';
import { ModelOptions } from '../types';

interface SelectModeleProps {
  modelOptions: ModelOptions;
  setModelOptions: React.Dispatch<React.SetStateAction<ModelOptions>>;
  onGenerate: () => void;
  productImagePreviews: string[];
  error?: string;
  isGenerating: boolean;
}

interface OptionProps<T> {
  label: string;
  options: { value: T; label: string }[];
  selected: T;
  onChange: (value: T) => void;
}

const OptionSelector = <T extends string>({ label, options, selected, onChange }: OptionProps<T>) => (
  <div className="mb-6">
    <label className="block text-lg font-semibold text-accent mb-2">{label}</label>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border-2 transition-all text-sm font-medium
            ${selected === option.value 
              ? 'bg-primary text-white border-primary' 
              : 'bg-gray-700 text-gray-200 border-gray-600 hover:border-accent hover:text-white'
            }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

const Toggle: React.FC<{label: string, checked: boolean, onChange: (checked: boolean) => void}> = ({label, checked, onChange}) => (
    <div className="flex items-center justify-between mb-2">
        <label className="text-lg font-semibold text-accent">{label}</label>
        <button onClick={() => onChange(!checked)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-primary' : 'bg-gray-600'}`}>
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}/>
        </button>
    </div>
);

const morphologiesFemme = [
  { value: 'mince', label: 'Mince' },
  { value: 'ronde', label: 'Ronde' },
  { value: 'athlétique', label: 'Athlétique' },
  { value: 'en H (silhouette droite)', label: 'En H (droite)' },
  { value: 'en V (épaules larges)', label: 'En V (épaules larges)' },
  { value: 'en A (hanches larges)', label: 'En A (hanches larges)' },
];

const morphologiesHomme = [
  { value: 'mince', label: 'Mince' },
  { value: 'musclé', label: 'Musclé' },
  { value: 'athlétique', label: 'Athlétique' },
  { value: 'trapu (robuste)', label: 'Trapu (robuste)' },
  { value: 'ectomorphe (fin)', label: 'Ectomorphe (fin)' },
  { value: 'endomorphe (rond)', label: 'Endomorphe (rond)' },
];

const styles = [
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'décontracté chic', label: 'Décontracté Chic' },
  { value: 'glamour', label: 'Glamour' },
  { value: 'streetwear / urbain', label: 'Streetwear / Urbain' },
  { value: 'bohème', label: 'Bohème' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'minimaliste', label: 'Minimaliste' },
  { value: 'sportswear', label: 'Sportswear' },
  { value: 'traditionnel africain (moderne)', label: 'Traditionnel Africain' }
];

const arrierePlans = [
    { value: 'Studio sobre (gris/noir)', label: 'Studio sobre' },
    { value: 'Mur texturé (béton, brique)', label: 'Mur texturé' },
    { value: 'Extérieur urbain (flou)', label: 'Extérieur urbain' },
    { value: 'Nature luxuriante (flou)', label: 'Nature luxuriante' },
    { value: 'Intérieur minimaliste (loft)', label: 'Intérieur minimaliste' },
    { value: 'Fond coloré uni (vibrant)', label: 'Fond coloré' }
];


const SelectModele: React.FC<SelectModeleProps> = ({ modelOptions, setModelOptions, onGenerate, productImagePreviews, error, isGenerating }) => {
  const handleOptionChange = <K extends keyof ModelOptions>(key: K, value: ModelOptions[K]) => {
    setModelOptions((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const currentMorphologies = modelOptions.sexe === 'Femme' ? morphologiesFemme : morphologiesHomme;
    // Si la morphologie actuelle n'est pas dans la liste valide pour le sexe choisi, on la réinitialise.
    if (!currentMorphologies.some(m => m.value === modelOptions.morphologie)) {
        handleOptionChange('morphologie', currentMorphologies[0].value);
    }
  }, [modelOptions.sexe]);

  const outputFormats = [
      { value: '1:1', label: 'Carré (1:1)'},
      { value: '4:5', label: 'Portrait (4:5)'},
      { value: '9:16', label: 'Story (9:16)'},
      { value: '16:9', label: 'Paysage (16:9)'},
      { value: 'Personnalisé', label: 'Personnalisé'},
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-2 text-center">Étape 2 : Créez votre modèle virtuel</h2>
      <p className="text-gray-400 mb-6 text-center">Définissez les caractéristiques du modèle qui portera votre produit.</p>
       {error && <p className="text-red-400 text-center mb-4">{error}</p>}
      
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
        
        {/* Options Panel */}
        <div className="w-full md:flex-1 bg-dark-card/60 p-4 sm:p-6 rounded-2xl shadow-lg">
          <OptionSelector label="Sexe" options={[{value: 'Femme', label: 'Femme'}, {value: 'Homme', label: 'Homme'}]} selected={modelOptions.sexe} onChange={(v) => handleOptionChange('sexe', v)} />
          <OptionSelector label="Type de peau" options={['claire', 'caramel', 'ébène', 'dorée', 'albâtre'].map(v => ({value: v, label: v}))} selected={modelOptions.typeDePeau} onChange={(v) => handleOptionChange('typeDePeau', v)} />
          <OptionSelector label="Origine ethnique" options={['Afrique de l’Ouest', 'Afrique du Nord', 'Afrique Centrale', 'Afrique de l’Est', 'Afrique Australe'].map(v => ({value: v, label: v}))} selected={modelOptions.origineEthnique} onChange={(v) => handleOptionChange('origineEthnique', v)} />
          <OptionSelector label="Morphologie" options={modelOptions.sexe === 'Femme' ? morphologiesFemme : morphologiesHomme} selected={modelOptions.morphologie} onChange={(v) => handleOptionChange('morphologie', v)} />
          <OptionSelector label="Âge" options={['jeune adulte', 'adulte', 'senior'].map(v => ({value: v, label: v}))} selected={modelOptions.age} onChange={(v) => handleOptionChange('age', v)} />
          <OptionSelector label="Style" options={styles} selected={modelOptions.style} onChange={(v) => handleOptionChange('style', v)} />
          <OptionSelector label="Arrière-plan" options={arrierePlans} selected={modelOptions.arrierePlan} onChange={(v) => handleOptionChange('arrierePlan', v)} />
          <OptionSelector label="Expression" options={['neutre', 'sourire léger', 'confiant', 'concentré'].map(v => ({value: v, label: v}))} selected={modelOptions.expression} onChange={(v) => handleOptionChange('expression', v)} />
          
          <div className="p-4 border border-gray-700 rounded-xl mb-6">
            <OptionSelector label="Format de sortie" options={outputFormats} selected={modelOptions.outputFormat} onChange={(v) => handleOptionChange('outputFormat', v)} />
            {modelOptions.outputFormat === 'Personnalisé' && (
                <div className="mt-4 flex gap-4">
                    <div>
                        <label htmlFor="width" className="text-sm text-gray-400 mb-1 block">Largeur (px)</label>
                        <input type="number" id="width" value={modelOptions.customWidth} onChange={(e) => handleOptionChange('customWidth', parseInt(e.target.value, 10))} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white focus:ring-accent focus:border-accent" />
                    </div>
                    <div>
                        <label htmlFor="height" className="text-sm text-gray-400 mb-1 block">Hauteur (px)</label>
                        <input type="number" id="height" value={modelOptions.customHeight} onChange={(e) => handleOptionChange('customHeight', parseInt(e.target.value, 10))} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white focus:ring-accent focus:border-accent" />
                    </div>
                </div>
            )}
          </div>
          
          <div className="mb-6">
            <Toggle label="Activer le réalisme maximal" checked={modelOptions.realismeMaximal} onChange={(v) => handleOptionChange('realismeMaximal', v)} />
          </div>

        </div>

        {/* Preview and Action Panel */}
        <div className="w-full md:w-1/3 space-y-6 md:sticky top-8">
          {productImagePreviews.length > 0 && (
            <div className="w-full">
                <p className="text-lg font-semibold text-accent mb-2 text-center">
                    Vos Produits
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-2 bg-dark-card/60 p-2 rounded-xl">
                 {productImagePreviews.map((preview, index) => (
                    <img key={index} src={preview} alt={`Aperçu produit ${index+1}`} className="w-full rounded-md shadow-lg object-cover aspect-square"/>
                ))}
                </div>
            </div>
          )}
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full bg-secondary text-black font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Génération...' : 'Générer le modèle ✨'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectModele;