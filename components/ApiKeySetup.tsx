import React from 'react';

const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mr-3 text-secondary"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;

const ApiKeySetup: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-2xl w-full bg-dark-card p-8 rounded-2xl shadow-lg border border-accent/20">
        <div className="flex items-center mb-6">
          <KeyIcon />
          <h1 className="text-3xl font-bold text-white">Configuration Requise</h1>
        </div>
        <p className="text-gray-300 mb-6">
          Pour que la magie opère, cette application a besoin d'une clé API Google Gemini. L'obtention est gratuite et ne prend qu'une minute.
        </p>

        <div className="space-y-4 text-gray-200">
          <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
            <strong className="text-accent">Étape 1 :</strong> Accédez à Google AI Studio pour créer votre clé.
          </div>
          <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
            <strong className="text-accent">Étape 2 :</strong> Cliquez sur le bouton "Create API key in new project".
          </div>
          <div className="p-4 bg-black/30 rounded-lg border border-gray-700">
            <strong className="text-accent">Étape 3 :</strong> Copiez la clé qui s'affiche. C'est votre sésame !
          </div>
        </div>

        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 w-full bg-primary text-white font-bold py-3 px-8 rounded-xl text-lg shadow-lg hover:bg-accent transition-all duration-300 transform hover:scale-105 hover:shadow-glow-accent flex items-center justify-center"
        >
          Obtenir ma Clé API Gratuite
        </a>
        
        <div className="mt-8 pt-6 border-t border-gray-700">
             <h2 className="text-xl font-semibold text-white mb-3">Comment l'utiliser ?</h2>
             <p className="text-gray-400">
                Une fois votre clé copiée, vous devez la configurer comme variable d'environnement sur votre service de déploiement.
             </p>
             <ul className="list-disc list-inside mt-2 text-gray-400 space-y-1">
                <li>Pour <strong>Netlify</strong> : Allez dans <code className="bg-black/50 text-secondary px-1.5 py-0.5 rounded-md">Site configuration &gt; Environment variables</code>.</li>
                <li>Pour <strong>Vercel</strong> : Allez dans <code className="bg-black/50 text-secondary px-1.5 py-0.5 rounded-md">Project Settings &gt; Environment Variables</code>.</li>
             </ul>
             <p className="mt-3 text-gray-400">
                {/* FIX: Instruct user to set API_KEY instead of VITE_API_KEY to align with guidelines. */}
                Dans les deux cas, ajoutez une variable nommée <code className="bg-black/50 text-secondary px-1.5 py-0.5 rounded-md">API_KEY</code> avec votre clé comme valeur.
             </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySetup;
