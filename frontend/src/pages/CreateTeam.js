import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, Check } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateTeam = ({ student }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [teamName, setTeamName] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (role === 'leader' && student.interests.length > 0) {
      fetchMatchingStudents();
    }
  }, [role]);

  const fetchMatchingStudents = async () => {
    try {
      const response = await axios.get(`${API}/students`, {
        params: { interests: student.interests.join(',') }
      });
      const filtered = response.data.filter(s => s.id !== student.id);
      setStudents(filtered);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleRoleNext = () => {
    if (!role) {
      toast.error('Please select a role');
      return;
    }
    setStep(2);
  };

  const handleCreateTeam = async () => {
    if (!teamName) {
      toast.error('Please enter a team name');
      return;
    }

    if (role === 'leader' && selectedStudents.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/teams`, {
        name: teamName,
        leaderId: student.id,
        memberIds: role === 'leader' ? selectedStudents : [],
        interests: student.interests
      });

      toast.success('Team created successfully!');
      
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
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
        <Button
          data-testid="back-button"
          onClick={() => step === 1 ? navigate('/dashboard') : setStep(1)}
          variant="ghost"
          className="mb-6 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold font-outfit tracking-tight mb-3">
            <span className="text-gradient">Create Team</span>
          </h1>
          <p className="text-slate-400 text-lg">Build your dream team</p>
        </div>

        {step === 1 && (
          <div className="glass-card rounded-xl p-8 space-y-6">
            <div>
              <Label className="text-slate-300 text-lg mb-4 block">Select Your Role</Label>
              <RadioGroup value={role} onValueChange={setRole} className="space-y-4">
                <div
                  data-testid="role-leader"
                  onClick={() => setRole('leader')}
                  className={`glass-card rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                    role === 'leader' ? 'border-cyan-500/50 bg-cyan-500/10' : 'hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        role === 'leader' ? 'border-cyan-500 bg-cyan-500' : 'border-slate-600'
                      }`}>
                        {role === 'leader' && <div className="w-2 h-2 rounded-full bg-black"></div>}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-200">Leader</p>
                        <p className="text-slate-400 text-sm">Create and manage the team</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  data-testid="role-member"
                  onClick={() => setRole('member')}
                  className={`glass-card rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                    role === 'member' ? 'border-cyan-500/50 bg-cyan-500/10' : 'hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        role === 'member' ? 'border-cyan-500 bg-cyan-500' : 'border-slate-600'
                      }`}>
                        {role === 'member' && <div className="w-2 h-2 rounded-full bg-black"></div>}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-200">Member</p>
                        <p className="text-slate-400 text-sm">Create a team as a regular member</p>
                      </div>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <Button
              data-testid="role-next-button"
              onClick={handleRoleNext}
              disabled={!role}
              className="w-full bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 font-bold h-12"
            >
              Next
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="glass-card rounded-xl p-8 space-y-4">
              <Label htmlFor="teamName" className="text-slate-300 text-lg">Team Name</Label>
              <Input
                id="teamName"
                data-testid="team-name-input"
                type="text"
                placeholder="Enter team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="bg-slate-950/50 border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 h-12 text-slate-200"
              />
            </div>

            {role === 'leader' && (
              <div className="glass-card rounded-xl p-8">
                <Label className="text-slate-300 text-lg mb-4 block">Select Team Members</Label>
                <p className="text-slate-400 text-sm mb-6">Students with matching interests</p>
                {students.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No matching students found</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {students.map((s) => {
                      const isSelected = selectedStudents.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          data-testid={`student-${s.id}`}
                          onClick={() => toggleStudent(s.id)}
                          className={`glass-card rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                            isSelected ? 'border-cyan-500/50 bg-cyan-500/10' : 'hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-slate-200 font-medium">{s.name}</p>
                              <p className="text-slate-500 text-sm">{s.branch} - {s.year}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                              isSelected ? 'border-cyan-500 bg-cyan-500' : 'border-slate-600'
                            }`}>
                              {isSelected && <Check className="w-4 h-4 text-black" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <Button
              data-testid="create-team-button"
              onClick={handleCreateTeam}
              disabled={loading}
              className="w-full bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 font-bold h-12"
            >
              {loading ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTeam;
