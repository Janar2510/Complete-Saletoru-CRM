import React, { useState, useEffect } from 'react';
import { Mail, Lock, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useDevMode } from '../../contexts/DevModeContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, loading } = useAuth();
  const { isDevMode, toggleDevMode } = useDevMode();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      const from = (location.state as any)?.from || '/';
      navigate(from);
    }
  }, [user, loading, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured) {
      setError('Application is not properly configured. Please contact your administrator.');
      return;
    }

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await signIn(email, password);
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message?.includes('Supabase is not configured')) {
        setError('Application is not properly configured. Please contact your administrator.');
      } else if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (error.message?.includes('Failed to fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError('An error occurred during login. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableDevMode = () => {
    toggleDevMode();
    navigate('/');
  };

  // If still checking auth status, show loading
  if (loading && !isDevMode) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show configuration warning if Supabase is not configured
  if (!isSupabaseConfigured && !isDevMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4">
              <img src="https://i.imgur.com/Zylpdjy.png" alt="SaleToru Logo" className="w-full h-full" />
            </div>
            <h1 className="text-3xl font-bold text-white">SaleToru</h1>
            <p className="text-dark-400">Smart Sales Management</p>
          </div>

          <Card className="p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-4">Configuration Required</h2>
              <p className="text-dark-400 mb-6">
                This application needs to be connected to Supabase to function properly.
              </p>
              <div className="bg-dark-200 border border-dark-300 rounded-lg p-4 text-left">
                <p className="text-sm text-dark-400 mb-2">To get started:</p>
                <ol className="text-sm text-dark-400 space-y-1 list-decimal list-inside">
                  <li>Click "Connect to Supabase" in the top right corner</li>
                  <li>Follow the setup instructions</li>
                  <li>Return here to sign in</li>
                </ol>
              </div>
              
              <div className="mt-6 pt-6 border-t border-dark-200">
                <button
                  onClick={handleEnableDevMode}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Enable Developer Mode
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4">
            <img src="https://i.imgur.com/Zylpdjy.png" alt="SaleToru Logo" className="w-full h-full" />
          </div>
          <h1 className="text-3xl font-bold text-white">SaleToru</h1>
          <p className="text-dark-400">Smart Sales Management</p>
        </div>

        <Card className="p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-white">Password</label>
                <Link to="/forgot-password" className="text-xs text-accent hover:text-accent/80">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent hover:bg-accent/80 disabled:opacity-70 text-white py-2 rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-accent hover:text-accent/80">
                Sign Up
              </Link>
            </p>
          </div>
          
          <div className="mt-6 pt-6 border-t border-dark-200 text-center">
            <button
              onClick={handleEnableDevMode}
              className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
            >
              {isDevMode ? 'Disable' : 'Enable'} Developer Mode
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;