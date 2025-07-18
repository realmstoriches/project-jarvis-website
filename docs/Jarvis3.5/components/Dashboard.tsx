
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SystemStatus, UnlockedUpgrades, VoiceProfile } from '../types';
import { CheckCircleIcon, CogIcon, LoopIcon, ShieldIcon } from './Icons';

interface DashboardProps {
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
    <div className="bg-gray-900/50 p-2 rounded-md">
      <h4 className="text-sm font-mono text-cyan-400 mb-2">{title}</h4>
      {children}
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({
  status,
  upgrades,
  voices,
  selectedVoice,
  onVoiceChange,
  onPatch,
  onToggleContinuous,
  isContinuousConversationOn
}) => {
  const chartData = [
    { name: 'Stability', value: status.systemStability, fill: '#0891b2' },
    { name: 'Load', value: status.cognitiveLoad, fill: '#be185d' },
  ];

  return (
    <div className="w-full h-full bg-black/40 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/10 backdrop-blur-md flex flex-col text-gray-200 p-4 space-y-4">
        <h2 className="text-lg font-mono text-cyan-300 text-center border-b border-cyan-500/30 pb-2">SYSTEM DIAGNOSTICS</h2>
        
        <ChartDataWrapper title="System Integrity">
             <ResponsiveContainer width="100%" height={100}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="name" hide />
                    <Bar dataKey="value" barSize={20} radius={[0, 10, 10, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartDataWrapper>

        <ChartDataWrapper title="Voice Synthesis Module">
            <select
                value={selectedVoice?.voiceURI || ''}
                onChange={(e) => {
                    const voice = voices.find(v => v.voiceURI === e.target.value);
                    if (voice) onVoiceChange(voice);
                }}
                className="w-full bg-gray-800/70 border border-cyan-600 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
                {voices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
            </select>
        </ChartDataWrapper>

        <ChartDataWrapper title="System Upgrades">
            <div className='space-y-2'>
                {upgrades.continuousConversation && (
                    <div className="flex items-center justify-between bg-gray-800/50 p-2 rounded">
                        <div className="flex items-center space-x-2">
                           <LoopIcon />
                           <span className="text-sm">Continuous Convo</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={isContinuousConversationOn} onChange={(e) => onToggleContinuous(e.target.checked)} className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                        </label>
                    </div>
                )}
                 {upgrades.stabilityPatch && (
                    <button onClick={onPatch} className="w-full flex items-center justify-center space-x-2 p-2 rounded bg-yellow-600/50 hover:bg-yellow-500/50 transition-colors">
                       <ShieldIcon />
                       <span className="text-sm">Authorize Stability Patch</span>
                    </button>
                )}
                {!upgrades.continuousConversation && !upgrades.stabilityPatch && (
                    <p className="text-xs text-gray-500 text-center italic">No pending upgrades.</p>
                )}
            </div>
        </ChartDataWrapper>
    </div>
  );
};