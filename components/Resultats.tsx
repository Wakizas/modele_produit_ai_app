import React, { useState, useRef, useEffect } from 'react';

interface ResultatsProps {
  images: string[];
  caption: string;
  onStartNew: () => void;
}

const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2 text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const Lightbox: React.FC<{ imageUrl: string; onClose: () => void; onDownload: () => void; onShare?: () => void; }> = ({ imageUrl, onClose, onDownload, onShare }) => {
    const [scale, setScale] = useState(1);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const newScale = e.deltaY > 0 ? scale * 0.9 : scale * 1.1;
        setScale(Math.min(Math.max(0.5, newScale), 5));
    };
    
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden flex items-center justify-center" onClick={(e) => e.stopPropagation()} onWheel={handleWheel}>
                <img 
                    ref={imgRef}
                    src={imageUrl} 
                    alt="Visuel agrandi" 
                    className="w-auto h-auto max-w-full max-h-[80vh] object-contain rounded-lg transition-transform duration-150"
                    style={{ transform: `scale(${scale})`, cursor: 'zoom-in' }}
                />
                <button 
                    onClick={onClose} 
                    aria-label="Fermer l'aperçu"
                    className="absolute -top-4 -right-4 bg-white text-black rounded-full p-2 hover:bg-gray-300 transition-colors z-10">
                    <CloseIcon />
                </button>
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-4 z-10">
                    <button onClick={onDownload} className="bg-primary text-white font-semibold py-3 px-4 sm:px-6 rounded-full text-base hover:bg-accent transition-colors flex items-center shadow-lg hover:shadow-glow-accent">
                        <DownloadIcon /> <span className="ml-2">Télécharger</span>
                    </button>
                    {onShare && (
                        <button onClick={onShare} className="bg-secondary text-black font-semibold py-3 px-4 sm:px-6 rounded-full text-base hover:bg-yellow-400 transition-colors flex items-center shadow-lg">
                            <ShareIcon /> <span className="ml-2">Partager</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


const Resultats: React.FC<ResultatsProps> = ({ images, caption, onStartNew }) => {
    const [copied, setCopied] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [isShareApiAvailable, setIsShareApiAvailable] = useState(false);

    useEffect(() => {
        if (navigator.share) {
            setIsShareApiAvailable(true);
        }
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(caption);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const downloadImage = (src: string, index: number) => {
        const link = document.createElement('a');
        link.href = src;
        link.download = `modele-virtuel-${Date.now()}-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async (src: string, index: number) => {
        if (!navigator.share) return;
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const file = new File([blob], `visuel-afrovibe-${index + 1}.png`, { type: blob.type });

            await navigator.share({
                title: 'Visuel généré par AfroVibe Aura Studio',
                text: caption,
                files: [file],
            });
        } catch (error) {
            console.error('Erreur lors du partage :', error);
        }
    };
    
    const handleDownloadAll = () => {
        images.forEach((img, index) => {
            downloadImage(img, index);
        });
    };

  return (
    <div className="max-w-7xl mx-auto">
      {lightboxImage && <Lightbox 
                            imageUrl={lightboxImage} 
                            onClose={() => setLightboxImage(null)} 
                            onDownload={() => downloadImage(lightboxImage, images.indexOf(lightboxImage))}
                            onShare={isShareApiAvailable ? () => handleShare(lightboxImage, images.indexOf(lightboxImage)) : undefined}
                        />}
      <h2 className="text-4xl font-bold text-white mb-2 text-center">Vos visuels sont prêts 🎉</h2>
      <p className="text-lg text-gray-400 mb-8 text-center">
        {images.length > 0 ? "Cliquez sur une image pour l'agrandir et la télécharger." : "Aucune image n'a pu être générée. Veuillez réessayer."}
      </p>
      
      {images.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-12">
                {images.map((img, index) => (
                <div key={index} className="bg-dark-card rounded-xl shadow-lg overflow-hidden group flex flex-col">
                    <div className="overflow-hidden aspect-[3/4] relative cursor-pointer" onClick={() => setLightboxImage(img)}>
                        <img src={img} alt={`Visuel généré ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white font-semibold text-center text-sm p-1">Agrandir</p>
                        </div>
                    </div>
                    <div className="flex bg-gray-700">
                        <button 
                            onClick={(e) => { e.stopPropagation(); downloadImage(img, index); }} 
                            aria-label={`Télécharger l'image ${index + 1}`}
                            className="flex-1 text-white font-semibold py-3 px-2 hover:bg-primary transition-colors flex items-center justify-center text-sm">
                            <DownloadIcon />
                            <span className="hidden sm:inline ml-2">Télécharger</span>
                        </button>
                         {isShareApiAvailable && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleShare(img, index); }} 
                                aria-label={`Partager l'image ${index + 1}`}
                                className="flex-1 text-white font-semibold py-3 px-2 hover:bg-accent transition-colors flex items-center justify-center text-sm border-l border-gray-600">
                                <ShareIcon />
                                <span className="hidden sm:inline ml-2">Partager</span>
                            </button>
                        )}
                    </div>
                </div>
                ))}
            </div>

            <div className="bg-dark-card/70 p-4 sm:p-6 rounded-2xl shadow-lg mb-8">
                <h3 className="text-xl sm:text-2xl font-semibold text-accent mb-4">Légende marketing suggérée :</h3>
                <div className="bg-black/30 p-4 rounded-lg border border-gray-700 relative">
                    <p className="text-gray-200 italic pr-24 text-sm sm:text-base">"{caption}"</p>
                    <button onClick={handleCopy} className="absolute top-1/2 -translate-y-1/2 right-2 bg-gray-700 text-white px-3 py-1 text-sm font-semibold rounded-full border border-gray-600 hover:bg-gray-600 transition-colors flex items-center">
                    {copied ? <CheckIcon /> : <CopyIcon />} {copied ? 'Copié !' : 'Copier'}
                    </button>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <button onClick={onStartNew} className="w-full sm:w-auto bg-gray-700 text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-600 transition-colors flex items-center justify-center">
                    <PlusIcon /> Créer un nouveau visuel
                </button>
                <button onClick={handleDownloadAll} className="w-full sm:w-auto bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-accent transition-colors flex items-center justify-center transform hover:scale-105 hover:shadow-glow-accent">
                    <DownloadIcon /> Télécharger tout
                </button>
            </div>
          </>
      )}
    </div>
  );
};

export default Resultats;