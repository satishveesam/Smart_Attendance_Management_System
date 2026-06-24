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
  Avatar,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  EventNote as LeaveIcon,
  HourglassEmpty as EmptyIcon,
} from '@mui/icons-material';

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
      setSuccess(`Request successfully ${action}ed!`);
      fetchPendingRequests();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || `Failed to ${action} request`);
    }
  };

  const getAvatarColor = (name) => {
    if (!name) return '#8b5cf6';
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getLeaveTypeStyle = (type) => {
    if (!type) return { bg: '#f1f5f9', color: '#475569', label: 'LEAVE' };
    const t = type.toUpperCase();
    if (t.includes('WFH') || t.includes('REMOTE')) {
      return { bg: '#eff6ff', color: '#2563eb', label: 'WFH / REMOTE' };
    } else if (t.includes('SICK') || t.includes('MEDICAL')) {
      return { bg: '#fef2f2', color: '#dc2626', label: 'SICK LEAVE' };
    } else if (t.includes('CASUAL')) {
      return { bg: '#fffbeb', color: '#d97706', label: 'CASUAL LEAVE' };
    }
    return { bg: '#f8fafc', color: '#475569', label: type.replace('_', ' ') };
  };

  return (
    <AdminLayout>
      {/* 1. Header Banner */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ p: 0.6, borderRadius: 2, bgcolor: '#faf5ff', color: '#7e22ce', display: 'flex' }}>
            <LeaveIcon sx={{ fontSize: 22 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', fontFamily: 'Outfit', letterSpacing: '-0.3px', fontSize: { xs: '20px', sm: '26px' } }}>
            Leave & WFH Approvals
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'Inter', fontSize: '13px', mt: 0.8 }}>
          Approve or reject employee leave requests and remote work arrangements.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5, fontFamily: 'Inter', fontSize: '13.5px' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5, fontFamily: 'Inter', fontSize: '13.5px' }}>{success}</Alert>}

      {/* 2. Main Board Content */}
      <Paper sx={{ 
        p: { xs: 2.5, sm: 3.5 }, 
        borderRadius: 4, 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px 0 rgba(0, 0, 0, 0.01)', 
        border: '1px solid #f1f5f9',
        bgcolor: '#fff'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0f172a', fontFamily: 'Outfit', fontSize: '16.5px' }}>
            Pending Queue
          </Typography>
          <Chip 
            label={`${requests.length} pending`} 
            size="small" 
            sx={{ 
              bgcolor: requests.length > 0 ? '#faf5ff' : '#f1f5f9', 
              color: requests.length > 0 ? '#7e22ce' : '#64748b', 
              fontWeight: 'bold', 
              fontFamily: 'Outfit',
              fontSize: '11px' 
            }} 
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : requests.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
            <Box sx={{ 
              width: 56, 
              height: 56, 
              borderRadius: '50%', 
              bgcolor: '#f0fdf4', 
              color: '#10b981', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 4px 12px 0 rgba(16, 185, 129, 0.08)'
            }}>
              <EmptyIcon sx={{ fontSize: 26 }} />
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold', fontFamily: 'Outfit', fontSize: '15.5px', color: '#1e293b' }}>
              All Caught Up! 🎉
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, fontFamily: 'Inter', fontSize: '12.5px', maxWidth: 280, mx: 'auto' }}>
              There are no pending leave or WFH requests requiring administrative review.
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
                borderRadius: 3,
                overflow: 'hidden' 
              }}
            >
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12.5px', pl: 3 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12.5px' }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12.5px' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12.5px' }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12.5px' }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569', fontFamily: 'Outfit', fontSize: '12.5px', pr: 3 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((item) => {
                    const typeStyle = getLeaveTypeStyle(item.leaveType);
                    
                    return (
                      <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        {/* Employee Name */}
                        <TableCell sx={{ pl: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: '11px', bgcolor: getAvatarColor(item.employeeName), fontWeight: 'bold', fontFamily: 'Outfit' }}>
                              {item.employeeName ? item.employeeName[0].toUpperCase() : 'E'}
                            </Avatar>
                            <Typography sx={{ fontWeight: 'bold', color: '#0f172a', fontFamily: 'Outfit', fontSize: '13.5px' }}>
                              {item.employeeName}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        {/* Code */}
                        <TableCell sx={{ fontWeight: 700, color: '#2563eb', fontFamily: 'Inter', fontSize: '12.5px' }}>
                          {item.employeeCode}
                        </TableCell>
                        
                        {/* Type Chip */}
                        <TableCell>
                          <Chip
                            label={typeStyle.label}
                            size="small"
                            sx={{ 
                              fontWeight: 'bold', 
                              fontSize: '10.5px',
                              color: typeStyle.color, 
                              bgcolor: typeStyle.bg,
                              borderRadius: '6px',
                              fontFamily: 'Outfit'
                            }}
                          />
                        </TableCell>
                        
                        {/* Duration */}
                        <TableCell sx={{ fontFamily: 'Inter', fontSize: '12.5px', color: '#475569' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.startDate}</span>
                          <span style={{ margin: '0 4px', color: '#94a3b8' }}>to</span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.endDate}</span>
                        </TableCell>
                        
                        {/* Reason */}
                        <TableCell sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter', fontSize: '12.5px', color: '#64748b' }}>
                          <Tooltip title={item.reason} arrow>
                            <span>{item.reason}</span>
                          </Tooltip>
                        </TableCell>
                        
                        {/* Actions */}
                        <TableCell align="right" sx={{ pr: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<ApproveIcon sx={{ fontSize: 13 }} />}
                              onClick={() => handleProcess(item.id, 'approve')}
                              sx={{ 
                                textTransform: 'none', 
                                borderRadius: 2.2,
                                fontFamily: 'Outfit',
                                fontWeight: 700,
                                fontSize: '11.5px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                boxShadow: 'none',
                                px: 2,
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                  boxShadow: 'none',
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
                                borderRadius: 2.2,
                                fontFamily: 'Outfit',
                                fontWeight: 700,
                                fontSize: '11.5px',
                                borderColor: '#fee2e2',
                                color: '#ef4444',
                                bgcolor: '#fef2f2',
                                px: 2,
                                '&:hover': {
                                  borderColor: '#fca5a5',
                                  bgcolor: '#fee2e2'
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Mobile Cards List View (xs only) */}
            <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 2 }}>
              {requests.map((item) => {
                const typeStyle = getLeaveTypeStyle(item.leaveType);
                
                return (
                  <Card 
                    key={item.id} 
                    sx={{ 
                      borderRadius: 3.5, 
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px 0 rgba(0, 0, 0, 0.01)',
                      bgcolor: '#fff',
                      p: 2.2
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8 }}>
                      <Typography sx={{ fontWeight: 700, color: '#2563eb', fontSize: '11px', fontFamily: 'Inter' }}>
                        {item.employeeCode}
                      </Typography>
                      <Chip
                        label={typeStyle.label}
                        size="small"
                        sx={{ 
                          fontWeight: 'bold', 
                          fontSize: '9.5px', 
                          fontFamily: 'Outfit', 
                          color: typeStyle.color, 
                          bgcolor: typeStyle.bg,
                          borderRadius: '4px',
                          height: 18
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.8 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: '11px', bgcolor: getAvatarColor(item.employeeName), fontWeight: 'bold', fontFamily: 'Outfit' }}>
                        {item.employeeName ? item.employeeName[0].toUpperCase() : 'E'}
                      </Avatar>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '14.5px', color: '#0f172a', fontFamily: 'Outfit' }}>
                        {item.employeeName}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '12px', fontFamily: 'Inter' }}>
                        📅 From: <strong style={{ color: '#334155' }}>{item.startDate}</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '12px', fontFamily: 'Inter' }}>
                        📅 To: <strong style={{ color: '#334155' }}>{item.endDate}</strong>
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontFamily: 'Inter', fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold' }}>Reason</Typography>
                      <Typography variant="body2" sx={{ color: '#475569', fontFamily: 'Inter', fontSize: '12px', mt: 0.5, lineHeight: 1.4 }}>
                        {item.reason}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2, borderColor: '#f1f5f9' }} />

                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<ApproveIcon sx={{ fontSize: 14 }} />}
                        onClick={() => handleProcess(item.id, 'approve')}
                        sx={{ 
                          textTransform: 'none', 
                          borderRadius: 2,
                          fontFamily: 'Outfit',
                          fontWeight: 700,
                          fontSize: '11.5px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          boxShadow: 'none',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            boxShadow: 'none',
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
                        startIcon={<RejectIcon sx={{ fontSize: 14 }} />}
                        onClick={() => handleProcess(item.id, 'reject')}
                        sx={{ 
                          textTransform: 'none', 
                          borderRadius: 2,
                          fontFamily: 'Outfit',
                          fontWeight: 700,
                          fontSize: '11.5px',
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
                );
              })}
            </Box>
          </>
        )}
      </Paper>
    </AdminLayout>
  );
};

export default AdminLeaves;
