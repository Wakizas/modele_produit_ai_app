import React from 'react';

const Generation: React.FC<{ progress: number; generatedImages: (string | null)[] }> = ({ progress, generatedImages }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="relative w-48 h-48 mb-12">
            <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
            <div 
                className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" 
                style={{borderRightColor: 'transparent'}}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-4xl font-display font-bold text-white">{Math.round(progress)}%</span>
            </div>
        </div>

        <h2 className="text-3xl font-bold text-white mb-4">Le Studio Travaille...</h2>
        <p className="text-gray-400 max-w-md mx-auto mb-12">
            Notre IA calcule l'éclairage, applique les textures et génère vos mannequins virtuels.
        </p>

        <div className="flex gap-4 justify-center">
            {generatedImages.map((img, i) => (
                <div key={i} className={`w-16 h-24 rounded-lg border ${img ? 'border-success shadow-[0_0_10px_#00E676]' : 'border-white/10 bg-white/5'} overflow-hidden transition-all duration-500`}>
                    {img && <img src={img} className="w-full h-full object-cover" />}
                </div>
            ))}
        </div>
    </div>
  );
};

export default Generation;