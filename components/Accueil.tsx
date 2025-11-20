import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AccueilProps {
  onStart: () => void;
}

const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

const Accueil: React.FC<AccueilProps> = ({ onStart }) => {
  const auth = useAuth();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[90vh] text-center px-4 overflow-hidden">
      
      {/* Top Right Actions */}
      {auth?.currentUser && (
          <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
              <button 
                onClick={() => auth.logout()} 
                className="flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 transition-all group backdrop-blur-md"
                aria-label="Déconnexion"
              >
                  <span className="hidden md:inline text-sm font-bold text-gray-300 group-hover:text-red-400">Déconnexion</span>
                  <div className="text-gray-400 group-hover:text-red-400"><LogoutIcon /></div>
              </button>
          </div>
      )}

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto animate-fade-in">
        <div className="mb-6 inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse"></span>
            <span className="text-xs md:text-sm text-gray-300 font-medium tracking-wide uppercase">La Nouvelle Ère du E-Commerce</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-display font-bold mb-8 leading-[0.9] tracking-tighter">
          <span className="block text-white mb-2">AfroVibe</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-pulse-slow">Aura Studio</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-400 mb-10 leading-relaxed font-light">
          Donnez vie à vos produits avec des mannequins virtuels <span className="text-white font-medium">ultra-réalistes</span>.
          Une identité visuelle unique qui captive votre audience instantanément.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStart}
            className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-full overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(127,0,255,0.6)] transition-all duration-300"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 group-hover:text-white transition-colors flex items-center">
              {auth?.currentUser ? "Accéder au Studio" : "Commencer l'expérience"}
              <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </span>
          </button>
        </div>
      </div>

      {/* Abstract Visual Representation */}
      <div className="mt-16 md:mt-24 w-full max-w-4xl relative animate-slide-up" style={{animationDelay: '0.2s'}}>
         <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-30"></div>
         <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-bg-card shadow-2xl">
            <img
                src="https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Interface Afro-futuriste"
                className="w-full h-auto object-cover opacity-80 hover:opacity-100 transition-opacity duration-700 hover:scale-105 transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div>
                    <p className="text-accent text-sm font-mono mb-1 font-bold">TECHNOLOGIE IA DE POINTE</p>
                    <p className="text-white font-bold text-lg">Rendu Photographique Haute Fidélité</p>
                </div>
            </div>
         </div>
      </div>

      <footer className="mt-20 mb-8 text-gray-600 text-sm">
        <p>© DAML Consulting - Tous droits réservés.</p>
      </footer>
    </div>
  );
};

export default Accueil;