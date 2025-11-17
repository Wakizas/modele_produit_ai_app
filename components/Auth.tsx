import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  AuthError
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getFriendlyErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'L\'adresse e-mail n\'est pas valide.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'L\'adresse e-mail ou le mot de passe est incorrect.';
      case 'auth/email-already-in-use':
        return 'Cette adresse e-mail est déjà utilisée par un autre compte.';
      case 'auth/weak-password':
        return 'Le mot de passe doit contenir au moins 6 caractères.';
      default:
        return 'Une erreur est survenue. Veuillez réessayer.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Créer un document pour le nouvel utilisateur dans Firestore
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          createdAt: new Date(),
        });
      }
    } catch (err) {
      const authError = err as AuthError;
      console.error("Authentication error:", authError.code);
      setError(getFriendlyErrorMessage(authError.code));
      setLoading(false);
    }
    // Le rechargement est géré par le onAuthStateChanged listener
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-bg-start to-dark-bg-end p-4">
      <div className="w-full max-w-md bg-dark-card/60 p-8 rounded-2xl shadow-lg text-white">
        <h1 className="text-3xl font-bold mb-2 text-center text-accent">{isLogin ? 'Connexion' : 'Créer un compte'}</h1>
        <p className="text-gray-400 mb-6 text-center">Accédez à votre studio de création virtuel.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Adresse e-mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:border-accent focus:ring-accent transition"
              placeholder="votre.email@exemple.com"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:border-accent focus:ring-accent transition"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="mb-4 text-sm text-center text-red-400 bg-red-900/30 p-2 rounded-lg">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-accent transition-all duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-wait"
          >
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="ml-2 font-semibold text-accent hover:text-purple-400">
            {isLogin ? 'Inscrivez-vous' : 'Connectez-vous'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
