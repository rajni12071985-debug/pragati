import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Search } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const JoinTeam = ({ student }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm) {
      toast.error('Please enter a team name');
      return;
    }

    setSearchLoading(true);
    try {
      const response = await axios.get(`${API}/teams`, {
        params: { search: searchTerm }
      });
      setTeams(response.data);
      if (response.data.length === 0) {
        toast.info('No teams found');
      }
    } catch (error) {
      console.error('Error searching teams:', error);
      toast.error('Failed to search teams');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleJoinRequest = async (teamId) => {
    setLoading(true);
    try {
      await axios.post(`${API}/team-requests`, {
        teamId,
        studentId: student.id
      });
      toast.success('Join request sent successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error('Error sending join request:', error);
      toast.error('Failed to send join request');
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
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          className="mb-6 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold font-outfit tracking-tight mb-3">
            <span className="text-gradient">Join Team</span>
          </h1>
          <p className="text-slate-400 text-lg">Find and join existing teams</p>
        </div>

        <div className="glass-card rounded-xl p-8 mb-8">
          <div className="flex gap-4">
            <Input
              data-testid="search-input"
              type="text"
              placeholder="Search team by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-slate-950/50 border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 h-12 text-slate-200"
            />
            <Button
              data-testid="search-button"
              onClick={handleSearch}
              disabled={searchLoading}
              className="bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 font-bold h-12 px-8"
            >
              {searchLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
              ) : (
                <><Search className="w-4 h-4 mr-2" /> Search</>
              )}
            </Button>
          </div>
        </div>

        {teams.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-outfit text-slate-200 mb-4">Search Results</h3>
            {teams.map((team) => (
              <div
                key={team.id}
                data-testid={`team-result-${team.id}`}
                className="glass-card rounded-xl p-6 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold font-outfit text-cyan-400 mb-2">{team.name}</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Team Leader</p>
                        <p className="text-slate-300 font-medium">{team.leaderName}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Members ({team.members.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {team.members.slice(0, 5).map((member) => (
                            <span key={member.id} className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400">
                              {member.name}
                            </span>
                          ))}
                          {team.members.length > 5 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400">
                              +{team.members.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Interests</p>
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
                    data-testid={`join-request-button-${team.id}`}
                    onClick={() => handleJoinRequest(team.id)}
                    disabled={loading}
                    className="ml-4 bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 font-bold"
                  >
                    {loading ? 'Sending...' : 'Send Request'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinTeam;
