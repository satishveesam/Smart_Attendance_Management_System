import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
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
  Card,
} from '@mui/material';
import { Check as ApproveIcon, Close as RejectIcon } from '@mui/icons-material';

const AdminLeaves = () => {
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', letterSpacing: '-0.5px', fontSize: { xs: '20px', sm: '28px' } }}>
            Leave & WFH Approvals
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', fontFamily: 'Inter', fontSize: { xs: '11px', sm: '13px' }, maxWidth: '600px', display: { xs: 'none', sm: 'block' } }}>
            Verify, approve, or reject employee leave request applications and remote Work-From-Home registries.
          </Typography>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontFamily: 'Inter', fontSize: '13px' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontFamily: 'Inter', fontSize: '13px' }}>{success}</Alert>}

      <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, boxShadow: '0 2px 12px rgba(0, 0, 0, 0.01)', border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: '#0f172a', fontFamily: 'Outfit', fontSize: { xs: '15px', sm: '17px' } }}>
          Pending Approvals Queue
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={24} color="primary" />
          </Box>
        ) : requests.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5, color: '#64748b' }}>
            <Typography sx={{ fontSize: '24px', mb: 0.5 }}>🎉</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: 'Outfit', fontSize: '14.5px', color: '#1e293b' }}>
              All caught up!
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontFamily: 'Inter', fontSize: '12px' }}>
              There are no pending leave or WFH requests to process.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Desktop Table View (sm & up) */}
            <TableContainer 
              component={Paper} 
              sx={{ 
                display: { xs: 'none', sm: 'block' }, 
                boxShadow: 'none', 
                border: '1px solid #f1f5f9', 
                borderRadius: 2,
                overflow: 'hidden' 
              }}
            >
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', py: 1.5 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', py: 1.5 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', py: 1.5 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', py: 1.5 }}>Start Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', py: 1.5 }}>End Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', py: 1.5 }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12px', py: 1.5 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((item) => (
                    <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b', fontFamily: 'Outfit', fontSize: '13px' }}>{item.employeeName}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0284c7', fontFamily: 'Inter', fontSize: '12px' }}>{item.employeeCode}</TableCell>
                      <TableCell sx={{ fontFamily: 'Inter' }}>
                        <Chip
                          label={item.leaveType === 'WFH' ? 'WFH' : item.leaveType.replace('_', ' ')}
                          variant="outlined"
                          size="small"
                          sx={{ 
                            fontWeight: 800, 
                            fontSize: '10px',
                            color: item.leaveType === 'WFH' ? '#0284c7' : '#475569', 
                            borderColor: item.leaveType === 'WFH' ? 'rgba(2, 132, 199, 0.3)' : '#cbd5e1',
                            bgcolor: item.leaveType === 'WFH' ? '#f0f9ff' : '#f8fafc',
                            height: 20
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Inter', fontSize: '12.5px', color: '#475569' }}>{item.startDate}</TableCell>
                      <TableCell sx={{ fontFamily: 'Inter', fontSize: '12.5px', color: '#475569' }}>{item.endDate}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter', fontSize: '12.5px', color: '#475569' }}>
                        {item.reason}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 0.5 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<ApproveIcon sx={{ fontSize: 13 }} />}
                          onClick={() => handleProcess(item.id, 'approve')}
                          sx={{ 
                            mr: 1, 
                            textTransform: 'none', 
                            borderRadius: 1.5,
                            fontFamily: 'Outfit',
                            fontWeight: 700,
                            fontSize: '11.5px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            boxShadow: 'none',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                              boxShadow: 'none'
                            }
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<RejectIcon sx={{ fontSize: 13 }} />}
                          onClick={() => handleProcess(item.id, 'reject')}
                          sx={{ 
                            textTransform: 'none', 
                            borderRadius: 1.5,
                            fontFamily: 'Outfit',
                            fontWeight: 700,
                            fontSize: '11.5px',
                            borderColor: '#fca5a5',
                            color: '#ef4444',
                            bgcolor: '#fef2f2',
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: '#f87171',
                              bgcolor: '#fee2e2',
                              boxShadow: 'none'
                            }
                          }}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Mobile Cards List View (xs only) */}
            <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1.5 }}>
              {requests.map((item) => (
                <Card 
                  key={item.id} 
                  sx={{ 
                    borderRadius: 2.5, 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.01)',
                    bgcolor: '#fff',
                    p: 1.5
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: '#0284c7', fontSize: '10.5px', fontFamily: 'Inter' }}>
                      {item.employeeCode}
                    </Typography>
                    <Chip
                      label={item.leaveType === 'WFH' ? 'WFH' : item.leaveType.replace('_', ' ')}
                      variant="outlined"
                      size="small"
                      sx={{ 
                        fontWeight: 800, 
                        fontSize: '9px', 
                        fontFamily: 'Inter', 
                        color: item.leaveType === 'WFH' ? '#0284c7' : '#475569', 
                        borderColor: item.leaveType === 'WFH' ? 'rgba(2, 132, 199, 0.25)' : '#cbd5e1',
                        bgcolor: item.leaveType === 'WFH' ? '#f0f9ff' : '#f8fafc',
                        height: 18
                      }}
                    />
                  </Box>
                  
                  <Typography sx={{ fontWeight: 800, fontSize: '13.5px', color: '#1e293b', fontFamily: 'Outfit' }}>
                    {item.employeeName}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '11px', fontFamily: 'Inter' }}>
                      Start: <strong>{item.startDate}</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '11px', fontFamily: 'Inter' }}>
                      End: <strong>{item.endDate}</strong>
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 1, p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '8px', textTransform: 'uppercase', fontWeight: 800 }}>Reason</Typography>
                    <Typography variant="body2" sx={{ color: '#475569', fontFamily: 'Inter', fontSize: '11.5px', mt: 0.2, lineHeight: 1.4 }}>
                      {item.reason}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<ApproveIcon sx={{ fontSize: 13 }} />}
                      onClick={() => handleProcess(item.id, 'approve')}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: 1.5,
                        fontFamily: 'Outfit',
                        fontWeight: 700,
                        fontSize: '11px',
                        py: 0.5,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: 'none',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<RejectIcon sx={{ fontSize: 13 }} />}
                      onClick={() => handleProcess(item.id, 'reject')}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: 1.5,
                        fontFamily: 'Outfit',
                        fontWeight: 700,
                        fontSize: '11px',
                        py: 0.5,
                        borderColor: '#fca5a5',
                        color: '#ef4444',
                        bgcolor: '#fef2f2',
                        '&:hover': {
                          borderColor: '#f87171',
                          bgcolor: '#fee2e2'
                        }
                      }}
                    >
                      Reject
                    </Button>
                  </Box>
                </Card>
              ))}
            </Box>
          </>
        )}
      </Paper>
    </AdminLayout>
  );
};

export default AdminLeaves;
