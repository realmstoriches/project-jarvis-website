// react-app/src/context/AuthContext.tsx - FINAL LINTED VERSION

import { createContext, useState, useContext, useEffect, ReactNode } from 'react'; // <-- CORRECTED: 'React' has been removed

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

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                // We use a simple relative path. The browser will automatically
                // send this request to the same domain the website is on (your Render server).
                const response = await fetch('/api/auth/status', {
                    credentials: 'include', // This is CRITICAL for sending the session cookie.
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.isAuthenticated) {
                        setUser(data.user);
                        setIsAuthenticated(true);
                    }
                }
            } catch (error) {
                console.error('Error checking authentication status:', error);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuthStatus();
    }, []); // Empty dependency array ensures this runs only once on mount

    const login = (userData: User) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            // The logout endpoint also uses a simple relative path.
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

// This custom hook makes it easy for components to access the auth context.
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};