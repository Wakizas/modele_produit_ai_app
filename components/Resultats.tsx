import React, { useState, useRef, useEffect } from 'react';

const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const ZoomInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const ZoomOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>;
const ResetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>;
const PanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>;

const ImageViewer: React.FC<{ src: string; onClose: () => void; onDownload: () => void }> = ({ src, onClose, onDownload }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    
    // Refs for touch calculations
    const imgRef = useRef<HTMLImageElement>(null);
    const startPos = useRef({ x: 0, y: 0 });
    const startTouchDistance = useRef<number | null>(null);
    const startScale = useRef(1);

    // Helpers
    const distance = (t1: React.Touch, t2: React.Touch) => {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.hypot(dx, dy);
    };

    // Zoom controls
    const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 5));
    const handleZoomOut = () => setScale(s => Math.max(s - 0.5, 1));
    const handleReset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

    // --- MOUSE EVENTS ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true);
            startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            e.preventDefault();
            setPosition({
                x: e.clientX - startPos.current.x,
                y: e.clientY - startPos.current.y
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    // --- TOUCH EVENTS (Mobile Friendly) ---
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            // Single finger drag
            if (scale > 1) {
                setIsDragging(true);
                startPos.current = { 
                    x: e.touches[0].clientX - position.x, 
                    y: e.touches[0].clientY - position.y 
                };
            }
        } else if (e.touches.length === 2) {
            // Two finger pinch
            setIsDragging(false);
            startTouchDistance.current = distance(e.touches[0], e.touches[1]);
            startScale.current = scale;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        // Empêcher le scroll de la page (crucial pour mobile)
        // Note: touch-action: none dans le CSS gère aussi cela
        
        if (e.touches.length === 1 && isDragging) {
            // Pan
            setPosition({
                x: e.touches[0].clientX - startPos.current.x,
                y: e.touches[0].clientY - startPos.current.y
            });
        } else if (e.touches.length === 2 && startTouchDistance.current !== null) {
            // Pinch
            const newDist = distance(e.touches[0], e.touches[1]);
            const ratio = newDist / startTouchDistance.current;
            // Limit zoom
            const newScale = Math.min(Math.max(startScale.current * ratio, 1), 5);
            setScale(newScale);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        startTouchDistance.current = null;
        // Reset position if zoomed out
        if (scale <= 1) {
            setPosition({ x: 0, y: 0 });
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[9999] bg-black/95 flex flex-col animate-fade-in"
            onClick={onClose}
            style={{ touchAction: 'none' }} // CRITICAL: Disables browser handling of gestures
        >
            {/* Top Bar */}
            <div className="flex justify-between items-center p-4 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={onClose} className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors">
                    <CloseIcon />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="px-4 py-2 bg-white text-black rounded-full text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg">
                    <DownloadIcon /> <span className="hidden sm:inline">Télécharger</span>
                </button>
            </div>

            {/* Image Area */}
            <div 
                className="flex-1 overflow-hidden flex items-center justify-center relative w-full h-full"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <img 
                    ref={imgRef}
                    src={src} 
                    draggable={false}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    alt="Zoom"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out', // Faster transition for pinch
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="select-none touch-none"
                />
            </div>

            {/* Bottom Controls (Floating HUD) */}
            <div 
                className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-6 px-6 py-4 bg-[#121212]/90 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={handleZoomOut} className="p-3 text-gray-300 hover:text-white active:scale-90 transition-transform disabled:opacity-30" disabled={scale <= 1}>
                    <ZoomOutIcon />
                </button>
                
                <div className="flex flex-col items-center w-16">
                    <span className="text-lg font-bold text-accent">{Math.round(scale * 100)}%</span>
                    {scale > 1 && <span className="text-[9px] text-gray-400 flex items-center gap-1"><PanIcon /> Glisser</span>}
                </div>

                <button onClick={handleZoomIn} className="p-3 text-gray-300 hover:text-white active:scale-90 transition-transform disabled:opacity-30" disabled={scale >= 5}>
                    <ZoomInIcon />
                </button>
                
                <div className="w-px h-8 bg-white/20 mx-2"></div>
                
                <button onClick={handleReset} className="p-3 text-white bg-white/10 rounded-full active:bg-white/20 transition-colors" title="Réinitialiser">
                    <ResetIcon />
                </button>
            </div>
        </div>
    );
};

interface ResultatsProps {
    images: string[];
    caption: string;
    onStartNew: () => void;
    modelOptions?: any;
    onPublish?: () => void;
}

const Resultats: React.FC<ResultatsProps> = ({ images, caption, onStartNew, onPublish }) => {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [hasPublished, setHasPublished] = useState(false);

  const download = (url: string) => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `afrovibe-${Date.now()}.png`;
      a.click();
  };

  const handlePublish = () => {
      if (onPublish) {
          onPublish();
          setHasPublished(true);
      }
  };

  return (
    <div className="animate-slide-up pb-20">
       {selectedImg && (
           <ImageViewer 
                src={selectedImg} 
                onClose={() => setSelectedImg(null)} 
                onDownload={() => download(selectedImg)} 
           />
       )}

       <div className="text-center mb-12">
           <h2 className="text-4xl font-display font-bold text-white mb-4">Collection Générée</h2>
           <p className="text-gray-400">Voici vos visuels haute fidélité.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
           {images.map((img, i) => (
               <div key={i} onClick={() => setSelectedImg(img)} className="group relative aspect-[3/4] bg-bg-card rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(127,0,255,0.3)]">
                   <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                       <span className="text-white text-sm font-medium flex items-center gap-2">
                           <ZoomInIcon /> Agrandir
                       </span>
                   </div>
               </div>
           ))}
       </div>

       <div className="bg-bg-card/50 border border-white/10 rounded-2xl p-8 max-w-3xl mx-auto backdrop-blur-sm mb-12 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-accent"></div>
           <h3 className="text-xs font-bold text-accent uppercase tracking-widest mb-4">Caption Marketing IA</h3>
           <p className="text-xl text-white font-light italic leading-relaxed">"{caption}"</p>
           <button onClick={() => navigator.clipboard.writeText(caption)} className="mt-4 text-sm text-gray-400 hover:text-white underline decoration-dotted">Copier le texte</button>
       </div>

       <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
           <button onClick={onStartNew} className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors shadow-lg">
               Nouveau Projet
           </button>
           
           {onPublish && (
               <button 
                onClick={handlePublish} 
                disabled={hasPublished}
                className={`w-full sm:w-auto px-8 py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 ${hasPublished ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-default' : 'bg-accent/10 text-accent border border-accent/50 hover:bg-accent/20 hover:shadow-glow-accent'}`}
               >
                   {hasPublished ? (
                       <>✓ Partagé</>
                   ) : (
                       <><ShareIcon /> Partager au Nexus</>
                   )}
               </button>
           )}

           <button onClick={() => images.forEach(download)} className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 text-white rounded-full font-bold hover:bg-white/10 transition-colors">
               Tout Télécharger
           </button>
       </div>
    </div>
  );
};

export default Resultats;