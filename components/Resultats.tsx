import React, { useState, useRef, useEffect } from 'react';

interface ResultatsProps {
  images: string[];
  caption: string;
}

const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2 text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const Lightbox: React.FC<{ imageUrl: string; onClose: () => void; onDownload: () => void; }> = ({ imageUrl, onClose, onDownload }) => {
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
                 <button onClick={onDownload} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-white font-semibold py-2 px-6 rounded-full text-lg hover:bg-accent transition-colors flex items-center shadow-lg hover:shadow-glow-accent z-10">
                    <DownloadIcon /> Télécharger
                </button>
            </div>
        </div>
    );
};


const Resultats: React.FC<ResultatsProps> = ({ images, caption }) => {
    const [copied, setCopied] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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
    
    const handleDownloadAll = () => {
        images.forEach((img, index) => {
            downloadImage(img, index);
        });
    };

  return (
    <div className="max-w-7xl mx-auto">
      {lightboxImage && <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} onDownload={() => downloadImage(lightboxImage, images.indexOf(lightboxImage))} />}
      <h2 className="text-4xl font-bold text-white mb-2 text-center">Vos visuels sont prêts 🎉</h2>
      <p className="text-lg text-gray-400 mb-8 text-center">
        {images.length > 0 ? "Cliquez sur une image pour l'agrandir et la télécharger." : "Aucune image n'a pu être générée. Veuillez réessayer."}
      </p>
      
      {images.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-12">
                {images.map((img, index) => (
                <div key={index} className="bg-dark-card rounded-xl shadow-lg overflow-hidden group">
                    <div className="overflow-hidden aspect-[3/4] relative cursor-pointer" onClick={() => setLightboxImage(img)}>
                        <img src={img} alt={`Visuel généré ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-white font-semibold text-center text-sm p-1">Agrandir</p>
                        </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); downloadImage(img, index); }} className="w-full bg-gray-700 text-white font-semibold py-2 px-4 hover:bg-primary transition-colors flex items-center justify-center text-sm">
                        <DownloadIcon /> Télécharger
                    </button>
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
