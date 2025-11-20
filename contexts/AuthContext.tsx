import React, { useContext, useState, useEffect, createContext, PropsWithChildren } from "react";
import { auth, db } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  updateProfile as firebaseUpdateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  createdAt: string;
  xp?: number; // Gamification
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (email: string, pass: string, username: string, rememberMe?: boolean) => Promise<void>;
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<void>;
  loginWithGoogle: (username?: string) => Promise<void>;
  logout: () => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const createOrUpdateProfile = async (user: User, additionalData: Partial<UserProfile> = {}) => {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || "",
        displayName: additionalData.displayName || user.displayName || "",
        photoURL: user.photoURL || "",
        role: 'user',
        createdAt: new Date().toISOString(),
        xp: 0,
        ...additionalData
      };
      try {
        await setDoc(docRef, newProfile);
        setUserProfile(newProfile);
      } catch (e) {
        console.warn("Firestore write failed, using local profile");
        setUserProfile(newProfile);
      }
    } else {
      // Update login-specific info if needed (like photoURL if changed on social)
      const updates: any = {};
      if (user.photoURL !== docSnap.data().photoURL) updates.photoURL = user.photoURL;
      
      // If we have a forced username (from Google signup flow) and the doc doesn't have a proper one yet
      if (additionalData.displayName && docSnap.data().displayName !== additionalData.displayName) {
          updates.displayName = additionalData.displayName;
      }

      if (Object.keys(updates).length > 0) {
          await updateDoc(docRef, updates);
          setUserProfile({ ...docSnap.data(), ...updates } as UserProfile);
      } else {
          setUserProfile(docSnap.data() as UserProfile);
      }
    }
  };

  async function signup(email: string, pass: string, username: string, rememberMe: boolean = true) {
    const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceType);
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    
    // Update Auth Profile
    await firebaseUpdateProfile(res.user, { displayName: username });
    
    // Create Firestore Doc
    await createOrUpdateProfile(res.user, { displayName: username });
  }

  async function login(email: string, pass: string, rememberMe: boolean = true) {
    const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceType);
    await signInWithEmailAndPassword(auth, email, pass);
  }

  async function loginWithGoogle(username?: string) {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    
    // If a username was provided (Registration mode), we prefer it over the Google name
    const profileData: Partial<UserProfile> = {};
    if (username) {
        profileData.displayName = username;
    }
    
    await createOrUpdateProfile(res.user, profileData);
  }

  function logout() {
    setUserProfile(null);
    return signOut(auth);
  }

  // GAMIFICATION LOGIC
  async function addXp(amount: number) {
    if (!currentUser) return;
    // Optimistic UI update
    setUserProfile(prev => prev ? { ...prev, xp: (prev.xp || 0) + amount } : null);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        xp: increment(amount)
      });
    } catch (e) {
      console.error("Failed to update XP", e);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // On fetch juste le profil existant sans forcer de mise à jour
        const docRef = doc(db, "users", user.uid);
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setUserProfile(docSnap.data() as UserProfile);
            } else {
                // Fallback if doc missing (should be handled by createOrUpdate but good for safety)
                setUserProfile({
                    uid: user.uid,
                    email: user.email || "",
                    displayName: user.displayName || "",
                    photoURL: user.photoURL || "",
                    role: 'user',
                    createdAt: new Date().toISOString(),
                    xp: 0
                });
            }
        } catch (e) {
            console.error("Auth state error", e);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    addXp,
    isAdmin: userProfile?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}