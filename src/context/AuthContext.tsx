import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from '../firebase/config';
import { getUserProfile, saveUserProfile } from '../firebase/dbService';
import { B2BProfile } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  b2bProfile: B2BProfile;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateB2BProfile: (updated: Partial<B2BProfile>) => Promise<void>;
}

const defaultProfile: B2BProfile = {
  companyName: 'TecnoAero Solutions S.L.',
  vatId: 'B-67219904',
  contactPerson: 'Ing. Alejandro Morales',
  email: 'a.morales@tecnoaero.es',
  tier: 'Gold',
  totalSpent: 18450,
  ordersCount: 14,
  ndaSigned: true,
};

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  b2bProfile: defaultProfile,
  isLoading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  updateB2BProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [b2bProfile, setB2BProfile] = useState<B2BProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setB2BProfile(profile);
          } else {
            // Create initial profile for newly authenticated user
            const newProfile: B2BProfile = {
              companyName: user.displayName ? `${user.displayName} Engineering` : 'Particular / Empresa',
              vatId: 'ES-B' + Math.floor(10000000 + Math.random() * 90000000),
              contactPerson: user.displayName || 'Usuario B2B',
              email: user.email || '',
              tier: 'Silver',
              totalSpent: 5200,
              ordersCount: 3,
              ndaSigned: true,
            };
            await saveUserProfile(user.uid, newProfile);
            setB2BProfile(newProfile);
          }
        } catch (err) {
          console.warn('Profile sync error:', err);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign-in error:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setB2BProfile(defaultProfile);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const updateB2BProfile = async (updated: Partial<B2BProfile>) => {
    const merged = { ...b2bProfile, ...updated };
    setB2BProfile(merged);
    if (currentUser) {
      await saveUserProfile(currentUser.uid, merged);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        b2bProfile,
        isLoading,
        signInWithGoogle,
        logout,
        updateB2BProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
