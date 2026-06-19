import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../layouts/EmployeeLayout';
import API from '../api';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
} from '@mui/material';
import { 
  Send as SendIcon, 
  Add as AddIcon,
  CheckCircle as ApprovedIcon,
  HourglassEmpty as PendingIcon,
  Cancel as RejectedIcon
} from '@mui/icons-material';

const leaveTypes = [
  { value: 'WFH', label: 'Work From Home (WFH)' },
  { value: 'SICK_LEAVE', label: 'Sick Leave' },
  { value: 'CASUAL_LEAVE', label: 'Casual Leave' },
  { value: 'PAID_LEAVE', label: 'Paid Leave' },
];

const EmployeeLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Apply Leave Dialog State
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    leaveType: 'WFH',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      const res = await API.get('/leaves/my');
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      setError('Please fill in all request details');
      return;
    }

    setSubmitLoading(true);
    try {
      await API.post('/leaves', form);
      setSuccess('Leave / WFH request submitted successfully!');
      setForm({
        leaveType: 'WFH',
        startDate: '',
        endDate: '',
        reason: '',
      });
      fetchMyLeaves();
      setTimeout(() => {
        setApplyDialogOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error submitting request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case 'APPROVED':
        return { color: '#10b981', bg: '#ecfdf5', icon: <ApprovedIcon sx={{ fontSize: 14, color: '#10b981' }} /> };
      case 'REJECTED':
        return { color: '#ef4444', bg: '#fef2f2', icon: <RejectedIcon sx={{ fontSize: 14, color: '#ef4444' }} /> };
      default:
        return { color: '#f59e0b', bg: '#fffbeb', icon: <PendingIcon sx={{ fontSize: 14, color: '#f59e0b' }} /> };
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return '';
    const diffTime = Math.abs(new Date(end) - new Date(start));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <EmployeeLayout>
      <Box className="fade-in" sx={{ pb: { xs: 3, md: 5 } }}>
        
        {/* 1. Page Header */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', fontSize: { xs: '1.4rem', md: '2rem' }, fontFamily: 'Outfit' }}>
              Leave & WFH Center
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '12px', md: '13.5px' }, mt: 0.3, fontFamily: 'Inter' }}>
              Track your leave balances and submit time-off or remote work requests
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setApplyDialogOpen(true)}
            sx={{
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
              textTransform: 'none',
              borderRadius: 2,
              px: 2.5,
              py: 1,
              fontSize: '12.5px',
              fontWeight: 'bold',
              alignSelf: { xs: 'stretch', sm: 'auto' },
              boxShadow: 'none'
            }}
          >
            Apply Leave / WFH
          </Button>
        </Box>

        {/* 2. Leave Balance Stats Summary */}
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 3.5, bgcolor: '#fff', boxShadow: 'none' }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            {/* Stat 1: Sick Leave */}
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 'bold', display: 'block', fontSize: '9px', letterSpacing: '0.5px', mb: 0.5 }}>
                SICK LEAVE
              </Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#10b981', fontFamily: 'Outfit' }}>
                5 Days Left
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '8px' }}>
                Out of 12 Annual
              </Typography>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Stat 2: Casual Leave */}
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 'bold', display: 'block', fontSize: '9px', letterSpacing: '0.5px', mb: 0.5 }}>
                CASUAL LEAVE
              </Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#3b82f6', fontFamily: 'Outfit' }}>
                8 Days Left
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '8px' }}>
                Out of 15 Annual
              </Typography>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Stat 3: WFH privileges */}
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 'bold', display: 'block', fontSize: '9px', letterSpacing: '0.5px', mb: 0.5 }}>
                WFH PRIVILEGES
              </Typography>
              <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#f59e0b', fontFamily: 'Outfit' }}>
                4 Days Used
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '8px' }}>
                This Month
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* 3. Leave Request History Feed */}
        <Typography sx={{ fontWeight: 'bold', color: '#1e293b', mb: 2, fontFamily: 'Outfit', fontSize: { xs: '13px', sm: '15px' } }}>
          Request History & Status
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={26} />
          </Box>
        ) : leaves.length === 0 ? (
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 4, textAlign: 'center', bgcolor: '#fff', boxShadow: 'none' }}>
            <Typography sx={{ color: '#64748b', fontSize: '12.5px', fontFamily: 'Inter' }}>
              No leave or WFH requests found. Click the button above to apply.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {leaves.map((item) => {
              const status = getStatusDetails(item.status);
              return (
                <Grid item xs={12} sm={6} key={item.id}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      border: '1px solid #e2e8f0', 
                      boxShadow: 'none',
                      bgcolor: '#fff',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        backgroundColor: status.color
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      {/* Top status bar */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip
                          label={item.leaveType === 'WFH' ? 'WFH' : item.leaveType.replace('_', ' ')}
                          variant="outlined"
                          size="small"
                          sx={{ 
                            fontWeight: 'bold', 
                            fontSize: '9.5px', 
                            height: 18, 
                            color: item.leaveType === 'WFH' ? '#2563eb' : '#475569', 
                            borderColor: item.leaveType === 'WFH' ? '#bfdbfe' : '#cbd5e1',
                            bgcolor: item.leaveType === 'WFH' ? '#eff6ff' : '#f8fafc'
                          }}
                        />
                        <Chip
                          icon={status.icon}
                          label={item.status}
                          size="small"
                          sx={{ 
                            fontWeight: 'bold', 
                            fontSize: '9px', 
                            height: 18,
                            bgcolor: status.bg,
                            color: status.color,
                            border: `1px solid ${status.color}20`,
                            '& .MuiChip-icon': { ml: 0.5, mr: -0.2 }
                          }}
                        />
                      </Box>

                      {/* Date span */}
                      <Typography sx={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b', mb: 0.5, fontFamily: 'Outfit' }}>
                        {formatDateLabel(item.startDate)} to {formatDateLabel(item.endDate)}
                      </Typography>

                      <Typography sx={{ fontSize: '10.5px', color: '#3b82f6', fontWeight: 'bold', mb: 1, fontFamily: 'Inter' }}>
                        Duration: {calculateDays(item.startDate, item.endDate)}
                      </Typography>

                      {/* Reason */}
                      <Typography sx={{ color: '#475569', fontSize: '11px', mb: 1.5, wordBreak: 'break-word', fontFamily: 'Inter', bgcolor: '#f8fafc', p: 1, borderRadius: 1.5 }}>
                        <strong>Reason:</strong> {item.reason}
                      </Typography>

                      <Divider sx={{ mb: 1.2, borderStyle: 'dashed' }} />

                      {/* Action status/reviewer details */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ color: '#94a3b8', fontSize: '9.5px', fontFamily: 'Inter' }}>
                          Approved By: <strong>{item.approvedBy || 'Pending'}</strong>
                        </Typography>
                        <Typography sx={{ color: '#94a3b8', fontSize: '9.5px', fontFamily: 'Inter' }}>
                          ID: #{item.id}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* 4. Apply Leave Dialog Modal */}
        <Dialog open={applyDialogOpen} onClose={() => setApplyDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 'bold', fontSize: { xs: '15px', sm: '17px' }, fontFamily: 'Outfit' }}>
            Apply for Leave / WFH
          </DialogTitle>
          
          <DialogContent sx={{ pt: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 2, py: 0.5, fontSize: '11.5px', borderRadius: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2, py: 0.5, fontSize: '11.5px', borderRadius: 2 }}>{success}</Alert>}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                select
                fullWidth
                size="small"
                name="leaveType"
                label="Request Type"
                value={form.leaveType}
                onChange={handleInputChange}
                inputProps={{ style: { fontSize: 12.5, fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: 12.5, fontFamily: 'Inter' } }}
              >
                {leaveTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value} sx={{ fontSize: 12.5 }}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                size="small"
                name="startDate"
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={handleInputChange}
                slotProps={{ inputLabel: { shrink: true } }}
                inputProps={{ style: { fontSize: 12.5, fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: 12.5, fontFamily: 'Inter' } }}
              />

              <TextField
                fullWidth
                size="small"
                name="endDate"
                label="End Date"
                type="date"
                value={form.endDate}
                onChange={handleInputChange}
                slotProps={{ inputLabel: { shrink: true } }}
                inputProps={{ style: { fontSize: 12.5, fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: 12.5, fontFamily: 'Inter' } }}
              />

              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                name="reason"
                label="Reason / Comments"
                placeholder="Provide a detailed explanation of your request..."
                value={form.reason}
                onChange={handleInputChange}
                inputProps={{ style: { fontSize: 12, fontFamily: 'Inter' } }}
                InputLabelProps={{ style: { fontSize: 12, fontFamily: 'Inter' } }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setApplyDialogOpen(false)} color="inherit" sx={{ borderRadius: 2, textTransform: 'none', fontSize: '11.5px', fontWeight: 'bold' }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={submitLoading}
              startIcon={submitLoading ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 12 }} />}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none', 
                fontSize: '11.5px', 
                fontWeight: 'bold', 
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' },
                boxShadow: 'none'
              }}
            >
              Submit Request
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </EmployeeLayout>
  );
};

export default EmployeeLeaves;
