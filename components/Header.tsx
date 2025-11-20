import React from 'react';
import { AppStep } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    step: AppStep;
    onGoBack: () => void;
    onGoHome: () => void;
    onGoProfile: () => void;
    onGoAdmin: () => void;
}

const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);
const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);
const CancelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const AdminIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 2a10 10 0 0 1 10 10h-10V2z"></path><path d="M12 12L2.1 12.6a10 10 0 0 0 19.8 0L12 12z"></path></svg> // Simple chart icon for dashboard
);

const Header: React.FC<HeaderProps> = ({ step, onGoBack, onGoHome, onGoProfile, onGoAdmin }) => {
    const auth = useAuth();
    const isLoggedIn = !!auth?.currentUser;
    const isAdmin = !!auth?.isAdmin;
    const isGenerating = step === AppStep.Generate;

    const showBack = step !== AppStep.Accueil && step !== AppStep.Auth;
    const showMenu = step !== AppStep.Accueil && step !== AppStep.Auth;

    if (step === AppStep.Accueil && !isLoggedIn) {
        return <header className="w-full h-[60px] mb-8 flex justify-end p-2">
             <button 
                onClick={onGoProfile} // Redirects to Auth if not logged in
                className="text-sm font-bold text-accent hover:text-white transition-colors border border-accent rounded-full px-4 py-2"
             >
                Connexion
             </button>
        </header>;
    }

    return (
        <header className="w-full grid grid-cols-3 items-center mb-8">
            <div className="justify-self-start">
                {showBack && (
                    <button 
                        onClick={onGoBack} 
                        aria-label={isGenerating ? 'Annuler la génération' : 'Retourner à l\'étape précédente'}
                        className={`flex items-center transition-colors font-semibold p-2 rounded-lg hover:bg-white/10 ${isGenerating ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-white'}`}
                    >
                        {isGenerating ? <CancelIcon /> : <BackIcon />}
                        <span className="ml-2 hidden sm:inline">{isGenerating ? 'Annuler' : 'Précédent'}</span>
                    </button>
                )}
            </div>
           
            <div className="justify-self-center">
                 {/* Center content if needed */}
            </div>

            <div className="justify-self-end flex items-center gap-2">
                {isAdmin && isLoggedIn && (
                    <button 
                    onClick={onGoAdmin} 
                    className={`flex items-center transition-colors font-semibold p-2 rounded-lg hover:bg-white/10 ${step === AppStep.Admin ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'}`}>
                    <AdminIcon />
                </button>
                )}
                
                {isLoggedIn && (
                    <button 
                        onClick={onGoProfile} 
                        aria-label="Mon Profil"
                        className={`flex items-center transition-colors font-semibold p-2 rounded-lg hover:bg-white/10 ${step === AppStep.Profile ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'}`}>
                        <UserIcon />
                    </button>
                )}

                {showMenu && (
                    <button 
                        onClick={onGoHome} 
                        aria-label="Retourner au menu principal"
                        className="flex items-center text-gray-400 hover:text-white transition-colors font-semibold p-2 rounded-lg hover:bg-white/10">
                        <HomeIcon />
                    </button>
                )}
            </div>
        </header>
    );
}

export default Header;