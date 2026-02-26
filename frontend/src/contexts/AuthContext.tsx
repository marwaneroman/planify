import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch } from "@/lib/apiClient";
import { setAuthToken } from "@/lib/apiClient";

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: { full_name?: string };
}

export interface AuthSession {
  access_token: string;
  user: AuthUser;
}

interface AuthContextType {
  session: AuthSession | null;
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setSession: (session: AuthSession | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  setSession: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<{ session: AuthSession }>("/auth/me")
      .then((data) => {
        if (data?.session) {
          setSession(data.session);
        } else {
          setAuthToken(null);
        }
      })
      .catch(() => {
        setAuthToken(null);
        setSession(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signOut = async () => {
    setAuthToken(null);
    setSession(null);
  };

  const handleSession = (s: AuthSession | null) => {
    setSession(s);
    if (s?.access_token) setAuthToken(s.access_token);
    else setAuthToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut,
        setSession: handleSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
