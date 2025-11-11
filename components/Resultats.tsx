import React, { useState } from 'react';

interface ResultatsProps {
  images: string[];
  caption: string;
  onRestart: () => void;
  onBack: () => void;
}

const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2 text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

const Lightbox: React.FC<{ imageUrl: string; onClose: () => void; onDownload: () => void; }> = ({ imageUrl, onClose, onDownload }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <img src={imageUrl} alt="Visuel agrandi" className="w-auto h-auto max-w-full max-h-[80vh] object-contain rounded-lg"/>
                <button onClick={onClose} className="absolute -top-4 -right-4 bg-white text-black rounded-full p-2 hover:bg-gray-300 transition-colors">
                    <CloseIcon />
                </button>
                 <button onClick={onDownload} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-white font-semibold py-2 px-6 rounded-full text-lg hover:bg-accent transition-colors flex items-center shadow-lg hover:shadow-glow-accent">
                    <DownloadIcon /> Télécharger en PNG HD
                </button>
            </div>
        </div>
    );
};


const Resultats: React.FC<ResultatsProps> = ({ images, caption, onRestart, onBack }) => {
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
        link.download = `modele-realiste-${Date.now()}-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleDownloadAll = () => {
        images.forEach((img, index) => {
            // Stagger downloads to prevent browser from blocking them
            setTimeout(() => {
                downloadImage(img, index);
            }, index * 300);
        });
    };

  return (
    <div className="max-w-6xl mx-auto">
      {lightboxImage && <Lightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} onDownload={() => downloadImage(lightboxImage, images.indexOf(lightboxImage))} />}
      <h2 className="text-4xl font-bold text-white mb-2 text-center">Vos visuels sont prêts 🎉</h2>
      <p className="text-lg text-gray-400 mb-8 text-center">Survolez une image pour zoomer, ou cliquez pour la voir en grand.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {images.map((img, index) => (
          <div key={index} className="bg-dark-card rounded-xl shadow-lg overflow-hidden group cursor-pointer" onClick={() => setLightboxImage(img)}>
            <div className="overflow-hidden aspect-[3/4] relative">
                <img src={img} alt={`Visuel généré ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-semibold">Agrandir</p>
                </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-dark-card/70 p-6 rounded-2xl shadow-lg mb-8">
        <h3 className="text-2xl font-semibold text-accent mb-4">Légende marketing suggérée :</h3>
        <div className="bg-black/30 p-4 rounded-lg border border-gray-700 relative">
            <p className="text-gray-200 italic pr-24">"{caption}"</p>
            <button onClick={handleCopy} className="absolute top-1/2 -translate-y-1/2 right-2 bg-gray-700 text-white px-3 py-1 text-sm font-semibold rounded-full border border-gray-600 hover:bg-gray-600 transition-colors flex items-center">
               {copied ? <CheckIcon /> : <CopyIcon />} {copied ? 'Copié !' : 'Copier'}
            </button>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-4">
        <button onClick={onBack} className="bg-gray-700 text-gray-200 font-bold py-3 px-6 rounded-xl hover:bg-gray-600 transition-colors">
            Modifier le modèle
        </button>
         <button onClick={handleDownloadAll} className="bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-accent transition-colors flex items-center transform hover:scale-105 hover:shadow-glow-accent">
            <DownloadIcon /> Télécharger tout
        </button>
        <button onClick={onRestart} className="bg-secondary text-black font-bold py-3 px-6 rounded-xl hover:bg-yellow-400 transition-colors">
            Nouveau projet
        </button>
      </div>
    </div>
  );
};

export default Resultats;