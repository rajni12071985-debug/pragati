import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InterestSelection = ({ student, onUpdate }) => {
  const navigate = useNavigate();
  const [interests, setInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState(student.interests || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      const response = await axios.get(`${API}/interests`);
      setInterests(response.data);
    } catch (error) {
      console.error('Error fetching interests:', error);
      toast.error('Failed to load interests');
    }
  };

  const toggleInterest = (interestName) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestName)) {
        return prev.filter(i => i !== interestName);
      } else {
        return [...prev, interestName];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedInterests.length === 0) {
      toast.error('Please select at least one interest');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${API}/students/${student.id}/interests`, {
        studentId: student.id,
        interests: selectedInterests
      });

      const updatedStudent = { ...student, interests: selectedInterests };
      onUpdate(updatedStudent);
      toast.success('Interests saved!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating interests:', error);
      toast.error('Failed to save interests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[#020617]">
        <div className="absolute top-0 left-0 right-0 h-96 opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.15) 0%, transparent 50%)' }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-6 py-12">
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl lg:text-5xl font-bold font-outfit tracking-tight mb-3">
            <span className="text-gradient">Your Interests</span>
          </h1>
          <p className="text-slate-400 text-lg">Select the areas you're passionate about</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {interests.map((interest) => {
            const isSelected = selectedInterests.includes(interest.name);
            return (
              <button
                key={interest.id}
                data-testid={`interest-${interest.name.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => toggleInterest(interest.name)}
                className={`glass-card rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
                  isSelected
                    ? 'border-cyan-500/50 bg-cyan-500/10'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-medium ${
                    isSelected ? 'text-cyan-400' : 'text-slate-300'
                  }`}>
                    {interest.name}
                  </span>
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-500'
                      : 'border-slate-600'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 text-black" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button
            data-testid="continue-button"
            onClick={handleContinue}
            disabled={loading || selectedInterests.length === 0}
            className="bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 font-bold px-8 h-12 text-base"
          >
            {loading ? 'Saving...' : 'Continue to Dashboard'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterestSelection;
