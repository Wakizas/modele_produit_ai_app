import React, { useState, useRef, useEffect, useCallback } from 'react';
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

// ICONS
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

// Camera Modal Component (Adapted from UploadProduit.tsx)
const CameraModal: React.FC<{onClose: () => void, onCapture: (img: UploadedImage) => void}> = ({onClose, onCapture}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const startCamera = async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setError("La fonctionnalité caméra n'est pas supportée par votre navigateur ou votre connexion n'est pas sécurisée (HTTPS).");
                return;
            }
            try {
                // Use 'user' facingMode for selfies
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                streamRef.current = stream;
                if(videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Impossible d'accéder à la caméra. Vérifiez les autorisations dans votre navigateur.");
            }
        };
        startCamera();

        return () => {
            if(streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const dataUrl = canvas.toDataURL('image/jpeg');
            const base64Data = dataUrl.split(',')[1];
            const file = new File([dataUrl], `face-capture-${Date.now()}.jpg`, {type: 'image/jpeg'});
            
            onCapture({
                file: file,
                base64: base64Data,
                previewUrl: dataUrl,
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-dark-card rounded-xl shadow-lg p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-4">Prendre une photo</h3>
                {error ? <p className="text-red-400">{error}</p> : (
                <div className="relative">
                    <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" style={{transform: 'scaleX(-1)'}} />
                    <canvas ref={canvasRef} className="hidden" />
                </div>
                )}
                <div className="flex justify-end gap-4 mt-4">
                    <button onClick={onClose} className="bg-gray-700 text-gray-200 font-bold py-2 px-4 rounded-xl hover:bg-gray-600 transition-colors">Annuler</button>
                    <button onClick={handleCapture} disabled={!!error} className="bg-primary text-white font-bold py-2 px-4 rounded-xl hover:bg-accent transition-colors disabled:bg-gray-600">Capturer</button>
                </div>
            </div>
        </div>
    );
}


const FaceUploader: React.FC<{ faceImage: UploadedImage | null; setFaceImage: (image: UploadedImage | null) => void; }> = ({ faceImage, setFaceImage }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState('');
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError('');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError("Format non supporté. Utilisez JPG, PNG ou WEBP.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            setFaceImage({ file, base64: base64Data, previewUrl: URL.createObjectURL(file) });
        };
        reader.readAsDataURL(file);
        if(fileInputRef.current) fileInputRef.current.value = '';
    }, [setFaceImage]);

    if (faceImage) {
        return (
            <div className="text-center">
                 <p className="block text-lg font-semibold text-accent mb-2">Votre visage</p>
                <div className="relative inline-block">
                    <img src={faceImage.previewUrl} alt="Aperçu du visage" className="w-48 h-48 object-cover rounded-full shadow-lg mx-auto" />
                    <button 
                      onClick={() => setFaceImage(null)} 
                      aria-label="Supprimer la photo du visage"
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors">
                        <CloseIcon />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="text-center">
            {isCameraOpen && <CameraModal onClose={() => setIsCameraOpen(false)} onCapture={setFaceImage} />}
            <p className="block text-lg font-semibold text-accent mb-2">Téléversez votre visage</p>
            <p className="text-gray-400 mb-4 text-sm max-w-xs mx-auto">Pour un résultat optimal, utilisez une photo bien éclairée, de face, sans lunettes de soleil.</p>
            <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => fileInputRef.current?.click()} className="bg-primary text-white font-bold py-2 px-4 rounded-xl inline-flex items-center justify-center transition-all hover:bg-accent">
                    <UploadIcon /> Choisir un fichier
                </button>
                <button onClick={() => setIsCameraOpen(true)} className="bg-secondary text-black font-bold py-2 px-4 rounded-xl inline-flex items-center justify-center transition-all hover:bg-yellow-400">
                    <CameraIcon /> Prendre une photo
                </button>
            </div>
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </div>
    );
};


const morphologies = [
  { value: 'mince', label: 'Mince' },
  { value: 'standard', label: 'Standard' },
  { value: 'athlétique', label: 'Athlétique' },
  { value: 'enrobée', label: 'Enrobée' },
];

const styles = [
  { value: 'casual', label: 'Casual' },
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'chic', label: 'Chic' },
  { value: 'traditionnel', label: 'Traditionnel' },
  { value: 'sportif', label: 'Sportif' },
];

const ambiances = [
    { value: 'Studio sobre (éclairage neutre)', label: 'Studio sobre' },
    { value: 'Lumière dorée du soir (extérieur)', label: 'Lumière dorée' },
    { value: 'Nuit urbaine néon', label: 'Nuit urbaine' },
    { value: 'Plage tropicale ensoleillée', label: 'Plage tropicale' },
    { value: 'Intérieur minimaliste (lumière douce)', label: 'Intérieur minimaliste' },
];

const tonsMarketing = [
    { value: 'Professionnel', label: 'Professionnel' },
    { value: 'Luxueux', label: 'Luxueux' },
    { value: 'Énergique et jeune', label: 'Énergique' },
    { value: 'Inspirant', label: 'Inspirant' },
];

const teintesPeau = [
    {value: 'noir', label: 'Noir'},
    {value: 'métis', label: 'Métis'},
    {value: 'clair', label: 'Clair'},
    {value: 'asiatique', label: 'Asiatique'},
    {value: 'blanc', label: 'Blanc'},
];


const SelectModele: React.FC<SelectModeleProps> = ({ modelOptions, setModelOptions, onGenerate, productImagePreviews, error, isGenerating, faceImage, setFaceImage, onRetry }) => {
  const handleOptionChange = <K extends keyof ModelOptions>(key: K, value: ModelOptions[K]) => {
    setModelOptions((prev) => ({ ...prev, [key]: value }));
  };

   const handleUseMyFaceToggle = () => {
      const isEnabled = !modelOptions.useMyFace;
      handleOptionChange('useMyFace', isEnabled);
      if (!isEnabled) {
          setFaceImage(null); // Clear face image when disabling
      }
  }

  const isRetryableError = error && (error.includes('surchargé') || error.includes('échoué'));

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-2 text-center">Étape 3 : Créez votre modèle virtuel</h2>
      <p className="text-gray-400 mb-6 text-center">Définissez les caractéristiques du modèle qui portera votre produit.</p>
       {error && (
            <div className="text-red-400 text-center mb-4 bg-red-900/30 p-3 rounded-lg">
                <p>{error}</p>
                {isRetryableError && (
                    <button
                        onClick={onRetry}
                        className="mt-3 bg-secondary text-black font-bold py-2 px-5 rounded-lg text-sm hover:bg-yellow-400 transition-colors"
                    >
                        Réessayer la génération
                    </button>
                )}
            </div>
        )}
      
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
        
        {/* Options Panel */}
        <div className="w-full md:flex-1 bg-dark-card/60 p-4 sm:p-6 rounded-2xl shadow-lg">
          <div className="mb-6 bg-black/20 p-4 rounded-lg border border-accent/20">
            <label htmlFor="use-my-face-toggle" className="flex items-center justify-between cursor-pointer">
                <span className="text-lg font-semibold text-white">Utiliser mon visage</span>
                <div className="relative">
                    <input id="use-my-face-toggle" type="checkbox" className="sr-only" checked={modelOptions.useMyFace} onChange={handleUseMyFaceToggle} />
                    <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${modelOptions.useMyFace ? 'transform translate-x-6 bg-accent' : ''}`}></div>
                </div>
            </label>
            {modelOptions.useMyFace && (
                <p className="text-gray-400 mt-2 text-sm">
                    L'IA va générer un modèle avec votre visage. Certaines options de personnalisation seront désactivées.
                </p>
            )}
          </div>
          
          {modelOptions.useMyFace ? (
            <div className="mb-6">
                <FaceUploader faceImage={faceImage} setFaceImage={setFaceImage} />
            </div>
            ) : (
            <>
                <OptionSelector label="Sexe" options={[{value: 'Femme', label: 'Femme'}, {value: 'Homme', label: 'Homme'}]} selected={modelOptions.sexe} onChange={(v) => handleOptionChange('sexe', v)} />
                <OptionSelector label="Teinte de peau" options={teintesPeau} selected={modelOptions.typeDePeau} onChange={(v) => handleOptionChange('typeDePeau', v)} />
                <OptionSelector label="Origine ethnique" options={['Afrique de l’Ouest', 'Afrique du Nord', 'Afrique Centrale', 'Afrique de l’Est', 'Afrique Australe', 'Afro-américain', 'Afro-caribéen'].map(v => ({value: v, label: v}))} selected={modelOptions.origineEthnique} onChange={(v) => handleOptionChange('origineEthnique', v)} />
                <OptionSelector label="Âge" options={['20-25 ans', '25-35 ans', '35-45 ans', '45+ ans'].map(v => ({value: v, label: v}))} selected={modelOptions.age} onChange={(v) => handleOptionChange('age', v)} />
                <OptionSelector label="Expression" options={['neutre', 'sourire léger', 'confiant', 'sérieux', 'joyeux'].map(v => ({value: v, label: v}))} selected={modelOptions.expression} onChange={(v) => handleOptionChange('expression', v)} />
            </>
          )}

          <OptionSelector label="Morphologie" options={morphologies} selected={modelOptions.morphologie} onChange={(v) => handleOptionChange('morphologie', v)} />
          <OptionSelector label="Style vestimentaire" options={styles} selected={modelOptions.style} onChange={(v) => handleOptionChange('style', v)} />
          <OptionSelector label="Ambiance et Lumière" options={ambiances} selected={modelOptions.ambiance} onChange={(v) => handleOptionChange('ambiance', v)} />
          <OptionSelector label="Ton Marketing" options={tonsMarketing} selected={modelOptions.tonMarketing} onChange={(v) => handleOptionChange('tonMarketing', v)} />
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
            {isGenerating ? 'Génération en cours...' : 'Générer les modèles ✨'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectModele;