import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../layouts/EmployeeLayout';
import API from '../api';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Check as ApproveIcon, Close as RejectIcon } from '@mui/icons-material';

const EmployeeApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const res = await API.get('/leaves/pending');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch pending leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id, action) => {
    setError('');
    setSuccess('');
    try {
      await API.post(`/leaves/${id}/${action}`);
      setSuccess(`Request successfully ${action}d!`);
      fetchPendingRequests();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || `Failed to ${action} request`);
    }
  };

  return (
    <EmployeeLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
          Approvals Center
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Process pending leave and remote work requests for team members
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

      <Paper className="premium-card" sx={{ p: 3, borderRadius: 4, bgcolor: '#fff', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#0f172a' }}>
          Pending Requests
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : requests.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: '#64748b' }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              All caught up! 🎉
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
              There are no pending requests to approve or reject.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>{item.employeeName}</TableCell>
                    <TableCell>{item.employeeCode}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.leaveType === 'WFH' ? 'WFH' : item.leaveType.replace('_', ' ')}
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 'bold', color: item.leaveType === 'WFH' ? '#0d9488' : '#475569', borderColor: item.leaveType === 'WFH' ? '#0d9488' : '#cbd5e1' }}
                      />
                    </TableCell>
                    <TableCell>{item.startDate}</TableCell>
                    <TableCell>{item.endDate}</TableCell>
                    <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.reason}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<ApproveIcon />}
                        onClick={() => handleProcess(item.id, 'approve')}
                        sx={{ mr: 1, textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => handleProcess(item.id, 'reject')}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </EmployeeLayout>
  );
};

export default EmployeeApprovals;
