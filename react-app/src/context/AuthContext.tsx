// react-app/src/context/AuthContext.tsx - COMPLETE VERBOSE LOGGING VERSION

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define the shape of the user object and the context value
interface User {
    id: string;
    email: string;
    subscription: {
        tier: string;
        stripeCustomerId: string;
        subscriptionStatus: string;
    };
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (userData: User) => void;
    logout: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    console.log("[AUTH_CONTEXT] AuthProvider is mounting or re-rendering.");

    useEffect(() => {
        const checkAuthStatus = async () => {
            console.log("[AUTH_CONTEXT] useEffect triggered. Checking auth status...");
            try {
                const apiUrl = '/api/auth/status';
                console.log(`[AUTH_CONTEXT] Fetching from URL: ${apiUrl}`);
                const response = await fetch(apiUrl, {
                    credentials: 'include',
                });

                console.log(`[AUTH_CONTEXT] Received response with status: ${response.status}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("[AUTH_CONTEXT] Auth status data received:", data);
                    if (data.isAuthenticated) {
                        setUser(data.user);
                        setIsAuthenticated(true);
                    }
                } else {
                    const errorText = await response.text();
                    console.error("[AUTH_CONTEXT] Auth status check failed with non-OK response. Body:", errorText);
                }
            } catch (error) {
                console.error('[AUTH_CONTEXT] An error occurred during fetch:', error);
            } finally {
                console.log("[AUTH_CONTEXT] Finished auth check. Setting isLoading to false.");
                setIsLoading(false);
            }
        };
        checkAuthStatus();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        console.error("CRITICAL REACT ERROR: useAuth was called outside of an AuthProvider's scope!");
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};