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
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const EmployeeHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Preview selfie dialog states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  useEffect(() => {
    fetchPersonalHistory();
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

  const handleOpenPreview = (url, title) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'PRESENT':
        return <Chip label="Present" color="success" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'LATE':
        return <Chip label="Late" color="warning" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'HALF_DAY':
        return <Chip label="Half Day" color="primary" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'ABSENT':
        return <Chip label="Absent" color="error" size="small" sx={{ fontWeight: 'bold' }} />;
      default:
        return <Chip label={status} size="small" />;
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
          My Attendance History
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Review your previous check-in details, check-out stamps, and accumulated hours
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : logs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', color: '#64748b', borderRadius: 3 }}>
          You don't have any attendance records logged yet.
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', overflowX: 'auto', width: '100%' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Check In</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>In Selfie</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Check Out</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Out Selfie</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Working Hours</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Locations (Check-In / Out)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>{log.attendanceDate}</TableCell>
                  <TableCell>{formatTime(log.checkIn)}</TableCell>
                  <TableCell>
                    {log.checkInSelfie ? (
                      <Avatar
                        src={log.checkInSelfie}
                        variant="rounded"
                        sx={{ width: 36, height: 36, cursor: 'pointer', border: '1px solid #cbd5e1', '&:hover': { opacity: 0.85 } }}
                        onClick={() => handleOpenPreview(log.checkInSelfie, `Check-In Selfie - ${log.attendanceDate}`)}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{formatTime(log.checkOut)}</TableCell>
                  <TableCell>
                    {log.checkOutSelfie ? (
                      <Avatar
                        src={log.checkOutSelfie}
                        variant="rounded"
                        sx={{ width: 36, height: 36, cursor: 'pointer', border: '1px solid #cbd5e1', '&:hover': { opacity: 0.85 } }}
                        onClick={() => handleOpenPreview(log.checkOutSelfie, `Check-Out Selfie - ${log.attendanceDate}`)}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{log.totalHours != null ? `${log.totalHours.toFixed(2)} hrs` : '-'}</TableCell>
                  <TableCell>{getStatusChip(log.status)}</TableCell>
                  <TableCell sx={{ fontSize: 12, color: '#64748b' }}>
                    {log.checkInLatitude ? `In: ${log.checkInLatitude.toFixed(4)}, ${log.checkInLongitude.toFixed(4)}` : ''}
                    {log.checkOutLatitude ? ` | Out: ${log.checkOutLatitude.toFixed(4)}, ${log.checkOutLongitude.toFixed(4)}` : ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
