// --- react-app/src/components/PaymentStatus.tsx ---

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircleIcon, SpinnerIcon } from './Icons';

const useQuery = () => {
    return new URLSearchParams(useLocation().search);
};

export const PaymentStatus: React.FC = () => {
    const query = useQuery();
    const navigate = useNavigate();
    const { checkSession } = useAuth();
    const [status, setStatus] = useState<'success' | 'cancel' | 'loading'>('loading');
    const [message, setMessage] = useState('Verifying payment status...');

    useEffect(() => {
        const sessionId = query.get('session_id');
        const redirectDelay = 3000;

        const handlePaymentSuccess = () => {
            setStatus('success');
            setMessage('Payment successful! Synchronizing your account...');
            setTimeout(() => {
                checkSession();
            }, redirectDelay);
        };

        const handlePaymentCancel = () => {
            setStatus('cancel');
            setMessage('Payment was canceled. You have not been charged. Redirecting...');
             setTimeout(() => {
                navigate('/', { replace: true });
            }, redirectDelay);
        };

        if (sessionId) {
            handlePaymentSuccess();
        } else {
            handlePaymentCancel();
        }
    }, [query, navigate, checkSession]);

    const renderContent = () => {
        switch (status) {
            case 'success': return (<> <CheckCircleIcon className="w-16 h-16 text-green-400 mb-6" /> <h1 className="text-3xl font-bold text-green-400 mb-4">Payment Successful!</h1> </>);
            case 'cancel': return (<> <h1 className="text-3xl font-bold text-yellow-400 mb-4">Payment Canceled</h1> </>);
            default: return (<> <SpinnerIcon className="animate-spin w-16 h-16 text-cyan-400 mb-6" /> <h1 className="text-3xl font-bold text-cyan-400 mb-4">Processing</h1> </>);
        }
    };

    return (
        <div className="w-screen h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-lg mx-auto p-8 bg-gray-900/60 backdrop-blur-sm border border-cyan-700/50 rounded-lg shadow-2xl shadow-cyan-500/20 text-gray-300 text-center">
                {renderContent()}
                <p className="text-lg text-gray-400 animate-pulse">{message}</p>
            </div>
        </div>
    );
};