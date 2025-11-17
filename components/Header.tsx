import React from 'react';
import { AppStep } from '../types';

interface HeaderProps {
    step: AppStep;
    onGoBack: () => void;
    onGoHome: () => void;
}

const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);
const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);
const CancelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const Header: React.FC<HeaderProps> = ({ step, onGoBack, onGoHome }) => {

    if (step === AppStep.Accueil) {
        // Header vide pour la page d'accueil pour maintenir la mise en page
        return <header className="w-full h-[60px] mb-8" />;
    }

    const isGenerating = step === AppStep.Generate;

    return (
        <header className="w-full grid grid-cols-3 items-center mb-8">
            <div className="justify-self-start">
                 <button 
                    onClick={onGoBack} 
                    aria-label={isGenerating ? 'Annuler la génération' : 'Retourner à l\'étape précédente'}
                    className={`flex items-center transition-colors font-semibold p-2 rounded-lg hover:bg-white/10 ${isGenerating ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-white'}`}
                >
                    {isGenerating ? <CancelIcon /> : <BackIcon />}
                    <span className="ml-2 hidden sm:inline">{isGenerating ? 'Annuler' : 'Précédent'}</span>
                </button>
            </div>
           
            <div></div>

            <div className="justify-self-end flex items-center gap-2">
                <button 
                    onClick={onGoHome} 
                    aria-label="Retourner au menu principal"
                    className="flex items-center text-gray-400 hover:text-white transition-colors font-semibold p-2 rounded-lg hover:bg-white/10">
                    <HomeIcon />
                     <span className="ml-2 hidden sm:inline">Menu principal</span>
                </button>
            </div>
        </header>
    );
}

export default Header;