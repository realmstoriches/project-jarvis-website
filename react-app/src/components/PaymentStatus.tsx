import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

// A custom hook to easily parse query parameters from the URL
const useQuery = () => {
    return new URLSearchParams(useLocation().search);
}

export const PaymentStatus = () => {
    const query = useQuery();
    const [status, setStatus] = useState<'success' | 'cancel' | 'loading'>('loading');

    useEffect(() => {
        // Stripe redirects with a session_id on success
        const sessionId = query.get('session_id');
        
        if (sessionId) {
            setStatus('success');
            // In a real-world scenario, you might want to call your backend here
            // to verify the session status one last time, but the webhook is the primary source of truth.
        } else {
            // If there's no session_id, we assume the user canceled.
            setStatus('cancel');
        }
    }, [query]);

    if (status === 'loading') {
        return (
            <div className="w-screen h-screen bg-black flex items-center justify-center">
                <p className="text-cyan-400 text-2xl font-mono animate-pulse">Verifying payment status...</p>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-black flex items-center justify-center">
            <div className="w-full max-w-md mx-4 p-8 bg-gray-900/50 backdrop-blur-sm border border-cyan-700 rounded-lg shadow-lg text-gray-300 text-center">
                {status === 'success' ? (
                    <>
                        <h1 className="text-2xl font-bold text-green-400 mb-4">Payment Successful!</h1>
                        <p className="mb-6">Your subscription has been activated. Your account details have been updated and you will be returned to the dashboard shortly.</p>
                    </>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold text-yellow-400 mb-4">Payment Canceled</h1>
                        <p className="mb-6">Your payment process was canceled. You have not been charged.</p>
                    </>
                )}
                <Link to="/dashboard" className="text-cyan-400 hover:text-cyan-300 transition">
                    ← Back to Dashboard
                </Link>
            </div>
        </div>
    );
};