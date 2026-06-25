import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../layouts/EmployeeLayout';
import API from '../api';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Avatar,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  IconButton,
  Button,
  Tabs,
  Tab,
  TextField,
  Alert,
  Grid,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, History as HistoryIcon, PostAdd as RequestIcon } from '@mui/icons-material';

const EmployeeHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Correction request states
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [reqDate, setReqDate] = useState('');
  const [reqCheckIn, setReqCheckIn] = useState('09:00');
  const [reqCheckOut, setReqCheckOut] = useState('18:00');
  const [reqReason, setReqReason] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Preview selfie dialog states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  useEffect(() => {
    fetchPersonalHistory();
    fetchCorrectionRequests();
  }, []);

  const fetchPersonalHistory = async () => {
    setLoading(true);
    try {
      const res = await API.get('/attendance/history');
      // Sort logs descending by date
      const sorted = res.data.sort((a, b) => new Date(b.attendanceDate) - new Date(a.attendanceDate));
      setLogs(sorted);
    } catch (err) {
      console.error("Failed to load attendance logs", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCorrectionRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await API.get('/attendance-requests/my');
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to load attendance requests", err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleOpenPreview = (url, title) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  const handleFormOpen = () => {
    setReqDate(new Date().toISOString().split('T')[0]);
    setReqCheckIn('09:00');
    setReqCheckOut('18:00');
    setReqReason('');
    setFormError('');
    setFormSuccess('');
    setFormOpen(true);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reqDate || !reqCheckIn || !reqCheckOut || !reqReason) {
      setFormError('Please fill out all fields.');
      return;
    }
    
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      // Combine date and times to ISO 8601 format
      const checkInDateTime = `${reqDate}T${reqCheckIn}:00`;
      const checkOutDateTime = `${reqDate}T${reqCheckOut}:00`;

      await API.post('/attendance-requests/submit', {
        date: reqDate,
        checkIn: checkInDateTime,
        checkOut: checkOutDateTime,
        reason: reqReason
      });

      setFormSuccess('Attendance correction request submitted successfully!');
      fetchCorrectionRequests();
      
      setTimeout(() => {
        setFormOpen(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to submit correction request.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'PRESENT':
        return <Chip label="Present" color="success" size="small" sx={{ fontWeight: 'bold', fontFamily: 'Outfit' }} />;
      case 'LATE':
        return <Chip label="Late" color="warning" size="small" sx={{ fontWeight: 'bold', fontFamily: 'Outfit' }} />;
      case 'HALF_DAY':
        return <Chip label="Half Day" color="primary" size="small" sx={{ fontWeight: 'bold', fontFamily: 'Outfit' }} />;
      case 'ABSENT':
        return <Chip label="Absent" color="error" size="small" sx={{ fontWeight: 'bold', fontFamily: 'Outfit' }} />;
      default:
        return <Chip label={status} size="small" sx={{ fontFamily: 'Outfit' }} />;
    }
  };

  const getRequestStatusChip = (status) => {
    switch (status) {
      case 'PENDING':
        return <Chip label="Pending" color="warning" size="small" sx={{ fontWeight: 'bold', fontFamily: 'Outfit' }} />;
      case 'APPROVED':
        return <Chip label="Approved" color="success" size="small" sx={{ fontWeight: 'bold', fontFamily: 'Outfit' }} />;
      case 'REJECTED':
        return <Chip label="Rejected" color="error" size="small" sx={{ fontWeight: 'bold', fontFamily: 'Outfit' }} />;
      default:
        return <Chip label={status} size="small" sx={{ fontFamily: 'Outfit' }} />;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <EmployeeLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit' }}>
            My Attendance Records
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', mt: 0.5 }}>
            Review check-in history, biometric selfies, and submit attendance correction requests
          </Typography>
        </Box>
        {activeTab === 1 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleFormOpen}
            sx={{
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 'bold',
              fontFamily: 'Outfit',
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' }
            }}
          >
            New Request
          </Button>
        )}
      </Box>

      {/* Modern Sub-header Tabs */}
      <Paper sx={{ borderRadius: 3, mb: 3, boxShadow: 'none', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          sx={{
            bgcolor: '#f8fafc',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'bold',
              fontFamily: 'Outfit',
              fontSize: '13px',
              py: 1.5,
            }
          }}
        >
          <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Attendance Logs" />
          <Tab icon={<RequestIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Correction Requests" />
        </Tabs>
      </Paper>

      {activeTab === 0 ? (
        /* TAB 1: ATTENDANCE LOGS */
        loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', color: '#64748b', borderRadius: 4, border: '1px dashed #cbd5e1' }}>
            You don't have any attendance records logged yet.
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: 'none', border: '1px solid #e2e8f0', overflowX: 'auto', width: '100%' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit' }}>Check In</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit' }}>In Selfie</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit' }}>Check Out</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit' }}>Out Selfie</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit' }}>Working Hours</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit' }}>Location Stamps</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit' }}>
                      {new Date(log.attendanceDate).toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '12px' }}>{formatTime(log.checkIn)}</TableCell>
                    <TableCell>
                      {log.checkInSelfie ? (
                        <Avatar
                          src={log.checkInSelfie}
                          variant="rounded"
                          sx={{ width: 38, height: 38, cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: 1.5, '&:hover': { opacity: 0.85 } }}
                          onClick={() => handleOpenPreview(log.checkInSelfie, `Check-In Selfie - ${log.attendanceDate}`)}
                        />
                      ) : (
                        <Typography sx={{ color: '#94a3b8', fontSize: '11px', fontStyle: 'italic' }}>No Selfie</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '12px' }}>{formatTime(log.checkOut)}</TableCell>
                    <TableCell>
                      {log.checkOutSelfie ? (
                        <Avatar
                          src={log.checkOutSelfie}
                          variant="rounded"
                          sx={{ width: 38, height: 38, cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: 1.5, '&:hover': { opacity: 0.85 } }}
                          onClick={() => handleOpenPreview(log.checkOutSelfie, `Check-Out Selfie - ${log.attendanceDate}`)}
                        />
                      ) : (
                        <Typography sx={{ color: '#94a3b8', fontSize: '11px', fontStyle: 'italic' }}>No Selfie</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontWeight: 600, color: '#475569', fontSize: '12px' }}>
                      {log.totalHours != null ? `${log.totalHours.toFixed(2)} hrs` : '-'}
                    </TableCell>
                    <TableCell>{getStatusChip(log.status)}</TableCell>
                    <TableCell sx={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'Inter', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📍 {log.checkInAddress || 'Corporate Office'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      ) : (
        /* TAB 2: CORRECTION REQUESTS */
        requestsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : requests.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', color: '#64748b', borderRadius: 4, border: '1px dashed #cbd5e1' }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>No Correction Requests</Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, mb: 2 }}>
              If your attendance was missed, you can request an administrative regularisation.
            </Typography>
            <Button variant="outlined" size="small" onClick={handleFormOpen} sx={{ textTransform: 'none', borderRadius: 2 }}>
              Request Correction
            </Button>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: 'none', border: '1px solid #e2e8f0', overflowX: 'auto', width: '100%' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit' }}>Requested In</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit' }}>Requested Out</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit' }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit' }}>Admin Comment</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id} hover>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit' }}>
                      {new Date(req.attendanceDate).toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '12px' }}>{formatTime(req.checkInTime)}</TableCell>
                    <TableCell sx={{ fontFamily: 'Inter', fontSize: '12px' }}>{formatTime(req.checkOutTime)}</TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '12px', fontFamily: 'Inter', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {req.reason}
                    </TableCell>
                    <TableCell>{getRequestStatusChip(req.status)}</TableCell>
                    <TableCell sx={{ 
                      fontSize: '11.5px', 
                      fontFamily: 'Inter',
                      fontWeight: req.status === 'REJECTED' ? 600 : 400,
                      color: req.status === 'REJECTED' ? '#ef4444' : req.status === 'APPROVED' ? '#10b981' : '#64748b',
                      maxWidth: 220
                    }}>
                      {req.adminComment || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* New Correction Request Form Modal */}
      <Dialog
        open={formOpen}
        onClose={() => !submitting && setFormOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 1 }}>
          <RequestIcon sx={{ color: '#2563eb' }} /> Request Attendance Correction
        </DialogTitle>
        <form onSubmit={handleRequestSubmit}>
          <DialogContent sx={{ pt: 1, pb: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {formError && <Alert severity="error" sx={{ py: 0.5, fontSize: '11.5px', borderRadius: 2 }}>{formError}</Alert>}
            {formSuccess && <Alert severity="success" sx={{ py: 0.5, fontSize: '11.5px', borderRadius: 2 }}>{formSuccess}</Alert>}

            <TextField
              label="Attendance Date"
              type="date"
              value={reqDate}
              onChange={(e) => setReqDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: new Date().toISOString().split('T')[0] }}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Proposed Check-In"
                  type="time"
                  value={reqCheckIn}
                  onChange={(e) => setReqCheckIn(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Proposed Check-Out"
                  type="time"
                  value={reqCheckOut}
                  onChange={(e) => setReqCheckOut(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <TextField
              label="Reason for Regularisation"
              placeholder="e.g. Forgot to check in while attending client onsite meeting, or biometric scan failed."
              multiline
              rows={3}
              value={reqReason}
              onChange={(e) => setReqReason(e.target.value)}
              fullWidth
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setFormOpen(false)} disabled={submitting} color="inherit" sx={{ textTransform: 'none', fontWeight: 'bold' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' }
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Selfie Preview Modal */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, fontFamily: 'Outfit', fontWeight: 'bold' }}>
          <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 'bold' }}>{previewTitle}</Typography>
          <IconButton onClick={() => setPreviewOpen(false)} size="small" sx={{ color: '#94a3b8' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', pb: 3, pt: 1, borderTop: '1px solid #f1f5f9' }}>
          <Box
            component="img"
            src={previewUrl}
            alt="Preview Selfie"
            sx={{
              maxWidth: '100%',
              maxHeight: '70vh',
              borderRadius: 3,
              border: '1px solid #cbd5e1',
              objectFit: 'contain',
              mt: 2
            }}
          />
        </DialogContent>
      </Dialog>
    </EmployeeLayout>
  );
};

export default EmployeeHistory;
