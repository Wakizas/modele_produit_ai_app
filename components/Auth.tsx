import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthProps {
  onAuthSuccess: () => void;
}

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
);

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  async function handleGoogleLogin() {
    if (!auth) return;
    
    // Si mode inscription, le username est obligatoire
    if (!isLogin && !username.trim()) {
        setError("Veuillez choisir un pseudo pour votre première connexion.");
        return;
    }

    setError('');
    try {
        // On passe le username si on est en mode inscription
        await auth.loginWithGoogle(!isLogin ? username : undefined);
        onAuthSuccess();
    } catch (err: any) {
        console.error(err);
        setError("Échec de la connexion Google. Veuillez réessayer.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!auth) return;

    try {
      if (isLogin) {
        await auth.login(email, password, rememberMe);
      } else {
        if (!username.trim()) throw new Error("USERNAME_REQUIRED");
        await auth.signup(email, password, username, rememberMe);
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      let msg = "Une erreur est survenue.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = "Email ou mot de passe incorrect.";
      } else if (err.code === 'auth/email-already-in-use') {
        msg = "Cet email est déjà utilisé.";
      } else if (err.code === 'auth/weak-password') {
        msg = "Le mot de passe doit contenir au moins 6 caractères.";
      } else if (err.message === "USERNAME_REQUIRED") {
        msg = "Veuillez renseigner un pseudo.";
      }
      setError(msg);
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-fade-in">
      <div className="bg-dark-card p-8 rounded-2xl shadow-glow-accent w-full max-w-md border border-white/10 relative overflow-hidden">
        {/* Background accents */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-2xl rounded-full -mr-8 -mt-8"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 blur-2xl rounded-full -ml-8 -mb-8"></div>

        <h2 className="text-3xl font-bold text-white mb-2 text-center relative z-10">
          {isLogin ? 'Connexion Studio' : 'Rejoindre l\'Aura'}
        </h2>
        <p className="text-gray-400 text-center mb-6 relative z-10 text-sm">
          {isLogin ? 'Reprenez vos créations là où vous les avez laissées.' : 'Créez votre identité visuelle unique dès maintenant.'}
        </p>

        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-xs text-center font-medium animate-pulse">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          
          {/* USERNAME FIELD - VISIBLE ONLY FOR SIGNUP */}
          {!isLogin && (
             <div className="animate-slide-up">
                <label className="block text-xs font-bold uppercase text-accent mb-1 ml-1">Pseudo / Nom d'utilisateur</label>
                <input
                  type="text"
                  required={!isLogin}
                  className="w-full bg-black/40 border border-accent/50 rounded-xl px-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder-gray-600"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: AuraArtist"
                />
             </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">Email</label>
            <input
              type="email"
              required
              className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-gray-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="creator@afrovibe.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">Mot de passe</label>
            <div className="relative">
                <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all pr-12 placeholder-gray-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-2"
                >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 group cursor-pointer"
            >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-300 ${rememberMe ? 'bg-primary border-primary shadow-glow-primary' : 'bg-transparent border-gray-600 group-hover:border-gray-400'}`}>
                    {rememberMe && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    )}
                </div>
                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors select-none">Rester connecté</span>
            </button>

            {isLogin && (
                <button type="button" className="text-xs text-gray-500 hover:text-primary transition-colors">
                    Mot de passe oublié ?
                </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primary-light text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-glow-primary transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
                 <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Connexion...
                 </span>
            ) : (isLogin ? 'Accéder au Studio' : "Créer mon Compte")}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6 relative z-10">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-xs text-gray-500 uppercase">Ou</span>
            <div className="h-px bg-white/10 flex-1"></div>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-1 gap-4 mb-6 relative z-10">
            <button onClick={handleGoogleLogin} className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group">
                <GoogleIcon />
                <span className="text-sm font-medium text-gray-300 group-hover:text-white">
                    {isLogin ? "Continuer avec Google" : "S'inscrire avec Google"}
                </span>
            </button>
        </div>

        <div className="mt-6 text-center relative z-10">
          <p className="text-gray-500 text-sm">
            {isLogin ? "Pas encore membre ?" : "Déjà membre ?"}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-white font-bold ml-2 hover:text-accent transition-colors underline decoration-transparent hover:decoration-accent"
            >
              {isLogin ? "S'inscrire gratuitement" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;