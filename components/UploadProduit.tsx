
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadedImage } from '../types';

const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

// Camera Modal Component
const CameraModal: React.FC<{onClose: () => void, onCapture: (img: UploadedImage) => void}> = ({onClose, onCapture}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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
            const file = new File([dataUrl], `capture-${Date.now()}.jpg`, {type: 'image/jpeg'});
            
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
                    <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
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


const UploadProduit: React.FC<{onAnalyseRequest: (images: UploadedImage[]) => void}> = ({ onAnalyseRequest }) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;

    setUploadError('');
    const newImages: UploadedImage[] = [];
    const remainingSlots = 3 - uploadedImages.length;
    
    const filesToProcess = files.slice(0, remainingSlots);
    let invalidFileFound = false;

    filesToProcess.forEach((file: File) => {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
          invalidFileFound = true;
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        newImages.push({
          file: file,
          base64: base64Data,
          previewUrl: URL.createObjectURL(file),
        });

        if(newImages.length === filesToProcess.length) {
            setUploadedImages(prev => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (invalidFileFound) {
        setUploadError("Ce format d’image n’est pas encore accepté. Essayez JPG, PNG ou WEBP.");
    }
     if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }, [uploadedImages]);
  
  const handleCapture = (image: UploadedImage) => {
    if (uploadedImages.length < 3) {
        setUploadedImages(prev => [...prev, image]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  }
  
  const handleAnalyse = () => {
    if (uploadedImages.length > 0) {
        onAnalyseRequest(uploadedImages);
    }
  }

  return (
    <div className="flex flex-col items-center max-w-3xl mx-auto">
      {isCameraOpen && <CameraModal onClose={() => setIsCameraOpen(false)} onCapture={handleCapture} />}
      <h2 className="text-3xl font-bold text-white mb-2">Étape 1 : Photo du produit</h2>
      <p className="text-gray-400 mb-6 text-center">
        Importez jusqu'à 3 images ou prenez une photo.
      </p>
      
      <div className="w-full p-8 border-2 border-dashed border-accent rounded-xl text-center bg-dark-card/50 shadow-lg mb-6">
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp, image/svg+xml"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
          multiple
          disabled={uploadedImages.length >= 3}
        />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadedImages.length >= 3}
              className="bg-primary text-white font-bold py-3 px-6 rounded-xl inline-flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:bg-accent hover:shadow-glow-accent disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
            >
                <UploadIcon />
              Téléverser (Max {3 - uploadedImages.length})
            </button>
            <button
                onClick={() => setIsCameraOpen(true)}
                disabled={uploadedImages.length >= 3}
                className="bg-secondary text-black font-bold py-3 px-6 rounded-xl inline-flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:bg-yellow-400 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:transform-none"
            >
                <CameraIcon />
                Prendre une photo
            </button>
        </div>
        {uploadError && <p className="mt-4 text-sm text-red-400">{uploadError}</p>}
         <p className="mt-4 text-sm text-gray-500">Formats acceptés : PNG, JPG, WEBP, SVG</p>
      </div>

      {uploadedImages.length > 0 && (
          <div className="w-full">
            <h3 className="text-xl font-semibold text-accent mb-4">Produits téléversés :</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative aspect-square bg-dark-card rounded-lg overflow-hidden shadow-md">
                  <img src={image.previewUrl} alt={`Aperçu ${index + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(index)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors">
                    <CloseIcon/>
                  </button>
                </div>
              ))}
            </div>
             <button
                onClick={handleAnalyse}
                className="w-full bg-secondary text-black font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105"
            >
                Analyser le produit
            </button>
          </div>
        )}
    </div>
  );
};

export default UploadProduit;