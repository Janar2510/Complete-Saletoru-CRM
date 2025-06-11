import React, { useState } from 'react';
import { Users, Plus, Trash2, Mail } from 'lucide-react';

interface TeamSetupStepProps {
  data: {
    invites: { email: string; role: string }[];
  };
  setData: (data: any) => void;
}

export const TeamSetupStep: React.FC<TeamSetupStepProps> = ({ data, setData }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  
  const roles = [
    { id: 'admin', name: 'Administrator', description: 'Full access to all features' },
    { id: 'manager', name: 'Sales Manager', description: 'Can manage team and view reports' },
    { id: 'user', name: 'Sales Representative', description: 'Standard user access' },
    { id: 'viewer', name: 'Viewer', description: 'Read-only access' },
  ];
  
  const handleAddInvite = () => {
    if (!email.trim() || !validateEmail(email)) return;
    
    setData({
      ...data,
      invites: [...data.invites, { email, role }]
    });
    
    setEmail('');
    setRole('user');
  };
  
  const handleRemoveInvite = (index: number) => {
    const updatedInvites = [...data.invites];
    updatedInvites.splice(index, 1);
    
    setData({
      ...data,
      invites: updatedInvites
    });
  };
  
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Invite Team Members
        </label>
        <div className="flex space-x-2">
          <div className="flex-1">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full pl-10 pr-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-40 px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={handleAddInvite}
            disabled={!email.trim() || !validateEmail(email)}
            className="bg-accent hover:bg-accent/80 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
      
      {data.invites.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Pending Invites</h3>
          <div className="space-y-2">
            {data.invites.map((invite, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-dark-200/50 rounded-lg"
              >
                <div>
                  <p className="text-white">{invite.email}</p>
                  <p className="text-xs text-dark-400">
                    {roles.find(r => r.id === invite.role)?.name || invite.role}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveInvite(index)}
                  className="p-1 hover:bg-dark-300 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-dark-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-dark-200/50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <Users className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium">Role Permissions</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {roles.map((r) => (
                <div key={r.id} className="bg-dark-300/50 p-3 rounded-lg">
                  <p className="font-medium text-white">{r.name}</p>
                  <p className="text-xs text-dark-400 mt-1">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center text-dark-400 text-sm">
        <p>You can always invite more team members later from the Settings page.</p>
      </div>
    </div>
  );
};