import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Users, Trash2, Crown, MessageCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TeamDetails = ({ student }) => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    fetchTeamDetails();
  }, [teamId]);

  const fetchTeamDetails = async () => {
    try {
      const response = await axios.get(`${API}/teams`);
      const foundTeam = response.data.find(t => t.id === teamId);
      
      if (!foundTeam) {
        toast.error('Team not found');
        navigate('/dashboard');
        return;
      }
      
      setTeam(foundTeam);
    } catch (error) {
      console.error('Error fetching team details:', error);
      toast.error('Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from the team?`)) return;
    
    setRemoving(memberId);
    try {
      await axios.post(`${API}/admin/teams/${teamId}/remove-member?member_id=${memberId}`);
      toast.success('Member removed successfully!');
      fetchTeamDetails();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    } finally {
      setRemoving(null);
    }
  };

  const isLeader = team && team.leaderId === student.id;

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[#020617] flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[#020617]">
        <div className="absolute top-0 left-0 right-0 h-96 opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.15) 0%, transparent 50%)' }}></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-6 py-12">
        <Button
          data-testid="back-to-dashboard"
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          className="mb-6 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="glass-card rounded-xl p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold font-outfit text-cyan-400 mb-2">{team.name}</h1>
              <p className="text-slate-400">Team Details & Management</p>
            </div>
            {isLeader && (
              <span className="px-4 py-2 rounded-full bg-pink-500/20 text-pink-400 font-medium flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Team Leader
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="glass-card rounded-lg p-4">
              <p className="text-slate-500 text-sm mb-2">Team Leader</p>
              <p className="text-slate-200 text-lg font-medium flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-400" />
                {team.leaderName}
              </p>
            </div>

            <div className="glass-card rounded-lg p-4">
              <p className="text-slate-500 text-sm mb-2">Total Members</p>
              <p className="text-slate-200 text-lg font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                {team.members.length}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-slate-500 text-sm mb-3">Team Interests</p>
            <div className="flex flex-wrap gap-2">
              {team.interests.map((interest) => (
                <span key={interest} className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-sm">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-8">
          <h2 className="text-2xl font-bold font-outfit text-slate-200 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            Team Members ({team.members.length})
          </h2>

          {team.members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No members in this team yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  data-testid={`member-${member.id}`}
                  className="glass-card rounded-lg p-4 flex items-center justify-between hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <span className="text-cyan-400 font-bold text-lg">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium text-lg">{member.name}</p>
                      <p className="text-slate-500 text-sm">Team Member</p>
                    </div>
                  </div>

                  {isLeader && (
                    <Button
                      data-testid={`remove-member-${member.id}`}
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      disabled={removing === member.id}
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      {removing === member.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-400"></div>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamDetails;
