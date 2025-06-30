import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [address, setAddress] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialStart.getDate() + 14);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: 'admin',
          is_owner: true,
          trial_start_date: trialStart.toISOString(),
          trial_end_date: trialEnd.toISOString(),
          is_trial_active: true,
          subscription_status: 'trial',
        },
      },
    });

    if (authError || !authData?.user) {
      setError(authError?.message || 'Signup failed');
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        vat_number: vatNumber,
        address,
      })
      .select('id')
      .single();

    if (companyError || !companyData?.id) {
      setError(companyError?.message || 'Company creation failed');
      setLoading(false);
      return;
    }

    const companyId = companyData.id;

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        role: 'admin',
        is_owner: true,
        company_id: companyId,
        trial_start_date: trialStart.toISOString(),
        trial_end_date: trialEnd.toISOString(),
        is_trial_active: true,
        subscription_status: 'trial',
      })
      .eq('id', userId);

    if (updateError) {
      setError(updateError.message || 'Failed to link user');
      setLoading(false);
      return;
    }

    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0f1c] to-[#101022] text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#1a1a2e] p-8 rounded-lg shadow-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Create Your Account</h2>

        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="input"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="input"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input"
        />

        <hr className="border-gray-600" />

        <input
          type="text"
          placeholder="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          className="input"
        />
        <input
          type="text"
          placeholder="VAT Number"
          value={vatNumber}
          onChange={(e) => setVatNumber(e.target.value)}
          className="input"
        />
        <input
          type="text"
          placeholder="Company Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="input"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-semibold py-2 rounded-lg transition"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <p className="text-sm text-center text-gray-400">
          Already have an account? <Link to="/login" className="text-blue-400">Login</Link>
        </p>
      </form>
    </div>
  );
}
