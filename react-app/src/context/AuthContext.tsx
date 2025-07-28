// react-app/src/context/AuthContext.tsx - Re-engineered for Freemium Model

import { createContext, useState, useContext, useEffect, useCallback, type ReactNode } from 'react';

// --- Constants ---
const GUEST_USAGE_LIMIT = 20; // The number of free messages for a guest.
const GUEST_STORAGE_KEY = 'jarvisGuestUsage'; // The key for localStorage.

// --- Type Definitions ---
// The shape of a paying customer's data.
interface User {
    id: string;
    email: string;
    subscription: {
        tier: string;
        stripeCustomerId: string;
        subscriptionStatus: string;
    };
}

// The complete set of values our AuthContext will provide to the application.
interface AuthContextType {
    user: User | null;              // Holds data for a logged-in user.
    isAuthenticated: boolean;         // True only for paying customers.
    isLoading: boolean;               // True only on initial app load.
    messageCount: number;             // Tracks guest message usage.
    isUsageLimitReached: boolean;     // True if a guest has used all their messages.
    incrementMessageCount: () => void; // Function to increment the guest message count.
    logout: () => Promise<void>;      // Function to log out a paying customer.
}

// Create the context with a null default value.
const AuthContext = createContext<AuthContextType | null>(null);

// The AuthProvider component that will wrap our entire application.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // --- State Management ---
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [messageCount, setMessageCount] = useState(0);

    // --- Core Logic: Check Auth Status on Load ---
    useEffect(() => {
        const checkAuthStatus = async () => {
            console.log("[AUTH_V2] Checking session status...");
            try {
                const response = await fetch('/api/auth/status', {
                    credentials: 'include',
                });
                
                const data = await response.json();

                // CASE 1: The user is an authenticated, paying customer.
                if (response.ok && data.isAuthenticated && data.user) {
                    console.log("[AUTH_V2] Authenticated user found.", data.user);
                    setUser(data.user);
                    setIsAuthenticated(true);
                    // A paying customer has no message limit, so we clear any old guest data.
                    localStorage.removeItem(GUEST_STORAGE_KEY);
                } 
                // CASE 2: The user is a guest (or a failed auth attempt).
                else {
                    console.log("[AUTH_V2] No authenticated user. Initializing guest session.");
                    setIsAuthenticated(false);
                    setUser(null);
                    // Load the guest's message count from their browser's local storage.
                    const savedCount = localStorage.getItem(GUEST_STORAGE_KEY);
                    setMessageCount(savedCount ? parseInt(savedCount, 10) : 0);
                }
            } catch (error) {
                console.error('[AUTH_V2] Auth status check failed. Assuming guest session.', error);
                // In case of a network error, default safely to a guest session.
                setIsAuthenticated(false);
                setUser(null);
                const savedCount = localStorage.getItem(GUEST_STORAGE_KEY);
                setMessageCount(savedCount ? parseInt(savedCount, 10) : 0);
            } finally {
                setIsLoading(false);
                console.log("[AUTH_V2] Session check complete.");
            }
        };
        checkAuthStatus();
    }, []);

    // --- Public Functions ---

    // Increments the message count for GUESTS ONLY.
    const incrementMessageCount = useCallback(() => {
        // This function does nothing if the user is a paying customer.
        if (isAuthenticated) {
            return;
        }
        const newCount = messageCount + 1;
        setMessageCount(newCount);
        localStorage.setItem(GUEST_STORAGE_KEY, String(newCount));
    }, [isAuthenticated, messageCount]);

    // Logs out a paying customer and resets their state.
    const logout = async () => {
        console.log("[AUTH_V2] Logging out user.");
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('[AUTH_V2] Logout API call failed:', error);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            setMessageCount(0); // Reset message count on logout
            localStorage.removeItem(GUEST_STORAGE_KEY);
        }
    };

    // --- Derived State ---
    // A boolean that is true only if the user is a guest AND has hit the usage limit.
    const isUsageLimitReached = !isAuthenticated && messageCount >= GUEST_USAGE_LIMIT;

    // --- Context Value ---
    // The complete object provided to the rest of the app.
    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        messageCount,
        isUsageLimitReached,
        incrementMessageCount,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// --- Custom Hook ---
// A clean way for components to access the auth context.
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider. This is a critical error.');
    }
    return context;
};