import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadedImage } from '../types';

// ICONS
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z"></path></svg>;

interface MediaItem {
    file: File;
    type: 'image' | 'video';
    previewUrl: string;
}

// UTILITY FUNCTIONS (kept same logic, styling updated in components)
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier.'));
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
            reject(new Error('Erreur vidéo. Fichier corrompu ou non supporté.'));
        };

        video.onloadedmetadata = async () => {
            try {
                const duration = video.duration;
                if (duration <= 0 || !isFinite(duration)) return reject(new Error("Durée invalide."));

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) return reject(new Error("Erreur système (canvas)."));

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const frames: { base64: string, file: File }[] = [];
                const startTime = Math.min(0.1, duration);
                const effectiveDuration = duration - startTime;
                const interval = frameCount > 1 ? effectiveDuration / (frameCount - 1) : 0;

                for (let i = 0; i < frameCount; i++) {
                    const time = startTime + (i * interval);
                    video.currentTime = time;
                    
                    await new Promise<void>((res, rej) => {
                        const seekTimeout = setTimeout(() => rej(new Error('Timeout seek.')), 3000);
                        const onSeeked = () => {
                            clearTimeout(seekTimeout);
                            video.removeEventListener('seeked', onSeeked);
                            res();
                        };
                        video.addEventListener('seeked', onSeeked);
                    });
                    
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg'));
                    if (blob) {
                        const base64 = (canvas.toDataURL('image/jpeg').split(',')[1]);
                        const file = new File([blob], `frame-${i}.jpg`, { type: 'image/jpeg' });
                        frames.push({ base64, file });
                    }
                }
                resolve(frames);
            } catch (err: any) {
                reject(new Error(`Extraction échouée: ${err.message}`));
            } finally {
                cleanup();
            }
        };
        video.src = URL.createObjectURL(videoFile);
    });
};

// --- COMPONENTS ---

const CameraModal: React.FC<{onClose: () => void, onCapture: (img: MediaItem) => void}> = ({onClose, onCapture}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if(videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) {
                setError("Accès caméra refusé.");
            }
        };
        startCamera();
        return () => {
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `capture-${Date.now()}.jpg`, {type: 'image/jpeg'});
                    onCapture({ file, type: 'image', previewUrl: canvas.toDataURL('image/jpeg') });
                    onClose();
                }
            }, 'image/jpeg');
        }
    };

    return (
        <div className="fixed inset-0 bg-bg-dark/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-bg-card border border-white/10 rounded-2xl shadow-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-display font-bold text-white mb-4">Photo</h3>
                {error ? <p className="text-red-400">{error}</p> : <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl border border-white/5" />}
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors">Annuler</button>
                    <button onClick={handleCapture} className="px-6 py-2 bg-primary hover:bg-primary-light text-white rounded-lg font-bold transition-colors shadow-glow-primary">Capturer</button>
                </div>
            </div>
        </div>
    );
}

const VideoRecorderModal: React.FC<{onClose: () => void, onCapture: (video: MediaItem) => void}> = ({onClose, onCapture}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [countdown, setCountdown] = useState(5);
    const [error, setError] = useState('');
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (recordedBlob) return;
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
                streamRef.current = stream;
                if(videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) {
                setError("Accès caméra refusé.");
            }
        };
        startCamera();
        return () => {
           streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, [recordedBlob]);

    const startRecording = () => {
        if (!streamRef.current) return;
        setIsRecording(true);
        const chunks: Blob[] = [];
        const recorder = new MediaRecorder(streamRef.current);
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => setRecordedBlob(new Blob(chunks, { type: 'video/webm' }));
        recorder.start();
        mediaRecorderRef.current = recorder;
        
        setCountdown(5);
        const interval = setInterval(() => {
            setCountdown(prev => {
                if(prev <= 1) {
                    recorder.stop();
                    clearInterval(interval);
                    setIsRecording(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleUseVideo = () => {
        if (!recordedBlob) return;
        const file = new File([recordedBlob], `video-${Date.now()}.webm`, { type: 'video/webm' });
        onCapture({ file, type: 'video', previewUrl: URL.createObjectURL(file) });
        onClose();
    };

    return (
       <div className="fixed inset-0 bg-bg-dark/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-bg-card border border-white/10 rounded-2xl shadow-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-display font-bold text-white mb-4">{recordedBlob ? "Aperçu" : "Vidéo (5s)"}</h3>
                {error ? <p className="text-red-400">{error}</p> : (
                    <div className="relative rounded-xl overflow-hidden border border-white/5">
                        {recordedBlob ? (
                            <video src={URL.createObjectURL(recordedBlob)} autoPlay playsInline muted loop className="w-full" />
                        ) : (
                            <video ref={videoRef} autoPlay playsInline muted className="w-full" />
                        )}
                        {isRecording && <div className="absolute top-3 right-3 bg-red-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center animate-pulse border border-white/20">{countdown}</div>}
                    </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                    {recordedBlob ? (
                        <>
                            <button onClick={() => setRecordedBlob(null)} className="px-4 py-2 text-gray-400 hover:text-white">Refaire</button>
                            <button onClick={handleUseVideo} className="px-6 py-2 bg-primary hover:bg-primary-light text-white rounded-lg font-bold shadow-glow-primary">Utiliser</button>
                        </>
                    ) : (
                        <>
                            <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Annuler</button>
                            <button onClick={startRecording} disabled={isRecording} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold disabled:opacity-50">
                                {isRecording ? "..." : "REC"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const UploadProduit: React.FC<{onUploadConfirmed: (images: UploadedImage[]) => void}> = ({ onUploadConfirmed }) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVideoRecorderOpen, setIsVideoRecorderOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasVideo = mediaItems.some(i => i.type === 'video');
  const canAdd = !hasVideo && mediaItems.length < 3;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('video') ? 'video' : 'image';
    if (type === 'video' && mediaItems.length > 0) return; // Video must be alone
    if (type === 'image' && hasVideo) return; // No images if video present
    setMediaItems(prev => type === 'video' ? [{ file, type, previewUrl: URL.createObjectURL(file) }] : [...prev, { file, type, previewUrl: URL.createObjectURL(file) }]);
  };

  const processUpload = async () => {
    setIsProcessing(true);
    try {
        let final: UploadedImage[] = [];
        if (hasVideo) {
            const frames = await extractFramesFromVideo(mediaItems[0].file, 5);
            final = frames.map(f => ({ ...f, previewUrl: URL.createObjectURL(f.file) }));
        } else {
            final = await Promise.all(mediaItems.map(async m => ({
                file: m.file,
                base64: await fileToBase64(m.file),
                previewUrl: m.previewUrl
            })));
        }
        onUploadConfirmed(final);
    } catch (err) {
        console.error(err);
        setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      {isCameraOpen && <CameraModal onClose={() => setIsCameraOpen(false)} onCapture={(m) => setMediaItems(prev => [...prev, m])} />}
      {isVideoRecorderOpen && <VideoRecorderModal onClose={() => setIsVideoRecorderOpen(false)} onCapture={(m) => setMediaItems([m])} />}

      <h2 className="text-3xl font-display font-bold text-white mb-2 text-center">L'Objet du Désir</h2>
      <p className="text-gray-400 text-center mb-8">Montrez-nous le produit. Nous créons l'univers.</p>

      {/* Drag Drop Zone */}
      <div className="relative group">
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-1000 ${mediaItems.length > 0 ? 'opacity-50' : ''}`}></div>
        <div className="relative bg-bg-card border border-white/10 rounded-2xl p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
             
             {mediaItems.length === 0 ? (
                 <>
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <UploadIcon />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Glissez votre produit ici</h3>
                    <p className="text-gray-500 mb-8 text-sm max-w-xs mx-auto">Supporte JPG, PNG ou courtes vidéos MP4.</p>
                    
                    <div className="flex flex-wrap justify-center gap-4">
                        <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/5">
                            Parcourir
                        </button>
                        <button onClick={() => setIsCameraOpen(true)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/5 flex items-center gap-2">
                            <CameraIcon /> Photo
                        </button>
                        <button onClick={() => setIsVideoRecorderOpen(true)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/5 flex items-center gap-2">
                            <VideoIcon /> Vidéo
                        </button>
                    </div>
                 </>
             ) : (
                 <div className="w-full">
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                        {mediaItems.map((m, i) => (
                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group/item">
                                {m.type === 'video' ? <video src={m.previewUrl} className="w-full h-full object-cover" muted /> : <img src={m.previewUrl} className="w-full h-full object-cover" />}
                                <button onClick={() => setMediaItems(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors">
                                    <CloseIcon />
                                </button>
                            </div>
                        ))}
                        {canAdd && (
                            <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 hover:text-primary hover:border-primary/50 transition-colors">
                                <span className="text-3xl mb-1">+</span>
                                <span className="text-xs font-medium">Ajouter</span>
                            </button>
                        )}
                     </div>
                     <button onClick={processUpload} disabled={isProcessing} className="w-full py-4 bg-primary hover:bg-primary-light text-white font-bold rounded-xl shadow-glow-primary transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100">
                        {isProcessing ? "Analyse dimensionnelle..." : "Confirmer le Produit"}
                     </button>
                 </div>
             )}
        </div>
      </div>
      
      <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleFile} />
    </div>
  );
};

export default UploadProduit;