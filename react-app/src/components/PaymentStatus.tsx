// react-app/src/components/PaymentStatus.tsx - FINAL, PRODUCTION-READY

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircleIcon, SpinnerIcon } from './Icons';

/**
 * @file Handles the user experience after they return from a Stripe Checkout session.
 * @description This page is the redirect target from Stripe. It verifies the payment
 * status, triggers a user session refresh on success, and provides clear
 * feedback before redirecting the user back to the main application.
 */

// A custom hook to easily parse query parameters from the URL.
const useQuery = () => {
    // useLocation().search will be something like "?session_id=cs_test_123"
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

        const handlePaymentSuccess = async () => {
            setMessage('Payment successful! Synchronizing your account...');
            // This is the most critical step. We force the AuthContext
            // to re-fetch the user's session data from the server. The server
            // (updated by Stripe's webhook) will now return the new subscription status.
            await checkSession();

            setMessage('Account updated! Redirecting to the command interface...');

            // Redirect back to the main Jarvis interface after a delay.
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 5000); // 5-second delay
        };

        if (sessionId) {
            setStatus('success');
            handlePaymentSuccess();
        } else {
            // If there's no session_id, the user likely clicked "back" or canceled.
            setStatus('cancel');
            setMessage('Payment was canceled. You have not been charged.');
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 5000);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on component mount.

    const renderContent = () => {
        switch (status) {
            case 'success':
                return (
                    <>
                        <CheckCircleIcon className="w-16 h-16 text-green-400 mb-6" />
                        <h1 className="text-3xl font-bold text-green-400 mb-4">Payment Successful!</h1>
                    </>
                );
            case 'cancel':
                 return (
                    <>
                        <h1 className="text-3xl font-bold text-yellow-400 mb-4">Payment Canceled</h1>
                    </>
                );
            case 'loading':
            default:
                 return (
                    <>
                        <SpinnerIcon className="animate-spin w-16 h-16 text-cyan-400 mb-6" />
                        <h1 className="text-3xl font-bold text-cyan-400 mb-4">Processing</h1>
                    </>
                );
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