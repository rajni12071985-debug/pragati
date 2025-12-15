import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { LogOut, Users, Shield, Plus, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [studentsRes, teamsRes, interestsRes] = await Promise.all([
        axios.get(`${API}/admin/students`),
        axios.get(`${API}/admin/teams`),
        axios.get(`${API}/interests`)
      ]);

      setStudents(studentsRes.data);
      setTeams(teamsRes.data);
      setInterests(interestsRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInterest = async (e) => {
    e.preventDefault();
    if (!newInterest) {
      toast.error('Please enter interest name');
      return;
    }

    try {
      const response = await axios.post(`${API}/interests`, { name: newInterest });
      setInterests([...interests, response.data]);
      setNewInterest('');
      toast.success('Interest added successfully!');
    } catch (error) {
      console.error('Error adding interest:', error);
      toast.error('Failed to add interest');
    }
  };

  const handleDeleteInterest = async (interestId) => {
    try {
      await axios.delete(`${API}/interests/${interestId}`);
      setInterests(interests.filter(i => i.id !== interestId));
      toast.success('Interest deleted successfully!');
    } catch (error) {
      console.error('Error deleting interest:', error);
      toast.error('Failed to delete interest');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[#020617]">
        <div className="absolute top-0 left-0 right-0 h-96 opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.15) 0%, transparent 50%)' }}></div>
      </div>

      <div className="relative z-10">
        <nav className="glass-card border-b border-white/5 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-outfit text-gradient">Admin Portal</h1>
                <p className="text-slate-400 text-sm">Camplink Management</p>
              </div>
            </div>
            <Button
              data-testid="admin-logout-button"
              onClick={onLogout}
              variant="ghost"
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto p-6 py-12">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
          ) : (
            <Tabs defaultValue="students" className="space-y-8">
              <TabsList className="glass-card border border-white/5">
                <TabsTrigger data-testid="students-tab" value="students" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  Students ({students.length})
                </TabsTrigger>
                <TabsTrigger data-testid="teams-tab" value="teams" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  Teams ({teams.length})
                </TabsTrigger>
                <TabsTrigger data-testid="interests-tab" value="interests" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  Interests ({interests.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="students" data-testid="students-content">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold font-outfit text-slate-200">All Students</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((student) => (
                      <div key={student.id} data-testid={`admin-student-${student.id}`} className="glass-card rounded-xl p-6">
                        <p className="text-lg font-bold text-cyan-400 mb-2">{student.name}</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-400">
                            <span className="text-slate-500">Branch:</span> {student.branch}
                          </p>
                          <p className="text-slate-400">
                            <span className="text-slate-500">Year:</span> {student.year}
                          </p>
                          <p className="text-slate-400">
                            <span className="text-slate-500">Teams:</span> {student.teams.length}
                          </p>
                          {student.isLeader && (
                            <span className="inline-block text-xs px-2 py-1 rounded-full bg-pink-500/20 text-pink-400 font-medium mt-2">
                              Team Leader
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="teams" data-testid="teams-content">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold font-outfit text-slate-200">All Teams</h2>
                  <div className="space-y-4">
                    {teams.map((team) => (
                      <div key={team.id} data-testid={`admin-team-${team.id}`} className="glass-card rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-xl font-bold text-cyan-400">{team.name}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Team Leader</p>
                            <p className="text-slate-300 font-medium">{team.leaderName}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-2">Members ({team.members.length})</p>
                            <div className="flex flex-wrap gap-2">
                              {team.members.map((member) => (
                                <span key={member.id} className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400">
                                  {member.name}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-slate-500 text-xs mb-2">Interests</p>
                            <div className="flex flex-wrap gap-2">
                              {team.interests.map((interest) => (
                                <span key={interest} className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="interests" data-testid="interests-content">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold font-outfit text-slate-200 mb-4">Manage Interests</h2>
                    <form onSubmit={handleAddInterest} className="glass-card rounded-xl p-6">
                      <div className="flex gap-4">
                        <Input
                          data-testid="add-interest-input"
                          type="text"
                          placeholder="Enter new interest"
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          className="bg-slate-950/50 border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 h-12 text-slate-200"
                        />
                        <Button
                          data-testid="add-interest-button"
                          type="submit"
                          className="bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 font-bold h-12 px-6"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </form>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {interests.map((interest) => (
                      <div
                        key={interest.id}
                        data-testid={`interest-item-${interest.id}`}
                        className="glass-card rounded-xl p-4 flex items-center justify-between"
                      >
                        <span className="text-slate-200 font-medium">{interest.name}</span>
                        <Button
                          data-testid={`delete-interest-${interest.id}`}
                          onClick={() => handleDeleteInterest(interest.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
