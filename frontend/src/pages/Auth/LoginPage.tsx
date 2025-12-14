import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { login, googleLogin } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2 } from 'lucide-react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const from = location.state?.from?.pathname || "/";
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await login(username, password);
      setAuth(data.access, data.user);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError('Login failed. Please check your credentials.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google login failed: No credential received');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const data = await googleLogin(credentialResponse.credential);
      setAuth(data.access, data.user);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError('Google login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">QR-EMS 系統登入</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">使用者名稱</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 transition-colors flex justify-center items-center"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : '登入'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          還沒有帳號嗎？{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            註冊新帳號
          </Link>
        </p>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">或使用以下方式登入</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
             <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google 登入失敗')}
                useOneTap
              />
          </div>
        </div>
      </div>
    </div>
  );
};
