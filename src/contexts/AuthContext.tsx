"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authError: null,
  loginWithGoogle: async () => {},
  logout: async () => {},
  clearError: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // If user logs in, ensure they exist in Firestore safely
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: currentUser.email || "",
              full_name: currentUser.displayName || "",
              photo_url: currentUser.photoURL || "",
              created_at: new Date().toISOString(),
            });
          }
        } catch (err: any) {
          console.warn("Firestore user sync warning (check Firestore rules/database):", err);
          // Do not fail the whole auth flow if Firestore has permission/setup delays
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Error logging in with Google:", error);
      let message = error.message || "Failed to sign in with Google.";
      if (error.code === "auth/popup-closed-by-user") {
        message = "Sign-in popup was closed before completing.";
      } else if (error.code === "auth/unauthorized-domain") {
        const currentDomain = typeof window !== "undefined" ? window.location.hostname : "your domain";
        message = `This domain (${currentDomain}) is not authorized in your Firebase Auth settings. Please add '${currentDomain}' in Firebase Console -> Authentication -> Settings -> Authorized domains.`;
      } else if (error.code === "auth/operation-not-allowed") {
        message = "Google Sign-In is not enabled in Firebase Console. Please enable Google provider in Authentication -> Sign-in method.";
      }
      setAuthError(message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Error logging out", error);
      setAuthError(error.message || "Failed to log out.");
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider value={{ user, loading, authError, loginWithGoogle, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
