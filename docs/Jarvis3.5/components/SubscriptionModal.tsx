import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal } from './common/Modal'; // Assuming Modal is in this path
import { CreditCardIcon, SpinnerIcon } from './Icons'; // Assuming you have a SpinnerIcon

// Define the shape of the plan data we expect from the backend
interface Plan {
    id: string;
    name: string;
    description: string;
    price: number; // in cents
    currency: string;
    interval: string;
}

export const SubscriptionModal = ({ onClose }: { onClose: () => void }) => {
    const { user } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Fetch the subscription plans from our backend when the modal opens
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await fetch('/api/stripe/plans');
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Failed to fetch plans.');
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
    }, []);

    const handleSubscribe = async (priceId: string) => {
        setIsRedirecting(true);
        setError('');
        try {
            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create checkout session.');
            }

            // Redirect the user to the Stripe Checkout page
            window.location.href = data.url;

        } catch (err: any) {
            setError(err.message);
            setIsRedirecting(false);
        }
    };

    // Helper to format price from cents to dollars
    const formatPrice = (amount: number, currency: string) => {
        return (amount / 100).toLocaleString('en-US', {
            style: 'currency',
            currency: currency,
        });
    };

    return (
        <Modal title="Manage Subscription" onClose={onClose}>
            <div className="p-4 text-gray-300">
                {isLoading && (
                    <div className="flex justify-center items-center h-48">
                        <SpinnerIcon className="animate-spin h-8 w-8 text-cyan-400" />
                    </div>
                )}
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                
                {!isLoading && !error && (
                    <div className="space-y-4">
                        <div className="text-center bg-gray-900 p-3 rounded-md">
                            <p className="text-sm text-gray-400">Current Plan</p>
                            <p className="text-xl font-bold text-cyan-400 capitalize">{user?.subscription.tier || 'Free'}</p>
                        </div>

                        {plans.map(plan => (
                            <div key={plan.id} className="bg-gray-800/60 p-4 rounded-lg border border-cyan-700/50 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                                    <p className="text-sm text-gray-400">{plan.description}</p>
                                    <p className="text-lg font-mono text-cyan-400 mt-1">
                                        {formatPrice(plan.price, plan.currency)} / {plan.interval}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={isRedirecting}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-500 flex items-center space-x-2"
                                >
                                    {isRedirecting ? <SpinnerIcon className="animate-spin h-5 w-5" /> : <CreditCardIcon />}
                                    <span>{user?.subscription.tier === plan.name.toLowerCase() ? 'Current Plan' : 'Subscribe'}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};