



import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadedImage } from '../types';

// ICONS
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z"></path></svg>;


interface MediaItem {
    file: File;
    type: 'image' | 'video';
    previewUrl: string;
}

// UTILITY FUNCTIONS
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const extractFramesFromVideo = (videoFile: File, frameCount: number): Promise<{ base64: string, file: File }[]> => {
    return new Promise(async (resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        let timeoutId: number;

        const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (video.src) {
                URL.revokeObjectURL(video.src);
                video.src = '';
            }
            video.onerror = null;
            video.onloadedmetadata = null;
        };

        timeoutId = window.setTimeout(() => {
            cleanup();
            reject(new Error("Le traitement de la vidéo a expiré (20s)."));
        }, 20000);

        video.onerror = () => {
            cleanup();
            reject(new Error('Erreur lors du traitement de la vidéo. Le fichier est peut-être corrompu ou non supporté.'));
        };

        video.onloadedmetadata = async () => {
            try {
                const duration = video.duration;
                if (duration <= 0 || !isFinite(duration)) {
                    return reject(new Error("La durée de la vidéo est invalide."));
                }

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) {
                    return reject(new Error("Contexte du canevas non disponible."));
                }

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const frames: { base64: string, file: File }[] = [];
                // Capture frames from 0.1s to avoid potential black first frame
                const startTime = Math.min(0.1, duration);
                const effectiveDuration = duration - startTime;
                const interval = frameCount > 1 ? effectiveDuration / (frameCount - 1) : 0;

                for (let i = 0; i < frameCount; i++) {
                    const time = startTime + (i * interval);
                    video.currentTime = time;
                    
                    await new Promise<void>((res, rej) => {
                        const seekTimeout = setTimeout(() => rej(new Error('Le positionnement dans la vidéo a expiré.')), 3000);
                        const onSeeked = () => {
                            clearTimeout(seekTimeout);
                            video.removeEventListener('seeked', onSeeked);
                            res();
                        };
                        video.addEventListener('seeked', onSeeked);
                    });
                    
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg');
                    const base64 = dataUrl.split(',')[1];
                    
                    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg'));
                    if (!blob) {
                        console.warn(`Impossible de créer un blob pour l'image au temps ${time}`);
                        continue;
                    }
                    
                    const file = new File([blob], `frame-${i}.jpg`, { type: 'image/jpeg' });
                    frames.push({ base64, file });
                }
                
                resolve(frames);

            } catch (err) {
                reject(err);
            } finally {
                cleanup();
            }
        };
        
        video.src = URL.createObjectURL(videoFile);
    });
};


// MODAL COMPONENTS
const CameraModal: React.FC<{onClose: () => void, onCapture: (img: MediaItem) => void}> = ({onClose, onCapture}) => {
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
            streamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (!context) return;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            // FIX: Create file from blob to ensure correct image content
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `capture-${Date.now()}.jpg`, {type: 'image/jpeg'});
                    onCapture({ file, type: 'image', previewUrl: dataUrl });
                    onClose();
                }
            }, 'image/jpeg');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-dark-card rounded-xl shadow-lg p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-4">Prendre une photo</h3>
                {error ? <p className="text-red-400">{error}</p> : <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />}
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex justify-end gap-4 mt-4">
                    <button onClick={onClose} className="bg-gray-700 text-gray-200 font-bold py-2 px-4 rounded-xl hover:bg-gray-600 transition-colors">Annuler</button>
                    <button onClick={handleCapture} disabled={!!error} className="bg-primary text-white font-bold py-2 px-4 rounded-xl hover:bg-accent transition-colors disabled:bg-gray-600">Capturer</button>
                </div>
            </div>
        </div>
    );
}

const VideoRecorderModal: React.FC<{onClose: () => void, onCapture: (video: MediaItem) => void}> = ({onClose, onCapture}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [countdown, setCountdown] = useState(5);
    const [error, setError] = useState('');
    // FIX: Changed NodeJS.Timeout to number for browser compatibility
    const countdownIntervalRef = useRef<number>();

    useEffect(() => {
        if (recordedBlob) return; // Don't run this effect in preview mode.

        const startCamera = async () => {
            if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
                setError("L'enregistrement vidéo n'est pas supporté par votre navigateur.");
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
                streamRef.current = stream;
                if(videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                setError("Impossible d'accéder à la caméra.");
            }
        };

        startCamera();
        
        return () => {
            streamRef.current?.getTracks().forEach(track => track.stop());
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
    }, [recordedBlob]);


    const startRecording = () => {
        if (!streamRef.current) return;
        setIsRecording(true);
        setRecordedBlob(null);
        const chunks: Blob[] = [];
        mediaRecorderRef.current = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorderRef.current.onstop = () => setRecordedBlob(new Blob(chunks, { type: 'video/webm' }));
        mediaRecorderRef.current.start();
        
        setCountdown(5);
        countdownIntervalRef.current = window.setInterval(() => {
            setCountdown(prev => {
                if(prev <= 1) {
                    stopRecording();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        setTimeout(stopRecording, 5000);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };

    const handleUseVideo = () => {
        if (!recordedBlob) return;
        const file = new File([recordedBlob], `video-${Date.now()}.webm`, { type: 'video/webm' });
        onCapture({ file, type: 'video', previewUrl: URL.createObjectURL(file) });
        onClose();
    };
    
    return (
       <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-dark-card rounded-xl shadow-lg p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-4">{recordedBlob ? "Aperçu de la vidéo" : "Filmer votre produit"}</h3>
                {error ? <p className="text-red-400">{error}</p> : (
                    <div className="relative">
                        {recordedBlob ? (
                            <video key="preview" src={URL.createObjectURL(recordedBlob)} autoPlay playsInline muted loop className="w-full rounded-lg" />
                        ) : (
                            <video key="recorder" ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg" />
                        )}
                        {isRecording && <div className="absolute top-2 right-2 bg-red-500 text-white font-bold rounded-full h-8 w-8 flex items-center justify-center animate-pulse">{countdown}</div>}
                    </div>
                )}
                <div className="flex justify-end gap-4 mt-4">
                    {recordedBlob ? (
                        <>
                            <button onClick={() => setRecordedBlob(null)} className="bg-gray-700 text-gray-200 font-bold py-2 px-4 rounded-xl hover:bg-gray-600">Recommencer</button>
                            <button onClick={handleUseVideo} className="bg-primary text-white font-bold py-2 px-4 rounded-xl hover:bg-accent">Utiliser la vidéo</button>
                        </>
                    ) : (
                        <>
                            <button onClick={onClose} className="bg-gray-700 text-gray-200 font-bold py-2 px-4 rounded-xl hover:bg-gray-600">Annuler</button>
                            <button onClick={startRecording} disabled={isRecording || !!error} className="bg-red-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-red-500 disabled:bg-gray-600">{isRecording ? "Enregistrement..." : "Lancer (5s)"}</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};


// MAIN COMPONENT
const UploadProduit: React.FC<{onUploadConfirmed: (images: UploadedImage[]) => void}> = ({ onUploadConfirmed }) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVideoRecorderOpen, setIsVideoRecorderOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasVideo = mediaItems.some(item => item.type === 'video');
  const canUploadImage = !hasVideo && mediaItems.length < 3;
  const canUploadVideo = mediaItems.length === 0;

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;
    setUploadError('');

    const file = files[0]; // Process one file at a time to simplify logic
    const fileType = file.type.split('/')[0];

    if (fileType === 'image' && canUploadImage) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setUploadError("Format d’image non supporté. Essayez JPG, PNG ou WEBP.");
            return;
        }
        setMediaItems(prev => [...prev, { file, type: 'image', previewUrl: URL.createObjectURL(file) }]);
    } else if (fileType === 'video' && canUploadVideo) {
         if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
            setUploadError("Format vidéo non supporté. Essayez MP4, WEBM ou MOV.");
            return;
        }
        setMediaItems([{ file, type: 'video', previewUrl: URL.createObjectURL(file) }]);
    } else {
        setUploadError(`Vous ne pouvez pas ajouter ce média. Règle : 1 vidéo OU jusqu'à 3 images.`);
    }

    if(fileInputRef.current) fileInputRef.current.value = '';
  }, [canUploadImage, canUploadVideo]);
  
  const handleCapture = (media: MediaItem) => {
    if (media.type === 'image' && canUploadImage) {
        setMediaItems(prev => [...prev, media]);
    } else if (media.type === 'video' && canUploadVideo) {
        setMediaItems([media]);
    }
  };

  const removeMedia = (index: number) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
  }
  
  const handleConfirm = async () => {
    if (mediaItems.length === 0) return;
    setIsProcessing(true);
    setUploadError('');

    try {
        let finalImages: UploadedImage[] = [];
        if (hasVideo) {
            const videoItem = mediaItems.find(item => item.type === 'video');
            if(videoItem) {
                const frames = await extractFramesFromVideo(videoItem.file, 5);
                finalImages = frames.map(frame => ({
                    ...frame,
                    previewUrl: URL.createObjectURL(frame.file)
                }));
            }
        } else {
            const imagePromises = mediaItems.map(async (item) => {
                const base64 = await fileToBase64(item.file);
                return { file: item.file, base64, previewUrl: item.previewUrl };
            });
            finalImages = await Promise.all(imagePromises);
        }
        onUploadConfirmed(finalImages);
    } catch(err) {
        // FIX: The caught error `err` is of type `unknown`. Add a type guard to check if it's an instance of `Error` before accessing its properties like `message`.
        console.error("Processing error:", err);
        if (err instanceof Error) {
            setUploadError(`Une erreur est survenue lors du traitement : ${err.message}. Veuillez réessayer.`);
        } else {
            setUploadError("Une erreur est survenue lors du traitement de votre média. Veuillez réessayer.");
        }
        setIsProcessing(false);
    }
  }

  return (
    <div className="flex flex-col items-center max-w-3xl mx-auto">
      {isCameraOpen && <CameraModal onClose={() => setIsCameraOpen(false)} onCapture={handleCapture} />}
      {isVideoRecorderOpen && <VideoRecorderModal onClose={() => setIsVideoRecorderOpen(false)} onCapture={handleCapture} />}
      
      <h2 className="text-3xl font-bold text-white mb-2">Étape 1 : Photo ou Vidéo du produit</h2>
      <p className="text-gray-400 mb-6 text-center">
        Importez jusqu'à 3 images OU une courte vidéo (5s max).
      </p>
      
      <div className="w-full p-8 border-2 border-dashed border-accent rounded-xl text-center bg-dark-card/50 shadow-lg mb-6">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
          disabled={!canUploadImage && !canUploadVideo}
        />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => fileInputRef.current?.click()} disabled={!canUploadImage && !canUploadVideo} className="bg-primary text-white font-bold py-3 px-6 rounded-xl inline-flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:bg-accent hover:shadow-glow-accent disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none">
              <UploadIcon /> { hasVideo ? 'Média chargé' : `Téléverser (${3 - mediaItems.length} restants)`}
            </button>
            <button onClick={() => setIsCameraOpen(true)} disabled={!canUploadImage} className="bg-secondary text-black font-bold py-3 px-6 rounded-xl inline-flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:bg-yellow-400 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:transform-none">
              <CameraIcon /> Prendre une photo
            </button>
             <button onClick={() => setIsVideoRecorderOpen(true)} disabled={!canUploadVideo} className="bg-accent text-white font-bold py-3 px-6 rounded-xl inline-flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:bg-purple-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:transform-none">
              <VideoIcon /> Filmer une vidéo
            </button>
        </div>
        {uploadError && <p className="mt-4 text-sm text-red-400">{uploadError}</p>}
         <p className="mt-4 text-sm text-gray-500">Formats : JPG, PNG, WEBP / MP4, MOV, WEBM</p>
      </div>

      {mediaItems.length > 0 && (
          <div className="w-full">
            <h3 className="text-xl font-semibold text-accent mb-4">Média téléversé :</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {mediaItems.map((media, index) => (
                <div key={index} className="relative aspect-square bg-dark-card rounded-lg overflow-hidden shadow-md">
                  {media.type === 'image' ? (
                    <img src={media.previewUrl} alt={`Aperçu ${index + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <>
                        <video src={media.previewUrl} className="w-full h-full object-cover" loop autoPlay muted playsInline />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <PlayIcon />
                        </div>
                    </>
                  )}
                  <button onClick={() => removeMedia(index)} aria-label={`Supprimer le média ${index + 1}`} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors">
                    <CloseIcon/>
                  </button>
                </div>
              ))}
            </div>
             <button onClick={handleConfirm} disabled={isProcessing} className="w-full bg-secondary text-black font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isProcessing ? "Traitement en cours..." : "Analyser le produit"}
            </button>
          </div>
        )}
    </div>
  );
};

export default UploadProduit;