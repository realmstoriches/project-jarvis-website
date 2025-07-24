import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

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

// 1. Create the context with a default value of null
const AuthContext = createContext<AuthContextType | null>(null);

// 2. Create the Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const response = await fetch('/api/auth/status');
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
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
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

// 3. Create a custom hook for easy consumption of the context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};