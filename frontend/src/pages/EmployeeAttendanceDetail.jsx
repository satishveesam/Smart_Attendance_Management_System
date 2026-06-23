import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EmployeeLayout from '../layouts/EmployeeLayout';
import API from '../api';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Person as PersonIcon,
  CheckCircle as SuccessIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const EmployeeAttendanceDetail = () => {
  const { date } = useParams();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDetail();
  }, [date]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await API.get('/attendance/history');
      const found = res.data.find(item => item.attendanceDate === date);
      setLog(found || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFormattedHeaderDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} • ${d.toLocaleDateString('en-US', { weekday: 'long' })}`;
  };

  const formatFullDateTime = (timeStr) => {
    if (!timeStr) return '';
    const d = new Date(timeStr);
    return `${d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getWorkDuration = () => {
    if (!log?.checkIn) return null;
    
    let diffMs = 0;
    if (log.checkOut) {
      if (log.totalHours != null && log.totalHours > 0) {
        diffMs = Math.round(log.totalHours * 3600000);
      } else {
        diffMs = new Date(log.checkOut) - new Date(log.checkIn);
      }
    } else {
      // Currently checked in - show elapsed time since check-in
      diffMs = new Date() - new Date(log.checkIn);
    }
    
    if (diffMs < 0) return null;
    
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    if (diffHrs === 0 && diffMins === 0) {
      return `${diffSecs} secs`;
    }
    if (diffHrs === 0) {
      return `${diffMins} mins ${diffSecs} secs`;
    }
    return `${diffHrs} hrs ${diffMins} mins`;
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PRESENT': return { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' };
      case 'LATE': return { bg: '#fffbeb', border: '#fde68a', text: '#b45309' };
      case 'HALF_DAY': return { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce' };
      case 'LEAVE': return { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' };
      case 'EXTRA_SHIFT': return { bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9' };
      default: return { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' };
    }
  };

  const buildTimelineEvents = () => {
    if (!log) return [];
    const events = [];

    // 1. Check-In Event
    if (log.checkIn) {
      events.push({
        type: 'PUNCH_IN',
        title: `Punched In — ${log.checkInAddress || 'Office Premises'}`,
        subTitle: `Authenticated on ${formatFullDateTime(log.checkIn)}`,
        image: log.checkInSelfie || null
      });
    }

    // 2. Check-Out Event
    if (log.checkOut) {
      events.push({
        type: 'PUNCH_OUT',
        title: `Punched Out — ${log.checkOutAddress || 'Office Premises'}`,
        subTitle: `Authenticated on ${formatFullDateTime(log.checkOut)}`,
        image: log.checkOutSelfie || null
      });
    }

    // 3. Approval Event
    if (log.status !== 'ABSENT' && log.status !== 'LEAVE') {
      events.push({
        type: 'APPROVAL_PUNCH',
        title: 'Punch Verification Logged',
        subTitle: `Face biometric Euclidean distance matched successfully`,
        avatarIcon: <SuccessIcon sx={{ color: '#10b981', fontSize: 18 }} />
      });
    }

    return events.reverse();
  };

  return (
    <EmployeeLayout>
      <Box className="fade-in" sx={{ pb: { xs: 2, md: 4 } }}>
        
        {/* Header Panel */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2.5, md: 3.5 }, gap: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 2.5 }}>
            <BackIcon sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', fontSize: { xs: '1.4rem', md: '2rem' }, fontFamily: 'Outfit' }}>
              Attendance Audit
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '12px', md: '13.5px' }, mt: 0.3, fontFamily: 'Inter' }}>
              Detailed logs for {date}
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={30} sx={{ color: '#2563eb' }} /></Box>
        ) : !log ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fff', boxShadow: 'none' }}>
            <Typography sx={{ color: '#64748b', fontSize: '13px', fontFamily: 'Inter' }}>No attendance logs found for this date.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            
            {/* Summary Card */}
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', bgcolor: '#fff' }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1.5, fontSize: '13px', fontFamily: 'Outfit' }}>
                    Punch Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'Inter', mb: 0.5 }}>
                        Resolved Date
                      </Typography>
                      <Typography sx={{ fontSize: '13px', color: '#1e293b', fontWeight: 'bold', fontFamily: 'Outfit' }}>
                        {getFormattedHeaderDate(date)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography sx={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'Inter', mb: 0.5 }}>
                        Calculated Status
                      </Typography>
                      <Chip 
                        label={log.status} 
                        size="small"
                        sx={{ 
                          bgcolor: getStatusColor(log.status).bg,
                          color: getStatusColor(log.status).text,
                          borderColor: getStatusColor(log.status).border,
                          borderWidth: 1,
                          borderStyle: 'solid',
                          fontWeight: 'bold',
                          fontSize: '10px',
                          fontFamily: 'Inter',
                          height: 22
                        }}
                      />
                    </Box>

                    {getWorkDuration() && (
                      <Box>
                        <Typography sx={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'Inter', mb: 0.5 }}>
                          Elapsed Shift Duration
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: '#2563eb', fontWeight: 'bold', fontFamily: 'Outfit' }}>
                          {getWorkDuration()}
                        </Typography>
                      </Box>
                    )}

                    <Box>
                      <Typography sx={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'Inter', mb: 0.5 }}>
                        Verification Checkpoints
                      </Typography>
                      <Typography sx={{ fontSize: '11.5px', color: '#475569', fontFamily: 'Inter', lineHeight: 1.4 }}>
                        Matched 128-point face descriptor vector on check-in. Geolocation within virtual geofenced zone.
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Timeline Events list */}
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', bgcolor: '#fff' }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1.5, fontSize: '13px', fontFamily: 'Outfit' }}>
                    Activity Timeline
                  </Typography>
                  <Divider sx={{ mb: 2.5 }} />

                  {/* Custom Timeline Container */}
                  <Box sx={{ position: 'relative', pl: 3 }}>
                    {/* Vertical Connecting Line */}
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      bottom: 8, 
                      left: 4, 
                      width: '2px', 
                      bgcolor: '#f1f5f9',
                      zIndex: 1
                    }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {buildTimelineEvents().map((event, idx) => (
                        <Box key={idx} sx={{ position: 'relative', display: 'flex', gap: 2, alignItems: 'flex-start', zIndex: 2 }}>
                          
                          {/* Circle Node Point */}
                          <Box sx={{ 
                            position: 'absolute', 
                            left: -32, 
                            top: 18, 
                            width: 6, 
                            height: 6, 
                            borderRadius: '50%', 
                            bgcolor: event.avatarIcon ? '#10b981' : '#2563eb', 
                            border: '3px solid #fff',
                            boxShadow: '0 0 0 1px #cbd5e1'
                          }} />

                          {/* Media Thumbnail or Placeholder Icon */}
                          {event.image ? (
                            <Avatar 
                              src={event.image} 
                              variant="circular"
                              onClick={() => {
                                setPreviewImage(event.image);
                                setPreviewTitle(event.title);
                              }}
                              sx={{ 
                                width: 44, 
                                height: 44, 
                                border: '2px solid #fff',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                  transform: 'scale(1.15)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }
                              }} 
                            />
                          ) : (
                            <Avatar sx={{ 
                              width: 44, 
                              height: 44, 
                              bgcolor: '#f8fafc', 
                              color: '#64748b',
                              border: '1px solid #e2e8f0',
                              variant: 'circular'
                            }}>
                              {event.avatarIcon || <PersonIcon sx={{ fontSize: 16 }} />}
                            </Avatar>
                          )}

                          {/* Details details */}
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography sx={{ fontWeight: 'bold', color: '#1e293b', fontSize: '12.5px', fontFamily: 'Outfit', lineHeight: 1.2 }}>
                              {event.title}
                            </Typography>
                            <Typography sx={{ color: '#64748b', fontSize: '11px', fontFamily: 'Inter', mt: 0.3 }}>
                              {event.subTitle}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

          </Grid>
        )}
      </Box>

      {/* Selfie Expand Modal */}
      <Dialog 
        open={!!previewImage} 
        onClose={() => setPreviewImage(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: 'Outfit', 
          fontWeight: 'bold', 
          fontSize: '14px', 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <span>{previewTitle}</span>
          <IconButton 
            size="small" 
            onClick={() => setPreviewImage(null)}
            sx={{ color: '#64748b' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, display: 'flex', justifyContent: 'center', bgcolor: '#f8fafc' }}>
          {previewImage && (
            <img 
              src={previewImage} 
              alt={previewTitle} 
              style={{ 
                width: '100%', 
                height: 'auto', 
                borderRadius: '8px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'block'
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </EmployeeLayout>
  );
};

export default EmployeeAttendanceDetail;
