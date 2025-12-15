import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Heart, Camera } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Svietbook = ({ student }) => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get(`${API}/photos`);
      setPhotos(response.data);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (photoId) => {
    try {
      const response = await axios.post(`${API}/photos/${photoId}/like?student_id=${student.id}`);
      
      setPhotos(photos.map(photo => {
        if (photo.id === photoId) {
          const likes = photo.likes || [];
          if (response.data.liked) {
            return { ...photo, likes: [...likes, student.id] };
          } else {
            return { ...photo, likes: likes.filter(id => id !== student.id) };
          }
        }
        return photo;
      }));
      
      toast.success(response.data.liked ? 'Photo liked!' : 'Photo unliked');
    } catch (error) {
      console.error('Error liking photo:', error);
      toast.error('Failed to update like');
    }
  };

  const isLiked = (photo) => {
    return photo.likes?.includes(student.id);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[#020617]">
        <div className="absolute top-0 left-0 right-0 h-96 opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.15) 0%, transparent 50%)' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 py-12">
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
            <span className="text-gradient">SVIETBOOK</span>
          </h1>
          <p className="text-slate-400 text-lg">College Event Memories & Glimpses 📸</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : photos.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Camera className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No photos yet</p>
            <p className="text-slate-500 text-sm mt-2">Event photos will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => {
              const liked = isLiked(photo);
              const likesCount = photo.likes?.length || 0;
              
              return (
                <div
                  key={photo.id}
                  data-testid={`photo-${photo.id}`}
                  className="glass-card rounded-xl overflow-hidden hover:-translate-y-2 transition-all duration-300 group"
                >
                  <div className="relative">
                    <img
                      src={photo.photoUrl}
                      alt={photo.eventName}
                      className="w-full h-72 object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-xl font-bold font-outfit text-cyan-400 mb-2">
                      {photo.eventName}
                    </h3>
                    <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                      {photo.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <button
                        data-testid={`like-button-${photo.id}`}
                        onClick={() => handleLike(photo.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                          liked
                            ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                            : 'bg-slate-800/50 text-slate-400 border border-white/10 hover:border-pink-500/30 hover:text-pink-400'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${liked ? 'fill-pink-400' : ''}`} />
                        <span className="font-bold">{likesCount}</span>
                      </button>
                      
                      <span className="text-xs text-slate-500">
                        {new Date(photo.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
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

export default Svietbook;
