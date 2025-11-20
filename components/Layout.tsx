import React from 'react';
import { AppStep } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentStep: AppStep;
  onNavigate: (step: AppStep) => void;
  isGenerating?: boolean; // New prop for global state
  onReturnToGeneration?: () => void; // Action to return
}

// --- ICONS ---

// Nouveau Logo Afro-Futuriste
const LogoIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse-slow">
    <defs>
      <linearGradient id="logo_grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7F00FF" />
        <stop offset="50%" stopColor="#00F0FF" />
        <stop offset="100%" stopColor="#FFD700" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Outer Circuit Ring */}
    <circle cx="20" cy="20" r="18" stroke="url(#logo_grad)" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="4 4" />
    
    {/* African Mask / Shield Abstract Shape */}
    <path 
      d="M20 4C14 4 10 9 10 16C10 24 15 34 20 36C25 34 30 24 30 16C30 9 26 4 20 4Z" 
      fill="none" 
      stroke="url(#logo_grad)" 
      strokeWidth="2" 
      filter="url(#glow)"
    />
    
    {/* Neural Nodes (Eyes/Tech) */}
    <circle cx="16" cy="16" r="2" fill="#00F0FF" />
    <circle cx="24" cy="16" r="2" fill="#00F0FF" />
    
    {/* Center Core */}
    <path d="M20 20L20 30" stroke="#7F00FF" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="20" cy="24" r="1" fill="#FFD700" />
    
    {/* Decorative Lines */}
    <path d="M10 16L4 16" stroke="url(#logo_grad)" strokeWidth="1" opacity="0.6" />
    <path d="M30 16L36 16" stroke="url(#logo_grad)" strokeWidth="1" opacity="0.6" />
  </svg>
);

const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const CreateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const AdminIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 2a10 10 0 0 1 10 10h-10V2z"></path><path d="M12 12L2.1 12.6a10 10 0 0 0 19.8 0L12 12z"></path></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const CommunityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;

const Layout: React.FC<LayoutProps> = ({ children, currentStep, onNavigate, isGenerating, onReturnToGeneration }) => {
  const { currentUser, isAdmin, logout } = useAuth() || {};

  // Determine if we should show the sidebar (only when logged in and not in landing page/auth)
  const showSidebar = currentUser && currentStep !== AppStep.Accueil && currentStep !== AppStep.Auth;

  const NavItem = ({ step, icon, label }: { step: AppStep, icon: React.ReactNode, label: string }) => {
    // Upload is active if we are in any of the creation steps
    const isActive = currentStep === step || (step === AppStep.Upload && [AppStep.Select, AppStep.Generate, AppStep.Results].includes(currentStep));
    return (
      <button
        onClick={() => onNavigate(step)}
        className={`flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
          isActive 
            ? 'bg-primary/10 text-white' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_#7F00FF]"></div>}
        <span className={`${isActive ? 'text-primary drop-shadow-[0_0_5px_rgba(127,0,255,0.8)]' : 'group-hover:text-white'} transition-colors duration-300`}>
          {icon}
        </span>
        <span className="font-medium tracking-wide">{label}</span>
      </button>
    );
  };

  // Avatar Logic
  const userAvatar = currentUser?.photoURL ? (
    <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white">
      {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden flex bg-bg-dark">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      </div>

      {/* Sidebar (Desktop) */}
      {showSidebar && (
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 z-20 border-r border-white/5 bg-bg-card/30 backdrop-blur-xl">
          <div className="p-8 flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate(AppStep.Accueil)}>
            <div className="relative transform group-hover:scale-110 transition-transform duration-300">
              <LogoIcon />
              <div className="absolute inset-0 bg-primary blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white">
              Aura<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Studio</span>
            </span>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            <NavItem step={AppStep.Accueil} icon={<DashboardIcon />} label="Tableau de bord" />
            <NavItem step={AppStep.Upload} icon={<CreateIcon />} label="Nouvelle Création" />
            <NavItem step={AppStep.Community} icon={<CommunityIcon />} label="Communauté" />
            <div className="my-4 border-t border-white/5 mx-2"></div>
            <NavItem step={AppStep.Profile} icon={<ProfileIcon />} label="Mon Profil" />
            {isAdmin && <NavItem step={AppStep.Admin} icon={<AdminIcon />} label="Administration" />}
          </nav>

          {/* Global Generation Status Indicator (Desktop) */}
          {isGenerating && currentStep !== AppStep.Generate && (
             <div className="px-4 pb-4 animate-fade-in">
                 <button 
                    onClick={onReturnToGeneration}
                    className="w-full bg-bg-card border border-accent/30 rounded-xl p-3 flex items-center gap-3 shadow-glow-accent hover:bg-white/5 transition-colors group"
                 >
                    <div className="relative w-3 h-3">
                        <span className="absolute inset-0 rounded-full bg-accent opacity-75 animate-ping"></span>
                        <span className="absolute inset-0 rounded-full bg-accent"></span>
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold text-white">Création en cours...</p>
                        <p className="text-[10px] text-accent group-hover:underline">Voir le résultat</p>
                    </div>
                 </button>
             </div>
          )}

          <div className="p-4 border-t border-white/5">
            <button onClick={() => { logout?.(); onNavigate(AppStep.Auth); }} className="flex items-center w-full gap-3 px-4 py-3 text-gray-500 hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/5">
              <LogoutIcon />
              <span className="font-medium text-sm">Déconnexion</span>
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Bottom Navigation */}
      {showSidebar && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 flex justify-around p-4 pb-safe shadow-2xl">
           <button onClick={() => onNavigate(AppStep.Accueil)} className={`flex flex-col items-center transition-colors ${currentStep === AppStep.Accueil ? 'text-primary' : 'text-gray-500'}`}>
             <DashboardIcon />
             <span className="text-[10px] mt-1 font-medium">Accueil</span>
           </button>
           <button onClick={() => onNavigate(AppStep.Community)} className={`flex flex-col items-center transition-colors ${currentStep === AppStep.Community ? 'text-primary' : 'text-gray-500'}`}>
             <CommunityIcon />
             <span className="text-[10px] mt-1 font-medium">Communauté</span>
           </button>
           <button 
             onClick={() => onNavigate(AppStep.Upload)} 
             className="relative -top-8 bg-gradient-to-br from-primary to-primary-light text-white p-4 rounded-full shadow-[0_0_15px_rgba(127,0,255,0.5)] border-4 border-bg-dark transform hover:scale-110 transition-transform"
           >
             <CreateIcon />
           </button>
           <button onClick={() => onNavigate(AppStep.Profile)} className={`flex flex-col items-center transition-colors ${currentStep === AppStep.Profile ? 'text-primary' : 'text-gray-500'}`}>
             <ProfileIcon />
             <span className="text-[10px] mt-1 font-medium">Profil</span>
           </button>
        </nav>
      )}

      {/* Mobile Generation Indicator Pill */}
      {showSidebar && isGenerating && currentStep !== AppStep.Generate && (
         <button 
            onClick={onReturnToGeneration}
            className="md:hidden fixed bottom-24 right-4 z-40 bg-black/80 backdrop-blur border border-accent/50 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-bounce"
         >
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
            <span className="text-xs font-bold">Génération...</span>
         </button>
      )}

      {/* Main Content */}
      <main className={`flex-1 relative z-10 overflow-y-auto h-screen scroll-smooth ${!showSidebar ? 'w-full' : ''}`}>
        {/* Mobile Header for Sidebar Context */}
        {showSidebar && (
          <div className="md:hidden p-4 flex items-center justify-between sticky top-0 bg-bg-dark/80 backdrop-blur-md z-30 border-b border-white/5">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8"><LogoIcon /></div>
                <span className="font-display font-bold text-lg text-white">Aura<span className="text-primary">Studio</span></span>
             </div>
             <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
               {userAvatar}
             </div>
          </div>
        )}
        
        <div className={`mx-auto max-w-7xl p-4 md:p-8 lg:p-12 ${showSidebar ? 'pb-24 md:pb-12' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;