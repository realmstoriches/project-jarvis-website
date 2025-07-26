import React, { useState } from 'react';
import { useAuth } from '../src/context/AuthContext';

// Re-usable input component for our forms
const AuthInput = (props: React.ComponentPropsWithoutRef<'input'>) => (
    <input
        {...props}
        className="w-full px-3 py-2 bg-gray-900 border border-cyan-500 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
    />
);

const AuthButton = ({ children }: { children: React.ReactNode }) => (
     <button type="submit" className="w-full mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors font-semibold">
        {children}
    </button>
);

// Login Form Component
const LoginForm = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            login(data.user); // Update auth context on successful login
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <p className="text-red-500 text-center mb-2">{error}</p>}
            <div className="space-y-4">
                <AuthInput type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                <AuthInput type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <AuthButton>Login</AuthButton>
        </form>
    );
};

// Registration Form Component
const RegisterForm = ({ onRegisterSuccess }: { onRegisterSuccess: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            setMessage(data.message); // e.g., "User registered successfully. Please log in."
            onRegisterSuccess();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
             {error && <p className="text-red-500 text-center mb-2">{error}</p>}
             {message && <p className="text-green-400 text-center mb-2">{message}</p>}
            <div className="space-y-4">
                <AuthInput type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                <AuthInput type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <AuthButton>Register</AuthButton>
        </form>
    );
};


// Main AuthScreen Component
export const AuthScreen = () => {
    const [isLoginView, setIsLoginView] = useState(true);

    return (
        <div className="w-screen h-screen bg-black flex items-center justify-center">
            <div className="w-full max-w-md mx-4 p-8 bg-gray-900/50 backdrop-blur-sm border border-cyan-700 rounded-lg shadow-lg text-gray-300">
                <h1 className="text-3xl font-bold text-center text-cyan-400 mb-2">
                    J.A.R.V.I.S. Protocol
                </h1>
                <p className="text-center text-gray-400 mb-6">
                    {isLoginView ? 'Welcome Back' : 'Create an Account'}
                </p>

                {isLoginView ? <LoginForm /> : <RegisterForm onRegisterSuccess={() => setIsLoginView(true)} />}

                <div className="mt-6 text-center">
                    <button onClick={() => setIsLoginView(!isLoginView)} className="text-cyan-400 hover:text-cyan-300 transition">
                        {isLoginView ? 'Need an account? Register' : 'Already have an account? Login'}
                    </button>
                </div>
            </div>
        </div>
    );
};