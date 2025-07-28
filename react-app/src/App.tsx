// In react-app/src/App.tsx

// ... (keep all your existing imports: Routes, Route, Navigate, useAuth, etc.)

// The new Debug component
const DebugInfo = () => {
    const { isAuthenticated, isLoading } = useAuth();
    return (
        <div style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            padding: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid cyan',
            color: 'white',
            zIndex: 9999,
            fontFamily: 'monospace',
            fontSize: '16px'
        }}>
            <h4 style={{ margin: '0 0 5px 0', borderBottom: '1px solid white' }}>Auth Status</h4>
            <div>Loading: <strong style={{ color: isLoading ? 'yellow' : 'lightgreen' }}>{String(isLoading)}</strong></div>
            <div>Authenticated: <strong style={{ color: isAuthenticated ? 'cyan' : 'pink' }}>{String(isAuthenticated)}</strong></div>
        </div>
    );
};


// Your existing AppRoutes component, with ONE new line
const AppRoutes = () => {
    // Now it is safe to call useAuth here, because AppRoutes is a child of AuthProvider.
    const { isAuthenticated, isLoading } = useAuth();    

    // The ONLY change is adding this <DebugInfo /> component right here
    return (
        <>
            <DebugInfo /> 
            
            {/* The rest of your existing logic remains the same */}
            {isLoading ? (
                <div className="w-screen h-screen bg-black flex items-center justify-center">
                    <p className="text-cyan-400 text-2xl font-mono animate-pulse">Initializing Protocol...</p>
                </div>
            ) : (
                <Routes>
                    <Route 
                        path="/login" 
                        element={!isAuthenticated ? <AuthScreen /> : <Navigate to="/dashboard" replace />} 
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
                        path="/payment-status"
                        element={
                            <ProtectedRoute>
                                <PaymentStatus />
                            </ProtectedRoute>
                        }
                    />
                    <Route 
                        path="/" 
                        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            )}
        </>
    );
};


// Your main App component REMAINS THE SAME
export default function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}