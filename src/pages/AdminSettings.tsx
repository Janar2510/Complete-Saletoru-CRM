mport React from 'react';

export default function AdminSettings() {
  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">Company Admin Settings</h1>
      <p>This is where the admin will be able to manage company-wide preferences, billing, and more.</p>
      <div className="mt-6 p-4 border border-gray-600 rounded-lg">
        <p className="text-sm text-gray-400">🚧 Coming soon: Invite users, manage roles, update billing, and company profile.</p>
      </div>
    </div>
  );
}