import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Check, X, Users } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TeamRequests = ({ student }) => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [requests, setRequests] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchTeamsAndRequests();
  }, []);

  const fetchTeamsAndRequests = async () => {
    try {
      const teamsResponse = await axios.get(`${API}/teams/student/${student.id}`);
      const leaderTeams = teamsResponse.data.filter(t => t.leaderId === student.id);
      setTeams(leaderTeams);

      const allRequests = {};
      for (const team of leaderTeams) {
        const requestsResponse = await axios.get(`${API}/team-requests/team/${team.id}`);
        allRequests[team.id] = requestsResponse.data;
      }
      setRequests(allRequests);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action, teamId) => {
    setActionLoading(requestId);
    try {
      await axios.post(`${API}/team-requests/action`, {
        requestId,
        action
      });

      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'}!`);
      
      setRequests(prev => ({
        ...prev,
        [teamId]: prev[teamId].filter(r => r.id !== requestId)
      }));
    } catch (error) {
      console.error('Error handling request:', error);
      toast.error('Failed to process request');
    } finally {
      setActionLoading(null);
    }
  };

  const totalRequests = Object.values(requests).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[#020617]">
        <div className="absolute top-0 left-0 right-0 h-96 opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.15) 0%, transparent 50%)' }}></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-6 py-12">
        <Button
          data-testid="back-button"
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          className="mb-6 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold font-outfit tracking-tight mb-3">
            <span className="text-gradient">Team Requests</span>
          </h1>
          <p className="text-slate-400 text-lg">Manage join requests for your teams</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : teams.length === 0 ? (
          <div data-testid="no-leader-teams-message" className="glass-card rounded-xl p-12 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">You are not a leader of any team</p>
            <p className="text-slate-500 text-sm mt-2">Create a team as leader to manage requests</p>
          </div>
        ) : totalRequests === 0 ? (
          <div data-testid="no-requests-message" className="glass-card rounded-xl p-12 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No pending requests</p>
            <p className="text-slate-500 text-sm mt-2">You'll see join requests here when students want to join your teams</p>
          </div>
        ) : (
          <div className="space-y-8">
            {teams.map((team) => {
              const teamRequests = requests[team.id] || [];
              if (teamRequests.length === 0) return null;

              return (
                <div key={team.id} data-testid={`team-requests-${team.id}`}>
                  <h3 className="text-2xl font-bold font-outfit text-cyan-400 mb-4">{team.name}</h3>
                  <div className="space-y-4">
                    {teamRequests.map((request) => (
                      <div
                        key={request.id}
                        data-testid={`request-${request.id}`}
                        className="glass-card rounded-xl p-6 hover:-translate-y-1 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xl font-bold text-slate-200 mb-1">{request.studentName}</p>
                            <p className="text-slate-500 text-sm">Wants to join your team</p>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              data-testid={`approve-button-${request.id}`}
                              onClick={() => handleAction(request.id, 'approve', team.id)}
                              disabled={actionLoading === request.id}
                              className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] transition-all duration-300"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              data-testid={`reject-button-${request.id}`}
                              onClick={() => handleAction(request.id, 'reject', team.id)}
                              disabled={actionLoading === request.id}
                              className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all duration-300"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamRequests;
