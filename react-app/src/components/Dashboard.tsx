// react-app/src/components/Dashboard.tsx - FINAL, PRODUCTION-READY & FULLY CORRECTED

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { SubscriptionModal } from './SubscriptionModal';
import { LoopIcon, ShieldIcon, SubscriptionIcon, LoginIcon } from './Icons';
import type { SystemStatus, UnlockedUpgrades, VoiceProfile, User } from '../types';

interface DashboardProps {
  user: User | null;
  isAuthenticated: boolean;
  onNavigateToLogin: () => void;
  status: SystemStatus;
  upgrades: UnlockedUpgrades;
  voices: VoiceProfile[];
  selectedVoice: VoiceProfile | null;
  onVoiceChange: (voice: VoiceProfile) => void;
  onPatch: () => void;
  onToggleContinuous: (value: boolean) => void;
  isContinuousConversationOn: boolean;
}

const ChartDataWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-900/50 p-3 rounded-md border border-cyan-500/10">
      <h4 className="text-sm font-mono text-cyan-400 mb-2">{title}</h4>
      {children}
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({
  user, isAuthenticated, onNavigateToLogin, status, upgrades, voices, selectedVoice, onVoiceChange, onPatch, onToggleContinuous, isContinuousConversationOn
}) => {
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  const chartData = [
    { name: 'Stability', value: status.systemStability, fill: '#0891b2' },
    { name: 'Load', value: status.cognitiveLoad, fill: '#be185d' },
  ];

  const handleManageClick = () => {
    if (isAuthenticated) {
      setIsSubModalOpen(true);
    } else {
      onNavigateToLogin();
    }
  };

  return (
    <>
      <div className="w-full h-full bg-black/40 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/10 backdrop-blur-md flex flex-col text-gray-200 p-4 space-y-4 overflow-y-auto">
        <h2 className="text-lg font-mono text-cyan-300 text-center border-b border-cyan-500/30 pb-2">SYSTEM DIAGNOSTICS</h2>
        <ChartDataWrapper title="System Integrity">
            <ResponsiveContainer width="100%" height={80}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 100]} hide={true} />
                    <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize="12px" tickLine={false} axisLine={false} width={60} />
                    <Bar dataKey="value" barSize={12} radius={[0, 10, 10, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartDataWrapper>
        <ChartDataWrapper title="Account Status">
            <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded">
                <div>
                    <p className="text-md capitalize font-semibold">{user?.subscription?.tier || 'Free'} Plan</p>
                    <p className="text-xs text-gray-400 capitalize">Status: {user?.subscription?.status || 'None'}</p>
                </div>
                <button onClick={handleManageClick} className="flex items-center space-x-2 p-2 rounded bg-cyan-600/50 hover:bg-cyan-500/50 transition-colors text-sm font-semibold">
                  {isAuthenticated ? <SubscriptionIcon /> : <LoginIcon />}
                  <span>{isAuthenticated ? 'Manage' : 'Login'}</span>
                </button>
            </div>
        </ChartDataWrapper>
        <ChartDataWrapper title="Voice Synthesis Module">
            <select
                id="voice-select"
                value={selectedVoice?.voiceURI || ''}
                onChange={(e) => {
                    const voice = voices.find(v => v.voiceURI === e.target.value);
                    if (voice) {
                        onVoiceChange(voice);
                    }
                }}
                className="w-full bg-gray-800/70 border border-cyan-600 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label="Choose a voice"
            >
                {voices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
            </select>
        </ChartDataWrapper>
        <ChartDataWrapper title="System Upgrades">
            <div className='space-y-2'>
                {upgrades.continuousConversation && (
                    <label className="flex items-center justify-between bg-gray-800/50 p-2 rounded cursor-pointer">
                        <div className="flex items-center space-x-2"><LoopIcon /><span className="text-sm">Continuous Convo</span></div>
                        <div className="relative inline-flex items-center">
                          <input type="checkbox" checked={isContinuousConversationOn} onChange={(e) => onToggleContinuous(e.target.checked)} className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                        </div>
                    </label>
                )}
                {upgrades.stabilityPatch && (
                    <button onClick={onPatch} className="w-full flex items-center justify-center space-x-2 p-2 rounded bg-yellow-600/50 hover:bg-yellow-500/50 transition-colors text-sm">
                      <ShieldIcon /><span>Authorize Stability Patch</span>
                    </button>
                )}
                {!upgrades.continuousConversation && !upgrades.stabilityPatch && (
                    <p className="text-xs text-gray-500 text-center italic py-2">No pending upgrades.</p>
                )}
            </div>
        </ChartDataWrapper>
      </div>
      {isAuthenticated && isSubModalOpen && (
        <SubscriptionModal user={user} onClose={() => setIsSubModalOpen(false)} />
      )}
    </>
  );
};