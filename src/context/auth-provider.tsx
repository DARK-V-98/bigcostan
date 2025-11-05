
'use client';

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase-client';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import FirebaseErrorListener from '@/components/FirebaseErrorListener';

type Role = 'admin' | 'developer' | 'user' | 'agent';
export type Permission = 'overview' | 'roles' | 'messages' | 'events' | 'projects' | 'homes' | 'properties' | 'submissions';


type AuthContextType = {
  user: User | null;
  role: Role | null;
  permissions: Permission[];
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEVELOPER_EMAIL = 'thimira.vishwa2003@gmail.com';

const defaultPermissions: Record<Role, Permission[]> = {
    developer: ['overview', 'roles', 'messages', 'events', 'projects', 'homes', 'properties', 'submissions'],
    admin: ['overview', 'roles', 'messages', 'events', 'projects', 'homes', 'properties', 'submissions'],
    agent: ['properties', 'submissions'],
    user: [],
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = async () => {
    await auth.signOut();
    setUser(null);
    setRole(null);
    setPermissions([]);
    router.push('/');
  };

  useEffect(() => {
    let firestoreUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
      }

      if (user) {
        setLoading(true);
        setUser(user);
        const userDocRef = doc(db, 'users', user.uid);

        firestoreUnsubscribe = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            let currentRole: Role = data.role || 'user';
            
            if (data.email === DEVELOPER_EMAIL) {
                if (data.role !== 'developer') {
                  await setDoc(userDocRef, { role: 'developer' }, { merge: true });
                }
                currentRole = 'developer';
            }
            
            setRole(currentRole);
            setPermissions(data.permissions || defaultPermissions[currentRole] || []);

          } else {
            try {
              if (user.email) {
                const newRole: Role = user.email === DEVELOPER_EMAIL ? 'developer' : 'user';
                const newPermissions = defaultPermissions[newRole];
                await setDoc(userDocRef, {
                  email: user.email,
                  role: newRole,
                  permissions: newPermissions,
                  createdAt: serverTimestamp(),
                });
                // Listener will fire and set the state
              } else {
                 setRole('user');
                 setPermissions([]);
              }
            } catch (error) {
              console.error("Error creating Firestore document for user:", error);
              setRole('user');
              setPermissions([]);
            }
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user document:", error);
          setUser(null);
          setRole(null);
          setPermissions([]);
          setLoading(false);
        });

      } else {
        setUser(null);
        setRole(null);
        setPermissions([]);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, permissions, loading, logout }}>
        <FirebaseErrorListener />
        {loading ? (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-6 w-48" />
                </div>
            </div>
        ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
