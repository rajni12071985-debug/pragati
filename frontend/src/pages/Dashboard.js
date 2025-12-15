import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Users, Plus, Search, List, LogOut } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ student, onLogout }) => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [currentStudent, setCurrentStudent] = useState(student);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
    fetchStudentTeams();
  }, []);

  const fetchStudentData = async () => {
    try {
      const response = await axios.get(`${API}/students/${student.id}`);
      setCurrentStudent(response.data);
      localStorage.setItem('camplink_student', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const fetchStudentTeams = async () => {
    try {
      const response = await axios.get(`${API}/teams/student/${student.id}`);
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[#020617]">
        <div
          className="absolute top-0 left-0 right-0 h-80 opacity-20"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.15) 0%, transparent 50%)' }}
        ></div>
      </div>

      <div className="relative z-10">
        <nav className="glass-card border-b border-white/5 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-outfit text-gradient">Camplink</h1>
              <p className="text-slate-400 text-sm mt-1">
                Welcome, <span className="text-cyan-400 font-medium">{currentStudent.name}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                data-testid="update-interests-button"
                onClick={() => navigate('/interests')}
                variant="ghost"
                className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
              >
                Update Interests
              </Button>
              <Button
                data-testid="logout-button"
                onClick={onLogout}
                variant="ghost"
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto p-6 py-12">
          <div className="mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold font-outfit tracking-tight mb-2">
              <span className="text-slate-200">My Team</span>
            </h2>
            <p className="text-slate-400">Manage your teams and collaborations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <button
              data-testid="create-team-card"
              onClick={() => navigate('/create-team')}
              className="glass-card rounded-xl p-8 hover:-translate-y-1 hover:border-cyan-500/30 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                <Plus className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold font-outfit mb-2 text-slate-200 group-hover:text-cyan-400 transition-colors">
                Create Team
              </h3>
              <p className="text-slate-400 text-sm">Start a new team as leader or member</p>
            </button>

            <button
              data-testid="join-team-card"
              onClick={() => navigate('/join-team')}
              className="glass-card rounded-xl p-8 hover:-translate-y-1 hover:border-purple-500/30 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                <Search className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold font-outfit mb-2 text-slate-200 group-hover:text-purple-400 transition-colors">
                Join Team
              </h3>
              <p className="text-slate-400 text-sm">Search and join existing teams</p>
            </button>

            {student.isLeader && (
              <button
                data-testid="team-requests-card"
                onClick={() => navigate('/team-requests')}
                className="glass-card rounded-xl p-8 hover:-translate-y-1 hover:border-pink-500/30 transition-all duration-300 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4 group-hover:bg-pink-500/20 transition-colors">
                  <List className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold font-outfit mb-2 text-slate-200 group-hover:text-pink-400 transition-colors">
                  Team Requests
                </h3>
                <p className="text-slate-400 text-sm">Manage join requests for your teams</p>
              </button>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-bold font-outfit mb-6 text-slate-200">Your Teams</h3>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
              </div>
            ) : teams.length === 0 ? (
              <div data-testid="no-teams-message" className="glass-card rounded-xl p-12 text-center">
                <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">You haven't joined any teams yet</p>
                <p className="text-slate-500 text-sm mt-2">Create or join a team to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    data-testid={`team-card-${team.id}`}
                    className="glass-card rounded-xl p-6 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-xl font-bold font-outfit text-cyan-400">{team.name}</h4>
                      {team.leaderId === student.id && (
                        <span className="text-xs px-2 py-1 rounded-full bg-pink-500/20 text-pink-400 font-medium">
                          Leader
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Team Leader</p>
                        <p className="text-slate-300 font-medium">{team.leaderName}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-2">Members ({team.members.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {team.members.slice(0, 3).map((member) => (
                            <span key={member.id} className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400">
                              {member.name}
                            </span>
                          ))}
                          {team.members.length > 3 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400">
                              +{team.members.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
