// Import necessary components and hooks
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { JarvisInterface } from './components/JarvisInterface';
import { PaymentStatus } from './components/PaymentStatus';
import { AuthScreen } from './components/AuthScreen';

const LoadingScreen = () => (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
        <p className="text-cyan-400 text-2xl font-mono animate-pulse">Initializing Protocol...</p>
    </div>
);

export default function App() {
    const { isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <Routes>
            {/* 
              Public Route: /login
              - If the user is NOT authenticated, this route renders the AuthScreen.
              - If the user IS authenticated, we redirect them away from the login page
                to the main application dashboard to avoid confusion.
            */}
            <Route 
                path="/login" 
                element={
                    !isAuthenticated ? <AuthScreen /> : <Navigate to="/dashboard" />
                } 
            />

            {/* 
              Protected Routes:
              These routes are wrapped by ProtectedRoute. If the user is not authenticated,
              ProtectedRoute will automatically redirect them to the "/login" route above.
            */}
            <Route
                path="/"
                element={<Navigate to="/dashboard" />} // Redirect root path to dashboard
            />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <JarvisInterface />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/payment-success"
                element={
                    <ProtectedRoute>
                        <PaymentStatus />
                    </ProtectedRoute>
                }
            />
             <Route
                path="/payment-cancel"
                element={
                    <ProtectedRoute>
                        <PaymentStatus />
                    </ProtectedRoute>
                }
            />

            {/* A catch-all route to handle any other path */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
    );
}