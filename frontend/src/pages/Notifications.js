import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Bell, Calendar, Trophy, CheckCircle, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Notifications = ({ student }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications/${student.id}`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await axios.post(`${API}/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleViewRelated = async (notification) => {
    await handleMarkRead(notification.id);
    
    if (notification.type === 'event') {
      navigate('/events');
    } else if (notification.type === 'competition') {
      toast.info('Competition details available in Events section');
      navigate('/events');
    }
  };

  const getIcon = (type) => {
    if (type === 'event') return <Calendar className="w-5 h-5 text-cyan-400" />;
    if (type === 'competition') return <Trophy className="w-5 h-5 text-yellow-400" />;
    return <Bell className="w-5 h-5 text-purple-400" />;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[#020617]">
        <div className="absolute top-0 left-0 right-0 h-96 opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.15) 0%, transparent 50%)' }}></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-6 py-12">
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
            <span className="text-gradient">Notifications</span>
          </h1>
          <p className="text-slate-400 text-lg">Stay updated with latest events and competitions</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No notifications yet</p>
            <p className="text-slate-500 text-sm mt-2">We'll notify you about new events and competitions</p>
          </div>
        ) : (
          <div className="space-y-6">
            {unreadNotifications.length > 0 && (
              <div>
                <h2 className="text-xl font-bold font-outfit text-cyan-400 mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Unread ({unreadNotifications.length})
                </h2>
                <div className="space-y-3">
                  {unreadNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      data-testid={`notification-${notification.id}`}
                      className="glass-card rounded-xl p-5 border-cyan-500/30 bg-cyan-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                      onClick={() => handleViewRelated(notification)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-bold text-cyan-400">{notification.title}</h3>
                            <span className="text-xs text-slate-500">{formatTime(notification.createdAt)}</span>
                          </div>
                          <p className="text-slate-300 mb-3">{notification.message}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              notification.type === 'event' 
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            }`}>
                              {notification.type === 'event' ? '📅 Event' : '🏆 Competition'}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                              New
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(notification.id);
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-green-400 hover:bg-green-500/10"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {readNotifications.length > 0 && (
              <div>
                <h2 className="text-xl font-bold font-outfit text-slate-400 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Read ({readNotifications.length})
                </h2>
                <div className="space-y-3">
                  {readNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      data-testid={`notification-read-${notification.id}`}
                      className="glass-card rounded-xl p-5 opacity-60 hover:opacity-100 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                      onClick={() => handleViewRelated(notification)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-700/30 flex items-center justify-center flex-shrink-0">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-medium text-slate-300">{notification.title}</h3>
                            <span className="text-xs text-slate-500">{formatTime(notification.createdAt)}</span>
                          </div>
                          <p className="text-slate-400 text-sm mb-2">{notification.message}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            notification.type === 'event' 
                              ? 'bg-slate-700/30 text-slate-400'
                              : 'bg-slate-700/30 text-slate-400'
                          }`}>
                            {notification.type === 'event' ? '📅 Event' : '🏆 Competition'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
