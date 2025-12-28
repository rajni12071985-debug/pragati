import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Calendar, Upload, Clock, CheckCircle, XCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeaveApplication = ({ student }) => {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    fromDate: '',
    toDate: '',
    documentUrl: ''
  });

  useEffect(() => {
    if (student?.id) {
      fetchLeaves();
    }
  }, [student]);

  const fetchLeaves = async () => {
    try {
      const response = await axios.get(`${API}/leave-applications/student/${student.id}`);
      setLeaves(response.data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason || !formData.fromDate || !formData.toDate) {
      toast.error('Please fill all required fields');
      return;
    }

    if (new Date(formData.fromDate) > new Date(formData.toDate)) {
      toast.error('From date cannot be after To date');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/leave-applications`, {
        studentId: student.id,
        ...formData
      });
      toast.success('Leave application submitted successfully!');
      setFormData({ reason: '', fromDate: '', toDate: '', documentUrl: '' });
      setShowForm(false);
      fetchLeaves();
    } catch (error) {
      console.error('Error submitting leave:', error);
      toast.error('Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm border border-green-500/30">
            <CheckCircle className="w-4 h-4" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm border border-red-500/30">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm border border-yellow-500/30">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[#020617]">
        <div className="absolute top-0 left-0 right-0 h-96 opacity-20" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.15) 0%, transparent 50%)' }}></div>
      </div>

      <div className="relative z-10">
        <nav className="glass-card border-b border-white/5 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                className="text-slate-400 hover:text-cyan-400"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h1 className="text-xl font-bold text-gradient">Leave Application</h1>
            </div>
            <div className="w-20"></div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto p-6 py-8">
          {/* Apply Leave Button */}
          <div className="flex justify-end mb-6">
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 font-bold"
            >
              <FileText className="w-4 h-4 mr-2" />
              {showForm ? 'Cancel' : 'Apply for Leave'}
            </Button>
          </div>

          {/* Leave Application Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 mb-8 space-y-4">
              <h2 className="text-xl font-bold text-slate-200 mb-4">New Leave Application</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">From Date *</Label>
                  <Input
                    type="date"
                    value={formData.fromDate}
                    onChange={(e) => setFormData({...formData, fromDate: e.target.value})}
                    className="bg-slate-950/50 border-white/10 focus:border-cyan-500/50 text-slate-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">To Date *</Label>
                  <Input
                    type="date"
                    value={formData.toDate}
                    onChange={(e) => setFormData({...formData, toDate: e.target.value})}
                    className="bg-slate-950/50 border-white/10 focus:border-cyan-500/50 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Reason *</Label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="Enter reason for leave..."
                  className="w-full bg-slate-950/50 border border-white/10 rounded-md px-3 py-2 text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 min-h-[100px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Document URL (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <Input
                    type="url"
                    value={formData.documentUrl}
                    onChange={(e) => setFormData({...formData, documentUrl: e.target.value})}
                    placeholder="https://drive.google.com/... or any image/pdf URL"
                    className="bg-slate-950/50 border-white/10 focus:border-cyan-500/50 text-slate-200"
                  />
                </div>
                <p className="text-slate-500 text-xs">Upload your document to Google Drive/Imgur and paste the link here</p>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold h-12"
              >
                {submitting ? 'Submitting...' : 'Submit Leave Application'}
              </Button>
            </form>
          )}

          {/* Leave History */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-200">Your Leave Applications</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
              </div>
            ) : leaves.length === 0 ? (
              <div className="glass-card rounded-xl p-12 text-center">
                <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No leave applications yet</p>
                <p className="text-slate-500 text-sm mt-2">Click &quot;Apply for Leave&quot; to submit your first application</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaves.map((leave) => (
                  <div key={leave.id} className="glass-card rounded-xl p-6 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="w-5 h-5 text-cyan-400" />
                          <span className="text-slate-200 font-medium">
                            {new Date(leave.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {' → '}
                            {new Date(leave.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-slate-300 mb-3">{leave.reason}</p>
                        {leave.documentUrl && (
                          <a
                            href={leave.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-sm"
                          >
                            <FileText className="w-4 h-4" />
                            View Document
                          </a>
                        )}
                        {leave.adminComment && (
                          <p className="mt-2 text-slate-400 text-sm italic">
                            Admin Comment: {leave.adminComment}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(leave.status)}
                    </div>
                    <div className="text-slate-500 text-xs">
                      Applied on: {new Date(leave.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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

export default LeaveApplication;
