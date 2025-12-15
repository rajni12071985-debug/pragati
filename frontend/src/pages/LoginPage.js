import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!name || !branch || !year || !rollNumber) {
      toast.error('Please fill all fields');
      return;
    }

    const rollPattern = /^\d{4}BT(CS|AI)\d{3}$/;
    if (!rollPattern.test(rollNumber)) {
      toast.error('Invalid roll number format. Use: YYYYBTCS/AI### (e.g., 2025BTCS282)');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/student`, {
        name,
        branch,
        year,
        rollNumber
      });
      
      onLogin(response.data);
      toast.success('Login successful!');
      navigate('/interests');
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.detail || 'Login failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1764258560295-21e74c3d0d15?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG5lb24lMjBnZW9tZXRyaWMlMjBzaGFwZXMlMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NjU4MDQ1NzN8MA&ixlib=rb-4.1.0&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-[#020617]/90"></div>
      </div>

      <div className="absolute top-0 left-0 right-0 h-96 opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.15) 0%, transparent 50%)' }}></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-5xl lg:text-6xl font-bold font-outfit tracking-tight mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Camplink</span>
            </h1>
            <p className="text-slate-400 text-lg">College Team Management Portal</p>
          </div>

          <form onSubmit={handleLogin} className="glass-card rounded-xl p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="rollNumber" className="text-slate-300">Roll Number</Label>
              <Input
                id="rollNumber"
                data-testid="login-roll-input"
                type="text"
                placeholder="e.g., 2025BTCS282"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                className="bg-slate-950/50 border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 h-12 text-slate-200 font-mono"
              />
              <p className="text-slate-500 text-xs">Format: YYYYBTCS/AI### (e.g., 2025BTCS282 or 2022BTAI456)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Full Name</Label>
              <Input
                id="name"
                data-testid="login-name-input"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-950/50 border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 h-12 text-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch" className="text-slate-300">Branch</Label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger data-testid="login-branch-select" className="bg-slate-950/50 border-white/10 focus:border-cyan-500/50 h-12 text-slate-200">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="CSE" data-testid="branch-cse">CSE</SelectItem>
                  <SelectItem value="AI" data-testid="branch-ai">AI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year" className="text-slate-300">Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger data-testid="login-year-select" className="bg-slate-950/50 border-white/10 focus:border-cyan-500/50 h-12 text-slate-200">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="2021" data-testid="year-2021">2021</SelectItem>
                  <SelectItem value="2022" data-testid="year-2022">2022</SelectItem>
                  <SelectItem value="2023" data-testid="year-2023">2023</SelectItem>
                  <SelectItem value="2024" data-testid="year-2024">2024</SelectItem>
                  <SelectItem value="2025" data-testid="year-2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 font-bold h-12 text-base"
            >
              {loading ? 'Logging in...' : 'Continue'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/admin')}
              className="text-slate-500 hover:text-cyan-400 text-sm transition-colors duration-300"
            >
              Admin Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
