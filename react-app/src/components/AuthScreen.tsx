// react-app/src/components/AuthScreen.tsx - FINAL, PRODUCTION-READY

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SpinnerIcon } from './Icons';

/**
 * @file Provides the user interface for both login and registration.
 * @description This component serves as the central hub for user authentication.
 * It dynamically switches between login and registration forms and uses the
 * AuthContext to update the application state upon successful authentication.
 */


// --- Re-usable Form Components ---

const AuthInput: React.FC<React.ComponentPropsWithoutRef<'input'>> = (props) => (
    <input
        {...props}
        className="w-full px-4 py-3 bg-gray-900/70 border border-cyan-600/50 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-shadow"
    />
);

const AuthButton: React.FC<{ isLoading: boolean; children: React.ReactNode; }> = ({ isLoading, children }) => (
     <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-4 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors font-semibold text-white flex items-center justify-center disabled:bg-cyan-800/50 disabled:cursor-not-allowed"
    >
        {isLoading ? <SpinnerIcon className="animate-spin h-6 w-6" /> : children}
    </button>
);


// --- Login Form Logic ---

const LoginForm: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed. Please check your credentials.');
            }
            // On success, update the global state via AuthContext and redirect.
            login(data.user);
            navigate('/', { replace: true });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <p className="text-red-400 bg-red-900/50 border border-red-500/50 text-center text-sm rounded-md p-2 mb-4">{error}</p>}
            <div className="space-y-4">
                <AuthInput type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                <AuthInput type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <AuthButton isLoading={isLoading}>Login</AuthButton>
        </form>
    );
};


// --- Registration Form Logic ---

const RegisterForm: React.FC<{ onRegisterSuccess: () => void }> = ({ onRegisterSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);
        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed. Please try again.');
            }
            setMessage(data.message || "User registered successfully. Please log in.");
            // On success, notify the parent component to switch views.
            onRegisterSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
             {error && <p className="text-red-400 bg-red-900/50 border border-red-500/50 text-center text-sm rounded-md p-2 mb-4">{error}</p>}
             {message && <p className="text-green-400 bg-green-900/50 border border-green-500/50 text-center text-sm rounded-md p-2 mb-4">{message}</p>}
            <div className="space-y-4">
                <AuthInput type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                <AuthInput type="password" placeholder="Password (min 8 characters)" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <AuthButton isLoading={isLoading}>Register</AuthButton>
        </form>
    );
};


// --- Main AuthScreen Component ---

export const AuthScreen: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);

    return (
        <div className="w-screen h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto p-8 bg-gray-900/60 backdrop-blur-sm border border-cyan-700/50 rounded-lg shadow-2xl shadow-cyan-500/20 text-gray-300">
                <h1 className="text-4xl font-mono font-bold text-center text-cyan-400 mb-2">
                    J.A.R.V.I.S. Protocol
                </h1>
                <p className="text-center text-gray-400 mb-8">
                    {isLoginView ? 'Authenticate to Access Core Systems' : 'Create a New Operator Profile'}
                </p>

                {isLoginView ? <LoginForm /> : <RegisterForm onRegisterSuccess={() => setIsLoginView(true)} />}

                <div className="mt-8 text-center">
                    <button
                        onClick={() => setIsLoginView(!isLoginView)}
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        {isLoginView ? 'Need an account? Register Profile' : 'Already have a profile? Authenticate'}
                    </button>
                </div>
            </div>
        </div>
    );
};