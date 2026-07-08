import React, { createContext, useContext, useEffect, useState } from 'react';
import { Application } from '../types';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  education: string;
  activeGoal: string;
}

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  profile: UserProfile;
  enrolledCourses: string[];
  completedModules: Record<string, string[]>;
  checkedChecklist: Record<string, boolean>;
  earnedCertificates: string[];
  savedItems: Array<{ id: string; title: string; type: string; desc: string }>;
  applications: Application[];
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateCareerProgress: (progress: {
    enrolledCourses?: string[];
    completedModules?: Record<string, string[]>;
    checkedChecklist?: Record<string, boolean>;
    earnedCertificates?: string[];
  }) => Promise<void>;
  updateBookmarks: (savedItems: Array<{ id: string; title: string; type: string; desc: string }>) => Promise<void>;
  updateApplications: (applications: Application[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Monitor auth state from local storage on mount and sync with server
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('recruit_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
          
          // Fetch up-to-date userData from secure server-side admin Firestore proxy
          const response = await fetch('/api/auth/me', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: parsedUser.uid })
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserData(data.userData);
          } else {
            // User was removed or session invalid, log them out locally
            setUser(null);
            setUserData(null);
            localStorage.removeItem('recruit_user');
          }
        }
      } catch (err) {
        console.error("Error loading stored user:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to sign in.');
    }
    
    const loggedUser = data.user;
    setUser(loggedUser);
    setUserData(data.userData);
    localStorage.setItem('recruit_user', JSON.stringify(loggedUser));
  };

  const signUp = async (email: string, password: string, name: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to sign up.');
    }
    
    const loggedUser = data.user;
    setUser(loggedUser);
    setUserData(data.userData);
    localStorage.setItem('recruit_user', JSON.stringify(loggedUser));
  };

  const signInWithGoogle = async () => {
    throw new Error('Google Sign-In is restricted on custom domains due to Firebase security. Please use the Email & Password option above for instant and 100% secure registration/sign-in!');
  };

  const signOutUser = async () => {
    setUser(null);
    setUserData(null);
    localStorage.removeItem('recruit_user');
  };

  const resetPassword = async (email: string) => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send password reset email.');
    }
  };

  const updateUserProfile = async (profileUpdate: Partial<UserProfile>) => {
    if (!user) return;
    const response = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid, profile: profileUpdate })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update profile.');
    }
    setUserData(data.userData);
  };

  const updateCareerProgress = async (progress: {
    enrolledCourses?: string[];
    completedModules?: Record<string, string[]>;
    checkedChecklist?: Record<string, boolean>;
    earnedCertificates?: string[];
  }) => {
    if (!user) return;
    const response = await fetch('/api/auth/update-career', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid, progress })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update progress.');
    }
    setUserData(data.userData);
  };

  const updateBookmarks = async (savedItems: Array<{ id: string; title: string; type: string; desc: string }>) => {
    if (!user) return;
    const response = await fetch('/api/auth/update-bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid, savedItems })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update bookmarks.');
    }
    setUserData(data.userData);
  };

  const updateApplications = async (applications: Application[]) => {
    if (!user) return;
    const response = await fetch('/api/auth/update-applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid, applications })
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update applications.');
    }
    setUserData(data.userData);
  };

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOutUser,
      resetPassword,
      updateUserProfile,
      updateCareerProgress,
      updateBookmarks,
      updateApplications
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
