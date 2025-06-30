// /src/pages/Signup.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialStart.getDate() + 14);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
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
        address: companyAddress,
        owner_id: userId,
      })
      .select('id')
      .single();

    if (companyError || !companyData?.id) {
      setError(companyError?.message || 'Company creation failed');
      setLoading(false);
      return;
    }

    const companyId = companyData.id;

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        full_name: fullName,
        role: 'admin',
        is_owner: true,
        company_id: companyId,
        trial_start_date: trialStart.toISOString(),
        trial_end_date: trialEnd.toISOString(),
        is_trial_active: true,
        subscription_status: 'trial',
      })
      .eq('id', userId);

    if (profileError) {
      setError(profileError.message || 'Profile update failed');
      setLoading(false);
      return;
    }

    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0b12] text-white px-4">
      <img src="/logo.svg" alt="SaleToru Logo" className="w-16 h-16 mb-4" />
      <h1 className="text-3xl font-bold mb-1">SaleToru</h1>
      <p className="text-gray-400 mb-8">Smart Sales Management</p>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-xl space-y-4"
      >
        <h2 className="text-xl font-semibold mb-2">Create Account</h2>

        <div className="relative">
          <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="pl-10 input"
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10 input"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10 input"
          />
