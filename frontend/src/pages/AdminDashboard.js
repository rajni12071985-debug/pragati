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
  const [competitions, setCompetitions] = useState([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateCompetition, setShowCreateCompetition] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [interestCounts, setInterestCounts] = useState({});
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: ''
  });
  const [newCompetition, setNewCompetition] = useState({
    name: '',
    description: '',
    skillsRequired: '',
    rules: '',
    eventDate: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [studentsRes, teamsRes, interestsRes, requestsRes, statsRes, eventsRes] = await Promise.all([
        axios.get(`${API}/admin/students`),
        axios.get(`${API}/admin/teams`),
        axios.get(`${API}/interests`),
        axios.get(`${API}/admin/requests`),
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/events`)
      ]);

      setStudents(studentsRes.data);
      setTeams(teamsRes.data);
      setInterests(interestsRes.data);
      setRequests(requestsRes.data);
      setStats(statsRes.data);
      setEvents(eventsRes.data);
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

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.description || !newEvent.requiredStudents || !newEvent.category) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const response = await axios.post(`${API}/events`, {
        name: newEvent.name,
        description: newEvent.description,
        requiredStudents: parseInt(newEvent.requiredStudents),
        category: newEvent.category
      });
      setEvents([...events, response.data]);
      setNewEvent({ name: '', description: '', requiredStudents: '', category: '' });
      setShowCreateEvent(false);
      toast.success('Event created successfully!');
      fetchAllData();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await axios.delete(`${API}/events/${eventId}`);
      setEvents(events.filter(e => e.id !== eventId));
      toast.success('Event deleted successfully!');
      fetchAllData();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const viewInterestedStudents = async (eventId, eventName) => {
    try {
      const response = await axios.get(`${API}/events/${eventId}/interested`);
      const data = response.data;
      
      const studentList = data.students.map(s => `${s.name} (${s.branch} - ${s.year})`).join('\n');
      alert(`Event: ${eventName}\n\nRequired: ${data.requiredStudents} students\nInterested: ${data.interestedCount} students\n\n${studentList || 'No students interested yet'}`);
    } catch (error) {
      console.error('Error fetching interested students:', error);
      toast.error('Failed to load interested students');
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

  const handleApproveTeam = async (teamId) => {
    try {
      await axios.post(`${API}/admin/teams/${teamId}/approve`);
      toast.success('Team approved successfully!');
      fetchAllData();
    } catch (error) {
      console.error('Error approving team:', error);
      toast.error('Failed to approve team');
    }
  };

  const handleRejectTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to reject this team? Students will be removed from it.')) return;
    
    try {
      await axios.post(`${API}/admin/teams/${teamId}/reject`);
      toast.success('Team rejected successfully!');
      fetchAllData();
    } catch (error) {
      console.error('Error rejecting team:', error);
      toast.error('Failed to reject team');
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

  const pendingTeams = teams.filter(t => t.status === 'pending');
  const approvedTeams = teams.filter(t => t.status === 'approved');
  const rejectedTeams = teams.filter(t => t.status === 'rejected');

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
                <TabsTrigger data-testid="events-tab" value="events" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  Events ({events.length})
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
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold font-outfit text-slate-200">Team Management</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-yellow-400 mb-3">Pending Approval ({pendingTeams.length})</h3>
                      {pendingTeams.length === 0 ? (
                        <div className="glass-card rounded-xl p-8 text-center">
                          <p className="text-slate-500">No pending teams</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {pendingTeams.map((team) => (
                            <div key={team.id} data-testid={`pending-team-${team.id}`} className="glass-card rounded-xl p-6 border-yellow-500/30">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-cyan-400">{team.name}</h3>
                                    <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs border border-yellow-500/30">
                                      Pending
                                    </span>
                                  </div>
                                  <p className="text-slate-400 text-sm mb-3">Leader: {team.leaderName}</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <div className="flex gap-2 ml-4">
                                  <Button
                                    data-testid={`approve-team-${team.id}`}
                                    onClick={() => handleApproveTeam(team.id)}
                                    className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    data-testid={`reject-team-${team.id}`}
                                    onClick={() => handleRejectTeam(team.id)}
                                    variant="ghost"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-green-400 mb-3">Approved Teams ({approvedTeams.length})</h3>
                      {approvedTeams.length === 0 ? (
                        <div className="glass-card rounded-xl p-8 text-center">
                          <p className="text-slate-500">No approved teams</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {approvedTeams.map((team) => (
                            <div key={team.id} data-testid={`approved-team-${team.id}`} className="glass-card rounded-xl p-6 border-green-500/20">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-cyan-400">{team.name}</h3>
                                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs border border-green-500/30 flex items-center gap-1">
                                      <Check className="w-3 h-3" /> Approved
                                    </span>
                                  </div>
                                  <p className="text-slate-400 text-sm mb-3">Leader: {team.leaderName}</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {rejectedTeams.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-red-400 mb-3">Rejected Teams ({rejectedTeams.length})</h3>
                        <div className="space-y-3">
                          {rejectedTeams.map((team) => (
                            <div key={team.id} className="glass-card rounded-xl p-4 border-red-500/20">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-slate-200 font-medium">{team.name}</p>
                                  <p className="text-slate-500 text-sm">Leader: {team.leaderName}</p>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs border border-red-500/30 flex items-center gap-1">
                                  <X className="w-3 h-3" /> Rejected
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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

              <TabsContent value="events" data-testid="events-content">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold font-outfit text-slate-200">Events Management</h2>
                    <Button
                      data-testid="create-event-button"
                      onClick={() => setShowCreateEvent(!showCreateEvent)}
                      className="bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 font-bold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  </div>

                  {showCreateEvent && (
                    <form onSubmit={handleCreateEvent} className="glass-card rounded-xl p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-slate-300 text-sm mb-2 block">Event Name</label>
                          <Input
                            data-testid="event-name-input"
                            placeholder="e.g., Annual Dance Competition"
                            value={newEvent.name}
                            onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                            className="bg-slate-950/50 border-white/10 focus:border-cyan-500/50 text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-slate-300 text-sm mb-2 block">Category</label>
                          <Input
                            data-testid="event-category-input"
                            placeholder="e.g., Dance, Singing, Sports"
                            value={newEvent.category}
                            onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
                            className="bg-slate-950/50 border-white/10 focus:border-cyan-500/50 text-slate-200"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-300 text-sm mb-2 block">Description</label>
                        <Input
                          data-testid="event-description-input"
                          placeholder="Event details..."
                          value={newEvent.description}
                          onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                          className="bg-slate-950/50 border-white/10 focus:border-cyan-500/50 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 text-sm mb-2 block">Required Students</label>
                        <Input
                          data-testid="event-required-input"
                          type="number"
                          placeholder="e.g., 5"
                          value={newEvent.requiredStudents}
                          onChange={(e) => setNewEvent({...newEvent, requiredStudents: e.target.value})}
                          className="bg-slate-950/50 border-white/10 focus:border-cyan-500/50 text-slate-200"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          data-testid="submit-event-button"
                          type="submit"
                          className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold"
                        >
                          Create Event
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setShowCreateEvent(false)}
                          variant="ghost"
                          className="text-slate-400 hover:text-slate-300"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-4">
                    {events.length === 0 ? (
                      <div className="glass-card rounded-xl p-12 text-center">
                        <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No events created yet</p>
                      </div>
                    ) : (
                      events.map((event) => (
                        <div
                          key={event.id}
                          data-testid={`event-${event.id}`}
                          className="glass-card rounded-xl p-6 hover:-translate-y-1 transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-cyan-400 mb-2">{event.name}</h3>
                              <p className="text-slate-400 text-sm mb-3">{event.description}</p>
                              <div className="flex flex-wrap gap-3">
                                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm border border-purple-500/30">
                                  {event.category}
                                </span>
                                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm border border-cyan-500/30">
                                  Required: {event.requiredStudents} students
                                </span>
                                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm border border-green-500/30">
                                  Interested: {event.interestedStudents?.length || 0}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                data-testid={`view-interested-${event.id}`}
                                onClick={() => viewInterestedStudents(event.id, event.name)}
                                className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                              >
                                <Users className="w-4 h-4 mr-2" />
                                View Interested
                              </Button>
                              <Button
                                data-testid={`delete-event-${event.id}`}
                                onClick={() => handleDeleteEvent(event.id)}
                                variant="ghost"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
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
