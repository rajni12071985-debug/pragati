import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, Users, ThumbsUp, ThumbsDown, Check, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Events = ({ student }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleInterest = async (eventId, interested) => {
    try {
      await axios.post(`${API}/events/interest`, {
        eventId,
        studentId: student.id,
        interested
      });
      
      toast.success(interested ? 'Marked as interested!' : 'Marked as not interested');
      fetchEvents();
    } catch (error) {
      console.error('Error marking interest:', error);
      toast.error('Failed to update interest');
    }
  };

  const getStudentInterest = (event) => {
    if (event.interestedStudents?.includes(student.id)) return 'interested';
    if (event.notInterestedStudents?.includes(student.id)) return 'not-interested';
    return null;
  };

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
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold font-outfit tracking-tight mb-3">
            <span className="text-gradient">College Events</span>
          </h1>
          <p className="text-slate-400 text-lg">Express your interest in upcoming events</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No events available right now</p>
            <p className="text-slate-500 text-sm mt-2">Check back later for upcoming college events</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {events.map((event) => {
              const studentInterest = getStudentInterest(event);
              const interestedCount = event.interestedStudents?.length || 0;
              const slotsLeft = event.requiredStudents - interestedCount;

              return (
                <div
                  key={event.id}
                  data-testid={`event-card-${event.id}`}
                  className="glass-card rounded-xl p-8 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold font-outfit text-cyan-400 mb-3">{event.name}</h2>
                      <p className="text-slate-300 text-lg mb-4">{event.description}</p>
                      
                      <div className="flex flex-wrap gap-3 mb-4">
                        <div className="px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                          <p className="text-slate-500 text-xs mb-1">Category</p>
                          <p className="text-purple-400 font-bold">{event.category}</p>
                        </div>
                        <div className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                          <p className="text-slate-500 text-xs mb-1">Required Students</p>
                          <p className="text-cyan-400 font-bold">{event.requiredStudents}</p>
                        </div>
                        <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                          <p className="text-slate-500 text-xs mb-1">Interested So Far</p>
                          <p className="text-green-400 font-bold">{interestedCount}</p>
                        </div>
                        {slotsLeft > 0 ? (
                          <div className="px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                            <p className="text-slate-500 text-xs mb-1">Slots Available</p>
                            <p className="text-yellow-400 font-bold">{slotsLeft}</p>
                          </div>
                        ) : (
                          <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                            <p className="text-red-400 font-bold text-sm">Slots Full</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {studentInterest === 'interested' ? (
                      <div className="flex items-center gap-4 w-full">
                        <div className="flex-1 glass-card rounded-lg px-4 py-3 bg-green-500/10 border border-green-500/30">
                          <div className="flex items-center justify-center gap-2">
                            <Check className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 font-bold">You're Interested!</span>
                          </div>
                        </div>
                        <Button
                          data-testid={`not-interested-${event.id}`}
                          onClick={() => handleInterest(event.id, false)}
                          variant="ghost"
                          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove Interest
                        </Button>
                      </div>
                    ) : studentInterest === 'not-interested' ? (
                      <div className="flex items-center gap-4 w-full">
                        <div className="flex-1 glass-card rounded-lg px-4 py-3 bg-red-500/10 border border-red-500/30">
                          <div className="flex items-center justify-center gap-2">
                            <X className="w-5 h-5 text-red-400" />
                            <span className="text-red-400 font-bold">Not Interested</span>
                          </div>
                        </div>
                        <Button
                          data-testid={`interested-${event.id}`}
                          onClick={() => handleInterest(event.id, true)}
                          className="bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 font-bold"
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          I'm Interested
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          data-testid={`interested-${event.id}`}
                          onClick={() => handleInterest(event.id, true)}
                          className="flex-1 bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 font-bold h-14 text-base"
                        >
                          <ThumbsUp className="w-5 h-5 mr-2" />
                          I'm Interested
                        </Button>
                        <Button
                          data-testid={`not-interested-${event.id}`}
                          onClick={() => handleInterest(event.id, false)}
                          variant="ghost"
                          className="flex-1 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 border border-white/10 h-14 text-base"
                        >
                          <ThumbsDown className="w-5 h-5 mr-2" />
                          Not Interested
                        </Button>
                      </>
                    )}
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

export default Events;
