import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import API from '../api';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  Campaign as BroadcastIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  NotificationsActive as ActiveIcon,
  NotificationsOff as InactiveIcon,
} from '@mui/icons-material';

const AdminBroadcasts = () => {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog open/close state
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [active, setActive] = useState(true);
  const [formSaving, setFormSaving] = useState(false);

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const fetchBroadcasts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/broadcasts');
      setBroadcasts(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load broadcast logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedBroadcast(null);
    setTitle('');
    setMessage('');
    setActive(true);
    setError('');
    setSuccess('');
    setFormOpen(true);
  };

  const handleOpenEdit = (broadcast) => {
    setSelectedBroadcast(broadcast);
    setTitle(broadcast.title);
    setMessage(broadcast.message);
    setActive(broadcast.active);
    setError('');
    setSuccess('');
    setFormOpen(true);
  };

  const handleOpenDelete = (broadcast) => {
    setSelectedBroadcast(broadcast);
    setError('');
    setSuccess('');
    setDeleteConfirmOpen(true);
  };

  const handleSaveBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.');
      return;
    }

    setFormSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        active,
      };

      if (selectedBroadcast) {
        // Update endpoint
        const res = await API.put(`/broadcasts/${selectedBroadcast.id}`, payload);
        setSuccess('Broadcast message updated successfully!');
      } else {
        // Create endpoint
        const res = await API.post('/broadcasts', payload);
        setSuccess('New broadcast announcement published successfully!');
      }

      setFormOpen(false);
      fetchBroadcasts();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save broadcast message.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBroadcast) return;
    setError('');
    setSuccess('');

    try {
      await API.delete(`/broadcasts/${selectedBroadcast.id}`);
      setSuccess('Broadcast log deleted successfully!');
      setDeleteConfirmOpen(false);
      fetchBroadcasts();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete broadcast log.');
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <AdminLayout>
      {/* Page Header Welcome Banner */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3, 
          borderRadius: 4, 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#fff',
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.12)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: '-50%', right: '-20%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, rgba(56, 189, 248, 0) 70%)', zIndex: 0 }} />
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', letterSpacing: '-0.5px', fontSize: { xs: '20px', sm: '28px' } }}>
              Corporate Broadcasts
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', fontFamily: 'Inter', fontSize: { xs: '11px', sm: '13px' }, maxWidth: '600px' }}>
              Publish official updates, schedule changes, and real-time notices to all employees.
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              textTransform: 'none',
              borderRadius: 2,
              px: { xs: 2, sm: 2.5 },
              py: { xs: 1, sm: 1.2 },
              fontFamily: 'Outfit',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
                boxShadow: 'none'
              },
            }}
          >
            Publish Broadcast
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: '13px', fontFamily: 'Inter' }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontSize: '13px', fontFamily: 'Inter' }}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : broadcasts.length === 0 ? (
        <Paper sx={{ p: 5, borderRadius: 3, border: '1px dashed #cbd5e1', bgcolor: '#fff', textAlign: 'center' }}>
          <BroadcastIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1.5 }} />
          <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '14.5px', fontFamily: 'Outfit' }}>
            No broadcasts published yet
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '12px', fontFamily: 'Inter', mt: 0.5, mb: 2 }}>
            Announcements published here will appear on all employee home dashboards.
          </Typography>
          <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ borderRadius: 1.5, textTransform: 'none', fontFamily: 'Outfit', fontSize: '12px', fontWeight: 700 }}>
            Create First Broadcast
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {broadcasts.map((broadcast) => (
            <Grid item xs={12} key={broadcast.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.01)',
                  bgcolor: '#fff'
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          p: 0.8,
                          borderRadius: 2,
                          bgcolor: broadcast.active ? '#f0fdf4' : '#f8fafc',
                          color: broadcast.active ? '#10b981' : '#94a3b8',
                          display: 'flex',
                        }}
                      >
                        <BroadcastIcon sx={{ fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', fontFamily: 'Outfit', fontSize: { xs: '14.5px', sm: '16px' } }}>
                            {broadcast.title}
                          </Typography>
                          {broadcast.active ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#ecfdf5', color: '#10b981', px: 0.8, py: 0.2, borderRadius: 1, height: 16 }}>
                              <ActiveIcon sx={{ fontSize: 8 }} />
                              <Typography sx={{ fontSize: '8px', fontWeight: 800, fontFamily: 'Inter' }}>ACTIVE</Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#f1f5f9', color: '#64748b', px: 0.8, py: 0.2, borderRadius: 1, height: 16 }}>
                              <InactiveIcon sx={{ fontSize: 8 }} />
                              <Typography sx={{ fontSize: '8px', fontWeight: 800, fontFamily: 'Inter' }}>ARCHIVED</Typography>
                            </Box>
                          )}
                        </Box>
                        <Typography sx={{ fontSize: '10.5px', color: '#94a3b8', fontFamily: 'Inter', mt: 0.2 }}>
                          Published on {new Date(broadcast.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton onClick={() => handleOpenEdit(broadcast)} size="small" sx={{ color: '#0284c7', bgcolor: '#f0f9ff', '&:hover': { bgcolor: '#e0f2fe' } }}>
                        <EditIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <IconButton onClick={() => handleOpenDelete(broadcast)} size="small" sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}>
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.8, borderColor: '#f1f5f9' }} />

                  <Typography
                    variant="body2"
                    sx={{
                      color: '#475569',
                      fontFamily: 'Inter',
                      fontSize: '12.5px',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                    }}
                  >
                    {broadcast.message}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3.5, p: 1 } }}>
        <form onSubmit={handleSaveBroadcast}>
          <DialogTitle sx={{ fontWeight: 'bold', fontFamily: 'Outfit' }}>
            {selectedBroadcast ? 'Edit Broadcast Announcement' : 'Publish New Broadcast'}
          </DialogTitle>
          <DialogContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <TextField
                fullWidth
                required
                label="Announcement Title"
                placeholder="e.g. Mandatory Attendance Update"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                InputProps={{ style: { fontSize: '13.5px', fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
              />

              <TextField
                fullWidth
                required
                multiline
                rows={5}
                label="Detailed Message"
                placeholder="Write your announcement details here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                InputProps={{ style: { fontSize: '13.5px', fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: '13px', fontFamily: 'Inter' } }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', fontFamily: 'Outfit' }}>
                      Active Status
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#64748b', fontFamily: 'Inter' }}>
                      If inactive, the message is archived and won't show on employee dashboards.
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button
              onClick={() => setFormOpen(false)}
              variant="outlined"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: '12.5px',
                borderColor: '#cbd5e1',
                color: '#64748b',
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formSaving}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                fontFamily: 'Outfit',
                fontWeight: 600,
                fontSize: '12.5px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
                },
              }}
            >
              {formSaving ? <CircularProgress size={18} color="inherit" /> : selectedBroadcast ? 'Save Changes' : 'Publish'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} sx={{ '& .MuiDialog-paper': { borderRadius: 3.5, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', fontFamily: 'Outfit' }}>
          Delete Broadcast Announcement?
        </DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Typography sx={{ fontSize: '13px', color: '#64748b', fontFamily: 'Inter' }}>
            Are you sure you want to permanently delete the broadcast log titled "<strong>{selectedBroadcast?.title}</strong>"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: '12.5px',
              borderColor: '#cbd5e1',
              color: '#64748b',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: '12.5px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              },
            }}
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBroadcasts;
