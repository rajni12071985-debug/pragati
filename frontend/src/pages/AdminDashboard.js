import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  LogOut, Users, Shield, Plus, Trash2, 
  TrendingUp, UserCheck, FileText, AlertCircle,
  Search, Edit, X, Check
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [interests, setInterests] = useState([]);
  const [events, setEvents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [newInterest, setNewInterest] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    requiredStudents: '',
    category: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [studentsRes, teamsRes, interestsRes, requestsRes, statsRes] = await Promise.all([
        axios.get(`${API}/admin/students`),
        axios.get(`${API}/admin/teams`),
        axios.get(`${API}/interests`),
        axios.get(`${API}/admin/requests`),
        axios.get(`${API}/admin/stats`)
      ]);

      setStudents(studentsRes.data);
      setTeams(teamsRes.data);
      setInterests(interestsRes.data);
      setRequests(requestsRes.data);
      setStats(statsRes.data);
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
    if (!window.confirm('Are you sure you want to delete this interest?')) return;
    
    try {
      await axios.delete(`${API}/interests/${interestId}`);
      setInterests(interests.filter(i => i.id !== interestId));
      toast.success('Interest deleted successfully!');
    } catch (error) {
      console.error('Error deleting interest:', error);
      toast.error('Failed to delete interest');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student? This will remove them from all teams.')) return;
    
    try {
      await axios.delete(`${API}/admin/students/${studentId}`);
      setStudents(students.filter(s => s.id !== studentId));
      toast.success('Student deleted successfully!');
      fetchAllData();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`${API}/admin/teams/${teamId}`);
      setTeams(teams.filter(t => t.id !== teamId));
      toast.success('Team deleted successfully!');
      fetchAllData();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };

  const handleRemoveMember = async (teamId, memberId) => {
    if (!window.confirm('Remove this member from the team?')) return;
    
    try {
      await axios.post(`${API}/admin/teams/${teamId}/remove-member?member_id=${memberId}`);
      toast.success('Member removed successfully!');
      fetchAllData();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.year.includes(searchTerm)
  );

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
    t.leaderName.toLowerCase().includes(teamSearchTerm.toLowerCase())
  );

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

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
            <Tabs defaultValue="overview" className="space-y-8">
              <TabsList className="glass-card border border-white/5">
                <TabsTrigger data-testid="overview-tab" value="overview" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  Overview
                </TabsTrigger>
                <TabsTrigger data-testid="students-tab" value="students" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  Students ({students.length})
                </TabsTrigger>
                <TabsTrigger data-testid="teams-tab" value="teams" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  Teams ({teams.length})
                </TabsTrigger>
                <TabsTrigger data-testid="requests-tab" value="requests" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  Requests ({pendingRequests.length})
                </TabsTrigger>
                <TabsTrigger data-testid="interests-tab" value="interests" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  Interests ({interests.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" data-testid="overview-content">
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold font-outfit text-slate-200">System Overview</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="glass-card rounded-xl p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <Users className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Total Students</p>
                          <p className="text-3xl font-bold text-cyan-400">{stats.totalStudents || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card rounded-xl p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Total Teams</p>
                          <p className="text-3xl font-bold text-purple-400">{stats.totalTeams || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card rounded-xl p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center">
                          <UserCheck className="w-6 h-6 text-pink-400" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Team Leaders</p>
                          <p className="text-3xl font-bold text-pink-400">{stats.totalLeaders || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card rounded-xl p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">Pending Requests</p>
                          <p className="text-3xl font-bold text-yellow-400">{stats.pendingRequests || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-card rounded-xl p-6">
                      <h3 className="text-xl font-bold font-outfit text-slate-200 mb-4">Branch Distribution</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-slate-400">CSE</span>
                            <span className="text-cyan-400 font-bold">{stats.cseStudents || 0}</span>
                          </div>
                          <div className="w-full bg-slate-800/50 rounded-full h-2">
                            <div 
                              className="bg-cyan-500 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${(stats.cseStudents / stats.totalStudents * 100) || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-slate-400">AI</span>
                            <span className="text-purple-400 font-bold">{stats.aiStudents || 0}</span>
                          </div>
                          <div className="w-full bg-slate-800/50 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${(stats.aiStudents / stats.totalStudents * 100) || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card rounded-xl p-6">
                      <h3 className="text-xl font-bold font-outfit text-slate-200 mb-4">Request Status</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-slate-400">Pending</span>
                          </div>
                          <span className="text-yellow-400 font-bold">{stats.pendingRequests || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-slate-400">Approved</span>
                          </div>
                          <span className="text-green-400 font-bold">{stats.approvedRequests || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-slate-400">Rejected</span>
                          </div>
                          <span className="text-red-400 font-bold">{stats.rejectedRequests || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="students" data-testid="students-content">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold font-outfit text-slate-200">All Students</h2>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        data-testid="student-search"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-950/50 border-white/10 focus:border-cyan-500/50"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map((student) => (
                      <div key={student.id} data-testid={`admin-student-${student.id}`} className="glass-card rounded-xl p-6 group hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start justify-between mb-3">
                          <p className="text-lg font-bold text-cyan-400">{student.name}</p>
                          <Button
                            data-testid={`delete-student-${student.id}`}
                            onClick={() => handleDeleteStudent(student.id)}
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p className="text-slate-400">
                            <span className="text-slate-500">Branch:</span> {student.branch}
                          </p>
                          <p className="text-slate-400">
                            <span className="text-slate-500">Year:</span> {student.year}
                          </p>
                          <p className="text-slate-400">
                            <span className="text-slate-500">Teams:</span> {student.teams.length}
                          </p>
                          <p className="text-slate-400">
                            <span className="text-slate-500">Interests:</span> {student.interests.length}
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
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold font-outfit text-slate-200">All Teams</h2>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        data-testid="team-search"
                        placeholder="Search teams..."
                        value={teamSearchTerm}
                        onChange={(e) => setTeamSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-950/50 border-white/10 focus:border-cyan-500/50"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {filteredTeams.map((team) => (
                      <div key={team.id} data-testid={`admin-team-${team.id}`} className="glass-card rounded-xl p-6 hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-xl font-bold text-cyan-400">{team.name}</h3>
                          <Button
                            data-testid={`delete-team-${team.id}`}
                            onClick={() => handleDeleteTeam(team.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
                                <span key={member.id} className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400 flex items-center gap-1">
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

              <TabsContent value="requests" data-testid="requests-content">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold font-outfit text-slate-200">Team Requests</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-yellow-400 mb-3">Pending ({pendingRequests.length})</h3>
                      {pendingRequests.length === 0 ? (
                        <div className="glass-card rounded-xl p-8 text-center">
                          <p className="text-slate-500">No pending requests</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pendingRequests.map((request) => (
                            <div key={request.id} data-testid={`request-${request.id}`} className="glass-card rounded-xl p-4 flex items-center justify-between">
                              <div>
                                <p className="text-slate-200 font-medium">{request.studentName}</p>
                                <p className="text-slate-500 text-sm">wants to join <span className="text-cyan-400">{request.teamName}</span></p>
                              </div>
                              <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">Pending</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-green-400 mb-3">Approved ({approvedRequests.length})</h3>
                      {approvedRequests.length === 0 ? (
                        <div className="glass-card rounded-xl p-8 text-center">
                          <p className="text-slate-500">No approved requests</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {approvedRequests.map((request) => (
                            <div key={request.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                              <div>
                                <p className="text-slate-200 font-medium">{request.studentName}</p>
                                <p className="text-slate-500 text-sm">joined <span className="text-cyan-400">{request.teamName}</span></p>
                              </div>
                              <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Approved
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-red-400 mb-3">Rejected ({rejectedRequests.length})</h3>
                      {rejectedRequests.length === 0 ? (
                        <div className="glass-card rounded-xl p-8 text-center">
                          <p className="text-slate-500">No rejected requests</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {rejectedRequests.map((request) => (
                            <div key={request.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                              <div>
                                <p className="text-slate-200 font-medium">{request.studentName}</p>
                                <p className="text-slate-500 text-sm">was rejected from <span className="text-cyan-400">{request.teamName}</span></p>
                              </div>
                              <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400 flex items-center gap-1">
                                <X className="w-3 h-3" /> Rejected
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
                        className="glass-card rounded-xl p-4 flex items-center justify-between hover:-translate-y-1 transition-all duration-300"
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
