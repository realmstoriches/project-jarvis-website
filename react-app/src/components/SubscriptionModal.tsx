// react-app/src/components/SubscriptionModal.tsx - FINAL, PRODUCTION-READY & FULLY CORRECTED

import React, { useState, useEffect } from 'react';
import { Modal } from './common/Modal';
import { CreditCardIcon, SpinnerIcon } from './Icons';
import type { User } from '../types';

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    interval: string;
}

export const SubscriptionModal: React.FC<{ user: User | null; onClose: () => void }> = ({ user, onClose }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isRedirecting, setIsRedirecting] = useState<string | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        const fetchPlans = async () => {
            if (!API_URL) {
                console.error("VITE_API_URL is not set. This is a build configuration issue.");
                setError("Configuration error: The server address is not set.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/stripe/plans`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Failed to fetch subscription plans.');
                }
                const data = await response.json();
                setPlans(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlans();
    }, [API_URL]);

    const handleSubscribe = async (priceId: string) => {
        setIsRedirecting(priceId);
        setError('');
        try {
            const response = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId }),
                credentials: 'include'
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Could not initiate the subscription process.');
            }

            // --- THE DEFINITIVE FIX ---
            // This line tells the TOP-LEVEL BROWSER WINDOW to navigate to the Stripe URL,
            // breaking out of the iframe and satisfying Stripe's security requirements.
            if (window.top) {
                window.top.location.href = data.url;
            } else {
                // Fallback to current window if top is not available
                window.location.href = data.url;
            }

        } catch (err: any) {
            setError(err.message);
            setIsRedirecting(null);
        }
    };

    const formatPrice = (amount: number, currency: string) => {
        return (amount / 100).toLocaleString('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        });
    };

    return (
        <Modal title="Manage Subscription" onClose={onClose}>
            <div className="p-4 sm:p-6 text-gray-300">
                {isLoading && (
                    <div className="flex justify-center items-center h-48">
                        <SpinnerIcon className="animate-spin h-8 w-8 text-cyan-400" />
                    </div>
                )}

                {error && <p className="text-red-400 bg-red-900/50 border border-red-500/50 text-center text-sm rounded-md p-3 mb-4">{error}</p>}

                {!isLoading && !error && (
                    <div className="space-y-4">
                        <div className="text-center bg-gray-900/70 p-3 rounded-md border border-cyan-800/50">
                            <p className="text-sm text-gray-400">Current Plan</p>
                            <p className="text-xl font-bold text-cyan-400 capitalize">
                                {user?.subscription?.tier || 'Free'}
                            </p>
                        </div>

                        {plans.map(plan => {
                            const isCurrentPlan = user?.subscription?.tier === plan.name.toLowerCase();
                            const isRedirectingThisPlan = isRedirecting === plan.id;

                            return (
                                <div key={plan.id} className={`bg-gray-800/60 p-4 rounded-lg border ${isCurrentPlan ? 'border-cyan-500' : 'border-cyan-700/50'}`}>
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                        <div className="mb-4 sm:mb-0">
                                            <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                                            <p className="text-sm text-gray-400">{plan.description}</p>
                                            <p className="text-lg font-mono text-cyan-400 mt-1">
                                                {formatPrice(plan.price, plan.currency)} / {plan.interval}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleSubscribe(plan.id)}
                                            disabled={isCurrentPlan || !!isRedirecting}
                                            className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                        >
                                            {isRedirectingThisPlan ? <SpinnerIcon className="animate-spin h-5 w-5" /> : <CreditCardIcon />}
                                            <span>{isCurrentPlan ? 'Current Plan' : 'Subscribe'}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Modal>
    );
};