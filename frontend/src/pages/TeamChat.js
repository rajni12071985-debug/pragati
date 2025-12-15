import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Send, MessageCircle, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TeamChat = ({ student }) => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTeamAndMessages();
    
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [teamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTeamAndMessages = async () => {
    try {
      const [teamsResponse, messagesResponse] = await Promise.all([
        axios.get(`${API}/teams`),
        axios.get(`${API}/teams/${teamId}/messages`)
      ]);
      
      const foundTeam = teamsResponse.data.find(t => t.id === teamId);
      if (!foundTeam) {
        toast.error('Team not found');
        navigate('/dashboard');
        return;
      }
      
      setTeam(foundTeam);
      setMessages(messagesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load team chat');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/teams/${teamId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    try {
      await axios.post(`${API}/teams/${teamId}/messages`, {
        teamId,
        studentId: student.id,
        studentName: student.name,
        message: newMessage.trim()
      });
      
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    
    try {
      await axios.delete(`${API}/teams/${teamId}/messages/${messageId}`);
      toast.success('Message deleted');
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
  };

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

  const isMember = team.memberIds?.includes(student.id) || team.leaderId === student.id;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[#020617]">
        <div className="absolute top-0 left-0 right-0 h-96 opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.15) 0%, transparent 50%)' }}></div>
      </div>

      <div className="relative z-10 flex flex-col h-screen">
        <div className="glass-card border-b border-white/5 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                data-testid="back-button"
                onClick={() => navigate(`/team/${teamId}`)}
                variant="ghost"
                className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold font-outfit text-cyan-400">{team.name}</h1>
                <p className="text-slate-400 text-sm">{team.members?.length || 0} members</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">Team Chat</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="max-w-5xl mx-auto h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No messages yet</p>
                    <p className="text-slate-500 text-sm mt-2">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = msg.studentId === student.id;
                  return (
                    <div
                      key={msg.id}
                      data-testid={`message-${msg.id}`}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!isOwnMessage && (
                          <p className="text-xs text-slate-500 mb-1 px-2">{msg.studentName}</p>
                        )}
                        <div
                          className={`glass-card rounded-2xl px-4 py-3 ${
                            isOwnMessage
                              ? 'bg-cyan-500/20 border-cyan-500/30 rounded-br-sm'
                              : 'bg-slate-800/50 border-white/10 rounded-bl-sm'
                          } group relative`}
                        >
                          <p className="text-slate-200 break-words">{msg.message}</p>
                          <div className="flex items-center justify-between gap-3 mt-2">
                            <p className="text-xs text-slate-500">{formatTime(msg.createdAt)}</p>
                            {isOwnMessage && (
                              <Button
                                data-testid={`delete-message-${msg.id}`}
                                onClick={() => handleDeleteMessage(msg.id)}
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {isMember && (
              <div className="glass-card border-t border-white/5 p-6">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <Input
                    data-testid="message-input"
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                    className="flex-1 bg-slate-950/50 border-white/10 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 h-12 text-slate-200"
                  />
                  <Button
                    data-testid="send-button"
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 font-bold h-12 px-6"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamChat;
