import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Lock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminLogin = ({ onLogin }) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!password) {
      toast.error('Please enter password');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/admin/login`, { password });
      onLogin();
      toast.success('Admin login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('Invalid password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[#020617]">
        <div className="absolute inset-0 bg-[#020617]/90"></div>
      </div>

      <div className="absolute top-0 left-0 right-0 h-96 opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.15) 0%, transparent 50%)' }}></div>

      <div className="relative z-10">
        <Button
          data-testid="back-to-login-button"
          onClick={() => navigate('/')}
          variant="ghost"
          className="m-6 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Button>

        <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-6">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-pink-400" />
              </div>
              <h1 className="text-4xl font-bold font-outfit tracking-tight mb-2">
                <span className="text-gradient">Admin Portal</span>
              </h1>
              <p className="text-slate-400">Protected Area - Authorization Required</p>
            </div>

            <form onSubmit={handleLogin} className="glass-card rounded-xl p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Admin Password</Label>
                <Input
                  id="password"
                  data-testid="admin-password-input"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950/50 border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 h-12 text-slate-200"
                />
              </div>

              <Button
                data-testid="admin-login-button"
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 font-bold h-12"
              >
                {loading ? 'Verifying...' : 'Access Admin Portal'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
