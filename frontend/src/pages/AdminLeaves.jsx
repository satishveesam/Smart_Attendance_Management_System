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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit', fontSize: { xs: '22px', sm: '28px' } }}>
          Leave & WFH Approvals
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', fontSize: '13px' }}>
          Approve or reject employee leaves and remote work requests.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5, fontFamily: 'Inter', fontSize: '13px' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5, fontFamily: 'Inter', fontSize: '13px' }}>{success}</Alert>}

      <Paper sx={{ p: 3, borderRadius: 3.5, boxShadow: '0 4px 12px rgba(50, 50, 93, 0.02)', border: '1px solid #f1f5f9' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#0f172a', fontFamily: 'Outfit', fontSize: '17px' }}>
          Pending Requests
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : requests.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#64748b' }}>
            <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: 'Outfit', fontSize: '15px', color: '#475569' }}>
              All caught up! 🎉
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, fontFamily: 'Inter', fontSize: '12.5px' }}>
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
                borderRadius: 2.5,
                overflow: 'hidden' 
              }}
            >
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Start Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>End Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '13px' }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((item) => (
                    <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1e293b', fontFamily: 'Outfit', fontSize: '13.5px' }}>{item.employeeName}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#0284c7', fontFamily: 'Inter', fontSize: '13px' }}>{item.employeeCode}</TableCell>
                      <TableCell sx={{ fontFamily: 'Inter' }}>
                        <Chip
                          label={item.leaveType === 'WFH' ? 'WFH' : item.leaveType.replace('_', ' ')}
                          variant="outlined"
                          size="small"
                          sx={{ 
                            fontWeight: 'bold', 
                            fontSize: '11px',
                            color: item.leaveType === 'WFH' ? '#0284c7' : '#475569', 
                            borderColor: item.leaveType === 'WFH' ? '#0284c7' : '#cbd5e1',
                            bgcolor: item.leaveType === 'WFH' ? '#f0f9ff' : '#f8fafc'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#475569' }}>{item.startDate}</TableCell>
                      <TableCell sx={{ fontFamily: 'Inter', fontSize: '13px', color: '#475569' }}>{item.endDate}</TableCell>
                      <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter', fontSize: '13px', color: '#475569' }}>
                        {item.reason}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<ApproveIcon sx={{ fontSize: 14 }} />}
                          onClick={() => handleProcess(item.id, 'approve')}
                          sx={{ 
                            mr: 1, 
                            textTransform: 'none', 
                            borderRadius: 2,
                            fontFamily: 'Outfit',
                            fontWeight: 600,
                            fontSize: '12px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            }
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<RejectIcon sx={{ fontSize: 14 }} />}
                          onClick={() => handleProcess(item.id, 'reject')}
                          sx={{ 
                            textTransform: 'none', 
                            borderRadius: 2,
                            fontFamily: 'Outfit',
                            fontWeight: 600,
                            fontSize: '12px',
                            borderColor: '#fee2e2',
                            color: '#ef4444',
                            bgcolor: '#fef2f2',
                            '&:hover': {
                              borderColor: '#fca5a5',
                              bgcolor: '#fee2e2'
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
            <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 2.5 }}>
              {requests.map((item) => (
                <Card 
                  key={item.id} 
                  sx={{ 
                    borderRadius: 3.5, 
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 4px 12px rgba(50, 50, 93, 0.02)',
                    bgcolor: '#fff',
                    p: 2.2
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 600, color: '#0284c7', fontSize: '11px', fontFamily: 'Inter' }}>
                      {item.employeeCode}
                    </Typography>
                    <Chip
                      label={item.leaveType === 'WFH' ? 'WFH' : item.leaveType.replace('_', ' ')}
                      variant="outlined"
                      size="small"
                      sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '10.5px', 
                        fontFamily: 'Inter', 
                        color: item.leaveType === 'WFH' ? '#0284c7' : '#475569', 
                        borderColor: item.leaveType === 'WFH' ? '#0284c7' : '#cbd5e1',
                        bgcolor: item.leaveType === 'WFH' ? '#f0f9ff' : '#f8fafc'
                      }}
                    />
                  </Box>
                  
                  <Typography sx={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b', fontFamily: 'Outfit' }}>
                    {item.employeeName}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '12px', fontFamily: 'Inter' }}>
                      📅 From: {item.startDate}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '12px', fontFamily: 'Inter' }}>
                      📅 To: {item.endDate}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold' }}>Reason</Typography>
                    <Typography variant="body2" sx={{ color: '#475569', fontFamily: 'Inter', fontSize: '12px', mt: 0.5 }}>
                      {item.reason}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5, mt: 2, pt: 2, borderTop: '1px solid #f1f5f9' }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<ApproveIcon />}
                      onClick={() => handleProcess(item.id, 'approve')}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: 2,
                        fontFamily: 'Outfit',
                        fontWeight: 600,
                        fontSize: '12px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: 'none',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
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
                      startIcon={<RejectIcon />}
                      onClick={() => handleProcess(item.id, 'reject')}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: 2,
                        fontFamily: 'Outfit',
                        fontWeight: 600,
                        fontSize: '12px',
                        borderColor: '#fee2e2',
                        color: '#ef4444',
                        bgcolor: '#fef2f2',
                        '&:hover': {
                          borderColor: '#fca5a5',
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
